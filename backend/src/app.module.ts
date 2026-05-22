import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { WelcomePostModule } from './modules/welcome-post/welcome-post.module';
import { SalePostModule } from './modules/sale-post/sale-post.module';
import { ButtonsModule } from './modules/buttons/buttons.module';
import { UsersModule } from './modules/users/users.module';
import { MailoutModule } from './modules/mailout/mailout.module';
import { BotModule } from './modules/bot/bot.module';
import { BackupModule } from './modules/backup/backup.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: join(__dirname, '..', 'database.sqlite'),
        entities: [join(__dirname, '**', '*.entity{.ts,.js}')],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', 'uploads'),
        serveRoot: '/uploads',
      },
      {
        rootPath: join(__dirname, '..', 'public'),
        exclude: ['/api*', '/uploads*'],
      },
    ),
    DatabaseModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    WelcomePostModule,
    SalePostModule,
    ButtonsModule,
    UsersModule,
    MailoutModule,
    BotModule,
    BackupModule,
  ],
})
export class AppModule {}
