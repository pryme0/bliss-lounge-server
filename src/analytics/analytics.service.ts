import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import {
  AnalyticsResponseDto,
  TopSellingItemDto,
  RevenueGraphPointDto,
  AnalyticsFiltersDto,
} from 'src/dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
  ) {}

  async getAnalytics(
    filters: AnalyticsFiltersDto = {},
  ): Promise<AnalyticsResponseDto> {
    const { startDate, endDate, menuItemIds } = this.normalizeFilters(filters);

    // Current period queries
    const orderQuery = this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: 'completed' })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (menuItemIds && menuItemIds.length > 0) {
      orderQuery.andWhere(
        'order.id IN (SELECT orderId FROM order_item WHERE menuItemId IN (:...menuItemIds))',
        {
          menuItemIds,
        },
      );
    }

    // Total Revenue and Total Orders
    const orderStats = await orderQuery
      .clone()
      .select('SUM(order.totalPrice)', 'totalRevenue')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .getRawOne();

    const totalRevenue = parseFloat(orderStats?.totalRevenue || 0);
    const totalOrders = parseInt(orderStats?.totalOrders || 0, 10);

    // Total Customers
    const totalCustomers = await orderQuery
      .clone()
      .select('COUNT(DISTINCT order.customerId)', 'totalCustomers')
      .getRawOne()
      .then((result) => parseInt(result?.totalCustomers || 0, 10));

    // Average Order Value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top-Selling Items
    const topSellingItemsQuery = this.orderItemRepository
      .createQueryBuilder('order_item')
      .innerJoin('order_item.order', 'order')
      .innerJoin('order_item.menuItem', 'menu_item')
      .select('menu_item.id', 'menuItemId')
      .addSelect('menu_item.name', 'name')
      .addSelect('menu_item.imageUrl', 'imageUrl')
      .addSelect('SUM(order_item.quantity)', 'totalQuantity')
      .addSelect('SUM(order_item.quantity * order_item.price)', 'totalRevenue')
      .where('order.status = :status', { status: 'completed' })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (menuItemIds && menuItemIds.length > 0) {
      topSellingItemsQuery.andWhere(
        'order_item.menuItemId IN (:...menuItemIds)',
        {
          menuItemIds,
        },
      );
    }

    const topSellingItems = await topSellingItemsQuery
      .groupBy('menu_item.id')
      .addGroupBy('menu_item.name')
      .addGroupBy('menu_item.imageUrl')
      .orderBy('"totalQuantity"', 'DESC')
      .limit(5)
      .getRawMany();

    // Revenue Graph (Daily)
    const revenueGraph = await orderQuery
      .clone()
      .select("TO_CHAR(order.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(order.totalPrice)', 'revenue')
      .groupBy("TO_CHAR(order.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    // Previous period for percentage changes
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(endDate);
    const periodDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    prevStartDate.setDate(prevStartDate.getDate() - periodDays);
    prevEndDate.setDate(prevEndDate.getDate() - periodDays);

    const prevOrderQuery = this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: 'completed' })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate: prevStartDate,
        endDate: prevEndDate,
      });

    if (menuItemIds && menuItemIds.length > 0) {
      prevOrderQuery.andWhere(
        'order.id IN (SELECT orderId FROM order_item WHERE menuItemId IN (:...menuItemIds))',
        {
          menuItemIds,
        },
      );
    }

    const prevOrderStats = await prevOrderQuery
      .clone()
      .select('SUM(order.totalPrice)', 'totalRevenue')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .getRawOne();

    const prevTotalRevenue = parseFloat(prevOrderStats?.totalRevenue || 0);
    const prevTotalOrders = parseInt(prevOrderStats?.totalOrders || 0, 10);

    const prevTotalCustomers = await prevOrderQuery
      .clone()
      .select('COUNT(DISTINCT order.customerId)', 'totalCustomers')
      .getRawOne()
      .then((result) => parseInt(result?.totalCustomers || 0, 10));

    const prevAverageOrderValue =
      prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0;

    // Calculate percentage changes
    const totalRevenueChange =
      prevTotalRevenue > 0
        ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
        : 0;
    const totalOrdersChange =
      prevTotalOrders > 0
        ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100
        : 0;
    const totalCustomersChange =
      prevTotalCustomers > 0
        ? ((totalCustomers - prevTotalCustomers) / prevTotalCustomers) * 100
        : 0;
    const averageOrderValueChange =
      prevAverageOrderValue > 0
        ? ((averageOrderValue - prevAverageOrderValue) /
            prevAverageOrderValue) *
          100
        : 0;

    // Format response
    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalRevenueChange: parseFloat(totalRevenueChange.toFixed(1)),
      totalOrders,
      totalOrdersChange: parseFloat(totalOrdersChange.toFixed(1)),
      totalCustomers,
      totalCustomersChange: parseFloat(totalCustomersChange.toFixed(1)),
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      averageOrderValueChange: parseFloat(averageOrderValueChange.toFixed(1)),
      topSellingItems: topSellingItems.map(
        (item): TopSellingItemDto => ({
          menuItemId: item.menuItemId,
          name: item.name,
          imageUrl: item.imageUrl || '',
          totalQuantity: parseInt(item.totalQuantity, 10),
          totalRevenue: parseFloat(parseFloat(item.totalRevenue).toFixed(2)),
        }),
      ),
      revenueGraph: revenueGraph.map(
        (point): RevenueGraphPointDto => ({
          date: point.date,
          revenue: parseFloat(parseFloat(point.revenue).toFixed(2)),
        }),
      ),
    };
  }

  private normalizeFilters(filters: AnalyticsFiltersDto): {
    startDate: Date;
    endDate: Date;
    menuItemIds?: string[];
  } {
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date();
    startDate.setDate(endDate.getDate() - 30); // Default: last 30 days
    const menuItemIds =
      filters.menuItemIds && filters.menuItemIds.length > 0
        ? filters.menuItemIds
        : undefined;
    return { startDate, endDate, menuItemIds };
  }
}
