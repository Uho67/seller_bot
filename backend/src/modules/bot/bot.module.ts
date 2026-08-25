import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { UsersModule } from '../users/users.module';
import { WelcomePostModule } from '../welcome-post/welcome-post.module';
import { SalePostModule } from '../sale-post/sale-post.module';
import { ShippingPostModule } from '../shipping-post/shipping-post.module';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';
import { ButtonsModule } from '../buttons/buttons.module';
import { AppButtonModule } from '../app-button/app-button.module';
import { MainMenuUpdate } from './updates/main-menu.update';
import { CatalogUpdate } from './updates/catalog.update';
import { SalePostUpdate } from './updates/sale-post.update';
import { ShippingPostUpdate } from './updates/shipping-post.update';
import { ProductUpdate } from './updates/product.update';
import { MenuButtonService } from './menu-button.service';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('BOT_TOKEN') || 'placeholder',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    WelcomePostModule,
    SalePostModule,
    ShippingPostModule,
    CategoriesModule,
    ProductsModule,
    ButtonsModule,
    AppButtonModule,
  ],
  providers: [MainMenuUpdate, CatalogUpdate, SalePostUpdate, ShippingPostUpdate, ProductUpdate, MenuButtonService],
  exports: [TelegrafModule],
})
export class BotModule {}
