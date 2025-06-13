import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { Order } from './entities/order.entity';
import { MenuItem } from 'src/menu-item/entities/menu-item.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import {
  CreateOrderDto,
  CreateOrderResponse,
  InventoryStatusEnum,
  PaginationQueryDto,
  PaymentMethod,
  UpdateOrderDto,
} from 'src/dto';
import { TransactionService } from 'src/transactions/transactions.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { OrderItem } from './entities/order-item.entity';
import { Inventory } from 'src/inventory/entities/inventory.entity';
import { InventoryService } from 'src/inventory/inventory.service';
import { MenuItemService } from 'src/menu-item/menu-item.service';
import { Recipe } from 'src/recipe/entities/recipe.entity';
import { RecipeService } from 'src/recipe/recipe.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    private readonly transactionService: TransactionService,
    private readonly recipeService: RecipeService,
    private readonly inventoryService: InventoryService,
    private readonly menuItemService: MenuItemService,
  ) {}

  async create(
    input: CreateOrderDto & { requestId?: string },
  ): Promise<CreateOrderResponse> {
    return this.orderRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const { customerId, items, totalPrice, deliveryAddress, requestId } =
          input;

        // Check for idempotency using requestId
        if (requestId) {
          const existingOrder = await transactionalEntityManager.findOne(
            Order,
            {
              where: { id: requestId },
              relations: ['orderItems'],
            },
          );
          if (existingOrder) {
            return await this.transactionService.initializePayment(
              existingOrder.totalPrice,
              existingOrder.customer.email,
              existingOrder.id,
              existingOrder.transactions[0],
            );
          }
        }

        // Validate customer
        const customer = await transactionalEntityManager.findOne(Customer, {
          where: { id: customerId },
        });
        if (!customer) {
          throw new NotFoundException('Customer not found');
        }

        // Validate and deduplicate items
        const consolidatedItems = new Map<
          string,
          { menuItemId: string; quantity: number }
        >();
        for (const item of items) {
          if (!item.menuItemId || item.quantity <= 0) {
            throw new BadRequestException('Invalid menuItemId or quantity');
          }
          const existing = consolidatedItems.get(item.menuItemId) || {
            menuItemId: item.menuItemId,
            quantity: 0,
          };
          existing.quantity += item.quantity;
          consolidatedItems.set(item.menuItemId, existing);
        }
        const deduplicatedItems = Array.from(consolidatedItems.values());

        // Log deduplicated items

        // Validate deduplication
        const uniqueMenuItemIds = new Set(
          deduplicatedItems.map((item) => item.menuItemId),
        );
        if (uniqueMenuItemIds.size !== deduplicatedItems.length) {
          throw new BadRequestException(
            'Duplicate menuItemIds found after deduplication',
          );
        }

        // Extract menuItemIds
        const menuItemIds = deduplicatedItems.map((item) => item.menuItemId);

        // Fetch menu items
        const menuItems = await transactionalEntityManager.find(MenuItem, {
          where: { id: In(menuItemIds) },
        });
        if (menuItems.length !== menuItemIds.length) {
          throw new BadRequestException('One or more menu items not found');
        }

        // Validate menu item availability
        for (const menuItem of menuItems) {
          const isAvailable =
            await this.recipeService.checkMenuItemAvailability(menuItem.id, {
              transactionalEntityManager,
            });
          if (!isAvailable) {
            throw new BadRequestException(
              `Menu item ${menuItem.name} is not available`,
            );
          }
        }

        // Map menuItems
        const menuItemsMap = new Map(menuItems.map((mi) => [mi.id, mi]));

        // Prepare orderItems data (without creating entities yet)
        const orderItemsData = deduplicatedItems.map(
          ({ menuItemId, quantity }) => {
            const menuItem = menuItemsMap.get(menuItemId)!;
            return {
              menuItemId,
              quantity,
              price: menuItem.price,
              menuItem, // Keep reference for later use
            };
          },
        );

        // Calculate total price
        const calculatedTotal =
          orderItemsData.reduce(
            (sum, item) => sum + Number(item.price) * item.quantity,
            0,
          ) + 1500;

        // Validate total price
        if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
          throw new BadRequestException(
            `Total price mismatch. Expected: ${calculatedTotal.toFixed(2)}`,
          );
        }

        // Deduct inventory
        const inventoryDeductions = new Map<string, number>();
        for (const { menuItemId, quantity } of deduplicatedItems) {
          const recipes = await transactionalEntityManager.find(Recipe, {
            where: { menuItemId },
            relations: ['inventory'],
          });
          for (const recipe of recipes) {
            if (!recipe.inventory || recipe.inventory.deletedAt) {
              throw new BadRequestException(
                `Inventory item for recipe ${recipe.id} is unavailable`,
              );
            }
            const requiredQuantity = recipe.quantity * quantity;
            const currentDeduction =
              inventoryDeductions.get(recipe.inventoryId) || 0;
            inventoryDeductions.set(
              recipe.inventoryId,
              currentDeduction + requiredQuantity,
            );
          }
        }

        for (const [inventoryId, deduction] of inventoryDeductions) {
          const inventory = await transactionalEntityManager.findOne(
            Inventory,
            {
              where: { id: inventoryId, deletedAt: null },
            },
          );
          if (!inventory) {
            throw new NotFoundException(
              `Inventory item ${inventoryId} not found`,
            );
          }
          if (inventory.quantity < deduction) {
            throw new BadRequestException(
              `Insufficient inventory for item ${inventory.itemName}`,
            );
          }

          inventory.quantity -= deduction;
          inventory.status =
            inventory.quantity === 0
              ? InventoryStatusEnum.OUTOFSTOCK
              : inventory.quantity <= inventory.minimumStock
                ? InventoryStatusEnum.LOWSTOCK
                : InventoryStatusEnum.INSTOCK;

          await transactionalEntityManager.save(inventory);
        }

        // Create order WITHOUT orderItems relationship
        const order = transactionalEntityManager.create(Order, {
          customer,
          // orderItems, // ❌ Remove this line - don't include orderItems here
          totalPrice: calculatedTotal,
          deliveryAddress,
          id: requestId, // Use requestId as order ID if provided
        });

        const savedOrder = await transactionalEntityManager.save(order);

        // Check for existing orderItems (this should now be empty)
        const existingOrderItems = await transactionalEntityManager.find(
          OrderItem,
          {
            where: { order: { id: savedOrder.id } },
          },
        );
        if (existingOrderItems.length > 0) {
          throw new ConflictException(
            'Order items already exist for this order',
          );
        }

        // Now create the OrderItem entities separately
        const orderItemEntities = orderItemsData.map((itemData) =>
          transactionalEntityManager.create(OrderItem, {
            menuItemId: itemData.menuItemId,
            quantity: itemData.quantity,
            price: itemData.price,
            menuItem: itemData.menuItem,
            order: savedOrder,
            orderId: savedOrder.id,
          }),
        );

        // Insert orderItems
        try {
          const savedOrderItems = await transactionalEntityManager.save(
            OrderItem,
            orderItemEntities,
          );
        } catch (error) {
          if (error.code === '23505') {
            // PostgreSQL unique constraint violation
            throw new ConflictException(
              'Duplicate order item detected for this order',
            );
          }
          throw error;
        }

        let transaction: Transaction;
        try {
          transaction = await this.transactionService.create(
            {
              orderId: savedOrder.id,
              paymentMethod: PaymentMethod.CARD,
              amount: savedOrder.totalPrice,
            },
            { transactionalEntityManager },
          );
        } catch (error) {
          throw new InternalServerErrorException(
            `Failed to create transaction: ${error.message}`,
          );
        }

        let payment: any;
        try {
          payment = await this.transactionService.initializePayment(
            transaction.amount,
            savedOrder.customer.email,
            savedOrder.id,
            transaction,
          );
        } catch (error) {
          throw new InternalServerErrorException(
            `Failed to initialize payment: ${error.message}`,
          );
        }

        await this.updateMenuItemsAvailability(
          menuItemsMap,
          transactionalEntityManager,
        );

        return payment;
      },
    );
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<{ data: Order[]; total: number }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const whereClause: any = {};
    if (query.customerId) {
      whereClause.customer = { id: query.customerId };
    }

    const [data, total] = await this.orderRepository.findAndCount({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      order: { updatedAt: 'DESC' },
      relations: ['orderItems', 'customer', 'transactions'],
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'orderItems',
        'customer',
        'transactions',
        'orderItems.menuItem',
      ],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    return this.orderRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const order = await this.findOne(id);

        // Initialize menuItemsMap with existing order items
        let menuItemsMap = new Map(
          order.orderItems.map((oi) => [oi.menuItemId, oi.menuItem]),
        );

        if (updateOrderDto.items) {
          const menuItemIds = updateOrderDto.items.map(
            (item) => item.menuItemId,
          );

          // Fetch menu items
          const menuItems = await transactionalEntityManager.find(MenuItem, {
            where: { id: In(menuItemIds) },
          });
          if (menuItems.length !== menuItemIds.length) {
            throw new BadRequestException('One or more menu items not found');
          }

          // Validate availability
          for (const menuItem of menuItems) {
            const isAvailable =
              await this.recipeService.checkMenuItemAvailability(menuItem.id, {
                transactionalEntityManager,
              });
            if (!isAvailable) {
              throw new BadRequestException(
                `Menu item ${menuItem.name} is not available`,
              );
            }
          }

          // Update menuItemsMap with new menu items
          menuItemsMap = new Map(menuItems.map((mi) => [mi.id, mi]));

          // Calculate inventory changes
          const oldInventoryDeductions =
            await this.calculateInventoryDeductions(
              order.orderItems,
              transactionalEntityManager,
            );
          const newInventoryDeductions = new Map<string, number>();
          for (const { menuItemId, quantity } of updateOrderDto.items) {
            const recipes = await transactionalEntityManager.find(Recipe, {
              where: { menuItemId },
              relations: ['inventory'],
            });
            for (const recipe of recipes) {
              if (!recipe.inventory || recipe.inventory.deletedAt) {
                throw new BadRequestException(
                  `Inventory item for recipe ${recipe.id} is unavailable`,
                );
              }
              const requiredQuantity = recipe.quantity * quantity;
              const currentDeduction =
                newInventoryDeductions.get(recipe.inventoryId) || 0;
              newInventoryDeductions.set(
                recipe.inventoryId,
                currentDeduction + requiredQuantity,
              );
            }
          }

          // Revert old deductions
          for (const [inventoryId, quantity] of oldInventoryDeductions) {
            const inventory = await transactionalEntityManager.findOne(
              Inventory,
              { where: { id: inventoryId } },
            );
            if (!inventory) {
              throw new NotFoundException(
                `Inventory item ${inventoryId} not found`,
              );
            }
            inventory.quantity += quantity;
            inventory.status =
              inventory.quantity <= inventory.minimumStock
                ? InventoryStatusEnum.LOWSTOCK
                : InventoryStatusEnum.INSTOCK;
            await transactionalEntityManager.save(inventory);
          }

          // Apply new deductions
          for (const [inventoryId, deduction] of newInventoryDeductions) {
            const inventory = await transactionalEntityManager.findOne(
              Inventory,
              {
                where: { id: inventoryId, deletedAt: null },
              },
            );
            if (!inventory || inventory.quantity < deduction) {
              throw new BadRequestException(
                `Insufficient inventory for item ${inventory?.itemName}`,
              );
            }
            inventory.quantity -= deduction;
            inventory.status =
              inventory.quantity === 0
                ? InventoryStatusEnum.OUTOFSTOCK
                : inventory.quantity <= inventory.minimumStock
                  ? InventoryStatusEnum.LOWSTOCK
                  : InventoryStatusEnum.INSTOCK;
            await transactionalEntityManager.save(inventory);
          }

          // Update order items
          await transactionalEntityManager.delete(OrderItem, {
            order: { id: order.id },
          });
          const newOrderItems = updateOrderDto.items.map(
            ({ menuItemId, quantity }) => {
              const menuItem = menuItemsMap.get(menuItemId)!;
              return transactionalEntityManager.create(OrderItem, {
                menuItem,
                menuItemId,
                quantity,
                price: menuItem.price,
                order,
                orderId: order.id,
              });
            },
          );
          await transactionalEntityManager.save(newOrderItems);
          order.orderItems = newOrderItems;

          // Recalculate total price
          order.totalPrice =
            newOrderItems.reduce(
              (sum, item) => sum + Number(item.price) * item.quantity,
              0,
            ) + 1500;
        }

        if (updateOrderDto.status) {
          order.status = updateOrderDto.status;
        }

        const updatedOrder = await transactionalEntityManager.save(order);

        // Update menu items availability
        await this.updateMenuItemsAvailability(
          menuItemsMap,
          transactionalEntityManager,
        );

        return updatedOrder;
      },
    );
  }

  async remove(id: string): Promise<void> {
    return this.orderRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const order = await this.findOne(id);

        // Revert inventory deductions
        const inventoryDeductions = await this.calculateInventoryDeductions(
          order.orderItems,
          transactionalEntityManager,
        );
        for (const [inventoryId, quantity] of inventoryDeductions) {
          const inventory = await transactionalEntityManager.findOne(
            Inventory,
            { where: { id: inventoryId } },
          );
          inventory.quantity += quantity;
          inventory.status =
            inventory.quantity <= inventory.minimumStock
              ? InventoryStatusEnum.LOWSTOCK
              : InventoryStatusEnum.INSTOCK;
          await transactionalEntityManager.save(inventory);
        }

        // Delete order items
        await transactionalEntityManager.delete(OrderItem, {
          order: { id: order.id },
        });

        // Soft delete order
        await transactionalEntityManager.softDelete(Order, { id });

        // Update menu items availability
        const menuItemsMap = new Map(
          order.orderItems.map((oi) => [oi.menuItemId, oi.menuItem]),
        );
        await this.updateMenuItemsAvailability(
          menuItemsMap,
          transactionalEntityManager,
        );
      },
    );
  }

  private async calculateInventoryDeductions(
    orderItems: OrderItem[],
    entityManager: EntityManager,
  ): Promise<Map<string, number>> {
    const inventoryDeductions = new Map<string, number>();
    for (const orderItem of orderItems) {
      const recipes = await entityManager.find(Recipe, {
        where: { menuItemId: orderItem.menuItemId },
        relations: ['inventory'],
      });
      for (const recipe of recipes) {
        const requiredQuantity = recipe.quantity * orderItem.quantity;
        const currentDeduction =
          inventoryDeductions.get(recipe.inventoryId) || 0;
        inventoryDeductions.set(
          recipe.inventoryId,
          currentDeduction + requiredQuantity,
        );
      }
    }
    return inventoryDeductions;
  }

  private async updateMenuItemsAvailability(
    menuItemsMap: Map<string, MenuItem>,
    entityManager: EntityManager,
  ): Promise<void> {
    for (const [menuItemId, menuItem] of menuItemsMap) {
      const isAvailable = await this.recipeService.checkMenuItemAvailability(
        menuItemId,
        { transactionalEntityManager: entityManager },
      );
      if (menuItem.isAvailable !== isAvailable) {
        menuItem.isAvailable = isAvailable;
        await entityManager.save(menuItem);
      }
    }
  }
}
