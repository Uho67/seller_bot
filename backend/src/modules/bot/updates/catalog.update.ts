import { Update, Action, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { SalePostService } from '../../sale-post/sale-post.service';
import { CategoriesService } from '../../categories/categories.service';
import { ProductsService } from '../../products/products.service';
import { ButtonsService } from '../../buttons/buttons.service';
import { CategoryType } from '../../../database/entities/category-post.entity';
import {
  buildOrderButtonRow,
  buildAdminButtonInline,
  buildChannelButtonInline,
  buildMainMenuButtonInline,
  buildProductGrid,
  buildSalePostButton,
  getImagePath,
  sendOrEditWithMedia,
} from '../bot.helpers';


@Update()
export class CatalogUpdate {
  constructor(
    private usersService: UsersService,
    private salePostService: SalePostService,
    private categoriesService: CategoriesService,
    private productsService: ProductsService,
    private buttonsService: ButtonsService,
  ) {}

  @Action('catalog')
  async onCatalog(@Ctx() ctx: Context) {
    try { await (ctx as any).answerCbQuery(); } catch {}
    try {
      const [catalogCat, allCategories, salePost, buttons] = await Promise.all([
        this.categoriesService.findByType(CategoryType.CATALOG),
        this.categoriesService.findAllExceptCatalog(),
        this.salePostService.get(),
        this.buttonsService.getAll(),
      ]);

      const keyboard: any[][] = [];

      const saleBtn = buildSalePostButton(salePost);
      if (saleBtn) keyboard.push([saleBtn]);

      const orderBtn = buildOrderButtonRow(buttons.order);
      if (orderBtn) keyboard.push([orderBtn]);

      const allProductsCat = allCategories.find((c) => c.type === CategoryType.ALL_PRODUCTS);
      if (allProductsCat) {
        keyboard.push([{ text: allProductsCat.name, callback_data: 'all_products' }]);
      }

      const otherCats = allCategories.filter((c) => c.type !== CategoryType.ALL_PRODUCTS);
      for (let i = 0; i < otherCats.length; i += 2) {
        const row: any[] = [{ text: otherCats[i].name, callback_data: `category_${otherCats[i].id}` }];
        if (otherCats[i + 1]) {
          row.push({ text: otherCats[i + 1].name, callback_data: `category_${otherCats[i + 1].id}` });
        }
        keyboard.push(row);
      }

      const adminChannelRow: any[] = [];
      const adminBtn = buildAdminButtonInline(buttons.admin);
      if (adminBtn) adminChannelRow.push(adminBtn);
      const channelBtn = buildChannelButtonInline(buttons.channel);
      if (channelBtn) adminChannelRow.push(channelBtn);
      if (adminChannelRow.length) keyboard.push(adminChannelRow);

      keyboard.push([buildMainMenuButtonInline(buttons.mainMenu)]);

      const caption = catalogCat?.description || catalogCat?.name || 'Каталог';
      const imagePath = getImagePath(catalogCat?.image);

      await sendOrEditWithMedia(ctx, imagePath, caption, keyboard,
        catalogCat?.telegram_file_id,
        catalogCat ? (id) => this.categoriesService.updateTelegramFileId(catalogCat.id, id) : undefined,
      );
    } catch (err: any) {
      if (err?.response?.error_code === 403) {
        await this.usersService.setInactive(String(ctx.from?.id));
      }
    }
  }

  @Action(/^category_(\d+)$/)
  async onCategory(@Ctx() ctx: Context) {
    try { await (ctx as any).answerCbQuery(); } catch {}
    try {
      const match = (ctx as any).match;
      const categoryId = parseInt(match[1], 10);

      const [products, buttons] = await Promise.all([
        this.productsService.findEnabledByCategory(categoryId),
        this.buttonsService.getAll(),
      ]);

      const keyboard: any[][] = [...buildProductGrid(products, `cat_${categoryId}`)];

      const adminBtn = buildAdminButtonInline(buttons.admin);
      if (adminBtn) keyboard.push([adminBtn]);

      keyboard.push([{ text: '⬅️ Повернутися', callback_data: 'catalog' }]);
      keyboard.push([buildMainMenuButtonInline(buttons.mainMenu)]);

      await sendOrEditWithMedia(ctx, null, 'Оберіть товар:', keyboard);
    } catch (err: any) {
      if (err?.response?.error_code === 403) {
        await this.usersService.setInactive(String(ctx.from?.id));
      }
    }
  }

  @Action('all_products')
  async onAllProducts(@Ctx() ctx: Context) {
    try { await (ctx as any).answerCbQuery(); } catch {}
    try {
      const [products, buttons] = await Promise.all([
        this.productsService.findAllEnabled(),
        this.buttonsService.getAll(),
      ]);

      const keyboard: any[][] = [...buildProductGrid(products, 'all')];

      const adminBtn = buildAdminButtonInline(buttons.admin);
      if (adminBtn) keyboard.push([adminBtn]);

      keyboard.push([{ text: '⬅️ Повернутися', callback_data: 'catalog' }]);
      keyboard.push([buildMainMenuButtonInline(buttons.mainMenu)]);

      await sendOrEditWithMedia(ctx, null, 'Всі товари:', keyboard);
    } catch (err: any) {
      if (err?.response?.error_code === 403) {
        await this.usersService.setInactive(String(ctx.from?.id));
      }
    }
  }
}
