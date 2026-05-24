import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CategoryPost, CategoryType } from '../entities/category-post.entity';
import { ProductPost } from '../entities/product-post.entity';
import { WelcomePost } from '../entities/welcome-post.entity';
import { SalePost } from '../entities/sale-post.entity';
import { Admin } from '../entities/admin.entity';
import { OrderButton } from '../entities/order-button.entity';
import { AdminButton } from '../entities/admin-button.entity';
import { MainMenuButton } from '../entities/main-menu-button.entity';
import { ChannelButton } from '../entities/channel-button.entity';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    @InjectRepository(CategoryPost) private categoryRepo: Repository<CategoryPost>,
    @InjectRepository(ProductPost) private productRepo: Repository<ProductPost>,
    @InjectRepository(WelcomePost) private welcomeRepo: Repository<WelcomePost>,
    @InjectRepository(SalePost) private saleRepo: Repository<SalePost>,
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    @InjectRepository(OrderButton) private orderBtnRepo: Repository<OrderButton>,
    @InjectRepository(AdminButton) private adminBtnRepo: Repository<AdminButton>,
    @InjectRepository(MainMenuButton) private mainMenuBtnRepo: Repository<MainMenuButton>,
    @InjectRepository(ChannelButton) private channelBtnRepo: Repository<ChannelButton>,
  ) {}

  async onModuleInit() {
    await this.seedCategories();
    await this.seedProducts();
    await this.seedSingletons();
    await this.seedButtons();
    await this.seedAdmin();
  }

  private async seedCategories() {
    const defaults = [
      { type: CategoryType.CATALOG, name: 'Каталог', order: 0 },
      { type: CategoryType.RIDINA, name: 'Ridina', order: 1 },
      { type: CategoryType.POD, name: 'Pods', order: 2 },
      { type: CategoryType.CARTRIDZH, name: 'Cartr', order: 3 },
    ];

    for (const cat of defaults) {
      const exists = await this.categoryRepo.findOne({ where: { type: cat.type } });
      if (!exists) {
        await this.categoryRepo.save(this.categoryRepo.create(cat));
      }
    }
  }

  private async seedProducts() {
    const ridinaCat = await this.categoryRepo.findOne({ where: { type: CategoryType.RIDINA } });
    if (!ridinaCat) return;

    const defaults = [
      { name: 'Chaser', order: 1 },
      { name: 'Chaser LUX', order: 2 },
      { name: 'Chaser MINT', order: 3 },
      { name: 'Elfliq', order: 4 },
    ];

    for (const p of defaults) {
      const exists = await this.productRepo.findOne({ where: { name: p.name } });
      if (!exists) {
        const product = this.productRepo.create({ name: p.name, order: p.order, is_enabled: true });
        product.categories = [ridinaCat];
        await this.productRepo.save(product);
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
  }

  private async seedAdmin() {
    const count = await this.adminRepo.count();
    if (count === 0) {
      const password_hash = await bcrypt.hash('admin', 10);
      await this.adminRepo.save(this.adminRepo.create({ name: 'admin', password_hash }));
    }
  }
}
