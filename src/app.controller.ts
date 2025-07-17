import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { MenuItem } from './menu-item/entities/menu-item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { join } from 'path';
import { writeFile } from 'fs/promises';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
  ) {}

  @Get()
  async getHello(): Promise<any> {
    // // UUID validation regex

    // // Validate input
    // if (!Array.isArray(jsonData) || jsonData.length === 0) {
    //   throw new HttpException(
    //     'Invalid or empty JSON data provided',
    //     HttpStatus.BAD_REQUEST,
    //   );
    // }

    // // Start a transaction
    // const queryRunner =
    //   this.menuItemRepository.manager.connection.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();

    // try {
    //   let updatedCount = 0;

    //   // Process updates in batches (50 at a time)
    //   const batchSize = 50;
    //   for (let i = 0; i < jsonData.length; i += batchSize) {
    //     const batch = jsonData.slice(i, i + batchSize);

    //     for (const item of batch) {
    //       const result = await this.menuItemRepository.update(
    //         { id: item.id },
    //         { subCategoryId: item.subCategoryId },
    //       );

    //       if (result.affected === 0) {
    //         console.warn(`No menu item found with id: ${item.id}`);
    //       } else {
    //         updatedCount++;
    //         console.log(`Updated menu item with id: ${item.id}`);
    //       }
    //     }
    //   }

    //   // Commit transaction
    //   await queryRunner.commitTransaction();
    return {
      message: `Royal bistro server`,
    };
  }
  catch(error) {
    console.log({ error });
    // Rollback transaction on error
    // await queryRunner.rollbackTransaction();
  }

  @Get('/without-sub-category')
  async findMenuItemsWithoutSubcategories(): Promise<any> {
    // Query menu items where subCategoryId is null
    // const menuItems = await this.menuItemRepository.find({
    //   where: { subCategoryId: IsNull() },
    //   select: ['id', 'name', 'categoryId', 'category', 'subCategoryId'],
    // });

    // const response: any = {
    //   menuItemsWithoutSubcategories: menuItems.map((item) => ({
    //     id: item.id,
    //     name: item.name,
    //     category: item.category,
    //   })),
    // };

    // // Write to JSON file
    // const outputPath = join(
    //   __dirname,
    //   '..',
    //   'menuItemsWithoutSubcategories.json',
    // );
    // await writeFile(outputPath, JSON.stringify(response, null, 2), 'utf-8');

    // return response;
    {
      message: 'Success';
    }
  }
}
