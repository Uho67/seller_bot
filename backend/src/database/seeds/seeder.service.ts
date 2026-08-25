import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CategoryPost, CategoryType } from '../entities/category-post.entity';
import { WelcomePost } from '../entities/welcome-post.entity';
import { SalePost } from '../entities/sale-post.entity';
import { ShippingPost } from '../entities/shipping-post.entity';
import { Admin } from '../entities/admin.entity';
import { OrderButton } from '../entities/order-button.entity';
import { AdminButton } from '../entities/admin-button.entity';
import { MainMenuButton } from '../entities/main-menu-button.entity';
import { ChannelButton } from '../entities/channel-button.entity';
import { ExtraButton } from '../entities/extra-button.entity';
import { AppButton } from '../entities/app-button.entity';
import { BotSettings } from '../entities/bot-settings.entity';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    @InjectRepository(CategoryPost) private categoryRepo: Repository<CategoryPost>,
    @InjectRepository(WelcomePost) private welcomeRepo: Repository<WelcomePost>,
    @InjectRepository(SalePost) private saleRepo: Repository<SalePost>,
    @InjectRepository(ShippingPost) private shippingRepo: Repository<ShippingPost>,
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    @InjectRepository(OrderButton) private orderBtnRepo: Repository<OrderButton>,
    @InjectRepository(AdminButton) private adminBtnRepo: Repository<AdminButton>,
    @InjectRepository(MainMenuButton) private mainMenuBtnRepo: Repository<MainMenuButton>,
    @InjectRepository(ChannelButton) private channelBtnRepo: Repository<ChannelButton>,
    @InjectRepository(ExtraButton) private extraBtnRepo: Repository<ExtraButton>,
    @InjectRepository(AppButton) private appBtnRepo: Repository<AppButton>,
    @InjectRepository(BotSettings) private botSettingsRepo: Repository<BotSettings>,
  ) {}

  async onModuleInit() {
    await this.seedCategories();
    await this.seedSingletons();
    await this.seedButtons();
    await this.seedAdmin();
  }

  private async seedCategories() {
    const defaults = [
      { type: CategoryType.CATALOG, name: 'Каталог' },
      { type: CategoryType.ALL_PRODUCTS, name: 'Усi фото' },
    ];

    for (const cat of defaults) {
      const exists = await this.categoryRepo.findOne({ where: { type: cat.type } });
      if (!exists) {
        await this.categoryRepo.save(this.categoryRepo.create(cat));
      }
    }
  }

  private async seedSingletons() {
    const welcome = await this.welcomeRepo.findOne({ where: { id: 1 } });
    if (!welcome) {
      await this.welcomeRepo.save(this.welcomeRepo.create({ id: 1 }));
    }

    const sale = await this.saleRepo.findOne({ where: { id: 1 } });
    if (!sale) {
      await this.saleRepo.save(this.saleRepo.create({ id: 1, name: 'Акцiя', is_enabled: false }));
    }

    const shipping = await this.shippingRepo.findOne({ where: { id: 1 } });
    if (!shipping) {
      await this.shippingRepo.save(this.shippingRepo.create({ id: 1, name: 'Доставка', is_enabled: false }));
    }
  }

  private async seedButtons() {
    const order = await this.orderBtnRepo.findOne({ where: { id: 1 } });
    if (!order) {
      await this.orderBtnRepo.save(this.orderBtnRepo.create({ id: 1 }));
    }

    const admin = await this.adminBtnRepo.findOne({ where: { id: 1 } });
    if (!admin) {
      await this.adminBtnRepo.save(this.adminBtnRepo.create({ id: 1 }));
    }

    const mainMenu = await this.mainMenuBtnRepo.findOne({ where: { id: 1 } });
    if (!mainMenu) {
      await this.mainMenuBtnRepo.save(this.mainMenuBtnRepo.create({ id: 1 }));
    }

    const channel = await this.channelBtnRepo.findOne({ where: { id: 1 } });
    if (!channel) {
      await this.channelBtnRepo.save(this.channelBtnRepo.create({ id: 1 }));
    }

    const extra = await this.extraBtnRepo.findOne({ where: { id: 1 } });
    if (!extra) {
      await this.extraBtnRepo.save(this.extraBtnRepo.create({ id: 1 }));
    }

    const appBtn = await this.appBtnRepo.findOne({ where: { id: 1 } });
    if (!appBtn) {
      await this.appBtnRepo.save(this.appBtnRepo.create({ id: 1 }));
    }

    const botSettings = await this.botSettingsRepo.findOne({ where: { id: 1 } });
    if (!botSettings) {
      await this.botSettingsRepo.save(this.botSettingsRepo.create({ id: 1 }));
    }
  }

  private async seedAdmin() {
    const count = await this.adminRepo.count();
    if (count === 0) {
      const password_hash = await bcrypt.hash('admin', 10);
      await this.adminRepo.save(this.adminRepo.create({ name: 'admin', password_hash }));
    }
  }
}
