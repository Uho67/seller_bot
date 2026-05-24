import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeds/seeder.service';
import { CategoryPost } from './entities/category-post.entity';
import { ProductPost } from './entities/product-post.entity';
import { WelcomePost } from './entities/welcome-post.entity';
import { SalePost } from './entities/sale-post.entity';
import { Admin } from './entities/admin.entity';
import { OrderButton } from './entities/order-button.entity';
import { AdminButton } from './entities/admin-button.entity';
import { MainMenuButton } from './entities/main-menu-button.entity';
import { ChannelButton } from './entities/channel-button.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryPost, ProductPost, WelcomePost, SalePost, Admin,
      OrderButton, AdminButton, MainMenuButton, ChannelButton,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class DatabaseModule {}
