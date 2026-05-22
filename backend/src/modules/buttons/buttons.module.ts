import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderButton } from '../../database/entities/order-button.entity';
import { AdminButton } from '../../database/entities/admin-button.entity';
import { MainMenuButton } from '../../database/entities/main-menu-button.entity';
import { ChannelButton } from '../../database/entities/channel-button.entity';
import { ButtonsService } from './buttons.service';
import { ButtonsController } from './buttons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrderButton, AdminButton, MainMenuButton, ChannelButton])],
  controllers: [ButtonsController],
  providers: [ButtonsService],
  exports: [ButtonsService],
})
export class ButtonsModule {}
