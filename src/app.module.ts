import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItemModule } from './menu-item/menu-item.module';
import { TransactionsModule } from './transactions/transactions.module';
import { databaseConfig } from './config/database.config';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminModule } from './admin/admin.module';
import { LogAuthHeadersMiddleware } from './utils/guard';
import { CategoryModule } from './category/category.module';
import { ReservationsModule } from './reservations/reservations.module';
import { RecipeModule } from './recipe/recipe.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportModule } from './report/report.module';
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2D' },
      global: true,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    InventoryModule,
    OrdersModule,
    CustomersModule,
    MenuItemModule,
    TransactionsModule,
    AdminModule,
    CategoryModule,
    ReservationsModule,
    RecipeModule,
    AnalyticsModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
