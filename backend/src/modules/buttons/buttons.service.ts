import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderButton } from '../../database/entities/order-button.entity';
import { AdminButton } from '../../database/entities/admin-button.entity';
import { MainMenuButton } from '../../database/entities/main-menu-button.entity';
import { ChannelButton } from '../../database/entities/channel-button.entity';
import { UpdateOrderButtonDto } from './dto/update-order-button.dto';
import { UpdateAdminButtonDto } from './dto/update-admin-button.dto';
import { UpdateMainMenuButtonDto } from './dto/update-main-menu-button.dto';
import { UpdateChannelButtonDto } from './dto/update-channel-button.dto';

@Injectable()
export class ButtonsService {
  constructor(
    @InjectRepository(OrderButton) private orderRepo: Repository<OrderButton>,
    @InjectRepository(AdminButton) private adminRepo: Repository<AdminButton>,
    @InjectRepository(MainMenuButton) private mainMenuRepo: Repository<MainMenuButton>,
    @InjectRepository(ChannelButton) private channelRepo: Repository<ChannelButton>,
  ) {}

  async getAll() {
    const [order, admin, mainMenu, channel] = await Promise.all([
      this.orderRepo.findOne({ where: { id: 1 } }),
      this.adminRepo.findOne({ where: { id: 1 } }),
      this.mainMenuRepo.findOne({ where: { id: 1 } }),
      this.channelRepo.findOne({ where: { id: 1 } }),
    ]);
    return { order, admin, mainMenu, channel };
  }

  getOrderButton() { return this.orderRepo.findOne({ where: { id: 1 } }); }
  getAdminButton() { return this.adminRepo.findOne({ where: { id: 1 } }); }
  getMainMenuButton() { return this.mainMenuRepo.findOne({ where: { id: 1 } }); }
  getChannelButton() { return this.channelRepo.findOne({ where: { id: 1 } }); }

  async updateOrderButton(dto: UpdateOrderButtonDto) {
    const btn = await this.getOrderButton();
    Object.assign(btn, dto);
    return this.orderRepo.save(btn);
  }

  async updateAdminButton(dto: UpdateAdminButtonDto) {
    const btn = await this.getAdminButton();
    Object.assign(btn, dto);
    return this.adminRepo.save(btn);
  }

  async updateMainMenuButton(dto: UpdateMainMenuButtonDto) {
    const btn = await this.getMainMenuButton();
    Object.assign(btn, dto);
    return this.mainMenuRepo.save(btn);
  }

  async updateChannelButton(dto: UpdateChannelButtonDto) {
    const btn = await this.getChannelButton();
    Object.assign(btn, dto);
    return this.channelRepo.save(btn);
  }
}
