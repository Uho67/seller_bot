import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegrafModule } from 'nestjs-telegraf';
import { Mailout } from '../../database/entities/mailout.entity';
import { ProductPost } from '../../database/entities/product-post.entity';
import { SalePost } from '../../database/entities/sale-post.entity';
import { WelcomePost } from '../../database/entities/welcome-post.entity';
import { UsersModule } from '../users/users.module';
import { ButtonsModule } from '../buttons/buttons.module';
import { CategoriesModule } from '../categories/categories.module';
import { MailoutService } from './mailout.service';
import { MailoutPostService } from './mailout-post.service';
import { MailoutSenderService } from './mailout-sender.service';
import { MailoutController } from './mailout.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mailout, ProductPost, SalePost, WelcomePost]),
    UsersModule,
    ButtonsModule,
    CategoriesModule,
    TelegrafModule,
  ],
  controllers: [MailoutController],
  providers: [MailoutService, MailoutPostService, MailoutSenderService],
})
export class MailoutModule {}
