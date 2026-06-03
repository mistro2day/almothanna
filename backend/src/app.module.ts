import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SalesModule } from './sales/sales.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { BatchesModule } from './batches/batches.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { ActivitiesModule } from './activities/activities.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { RepresentativesModule } from './representatives/representatives.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ReturnsModule } from './returns/returns.module';

@Module({
  imports: [
    SalesModule,
    AuthModule,
    ProductsModule,
    BatchesModule,
    CustomersModule,
    SuppliersModule,
    SettingsModule,
    UsersModule,
    ActivitiesModule,
    NotificationsModule,
    ReportsModule,
    RepresentativesModule,
    ExpensesModule,
    ReturnsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

