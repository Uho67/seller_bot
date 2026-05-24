import { Update, Action, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { SalePostService } from '../../sale-post/sale-post.service';
import { CategoriesService } from '../../categories/categories.service';
import { ProductsService } from '../../products/products.service';
import { ButtonsService } from '../../buttons/buttons.service';
import { CategoryType } from '../../../database/entities/category-post.entity';
import {
  buildAdminButtonInline,
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
      const [catalogCat, categories, salePost, buttons] = await Promise.all([
        this.categoriesService.findByType(CategoryType.CATALOG),
        this.categoriesService.findAllExceptCatalog(),
        this.salePostService.get(),
        this.buttonsService.getAll(),
      ]);

      const keyboard: any[][] = [];

      const saleBtn = buildSalePostButton(salePost);
      if (saleBtn) keyboard.push([saleBtn]);

      for (let i = 0; i < categories.length; i += 2) {
        const row: any[] = [{ text: categories[i].name, callback_data: `category_${categories[i].id}` }];
        if (categories[i + 1]) {
          row.push({ text: categories[i + 1].name, callback_data: `category_${categories[i + 1].id}` });
        }
        keyboard.push(row);
      }

      const adminBtn = buildAdminButtonInline(buttons.admin);
      if (adminBtn) keyboard.push([adminBtn]);

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
}
