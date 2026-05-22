import { Update, Action, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { SalePostService } from '../../sale-post/sale-post.service';
import { CategoriesService } from '../../categories/categories.service';
import { ButtonsService } from '../../buttons/buttons.service';
import { CategoryType } from '../../../database/entities/category-post.entity';
import {
  buildOrderButtonRow,
  buildAdminButtonInline,
  buildMainMenuButtonInline,
  getImagePath,
  sendOrEditWithMedia,
} from '../bot.helpers';

@Update()
export class SalePostUpdate {
  constructor(
    private usersService: UsersService,
    private salePostService: SalePostService,
    private categoriesService: CategoriesService,
    private buttonsService: ButtonsService,
  ) {}

  @Action('sale_post')
  async onSalePost(@Ctx() ctx: Context) {
    try { await (ctx as any).answerCbQuery(); } catch {}
    try {
      const [salePost, buttons, catalogCat] = await Promise.all([
        this.salePostService.get(),
        this.buttonsService.getAll(),
        this.categoriesService.findByType(CategoryType.CATALOG),
      ]);

      if (!salePost?.is_enabled) return;

      const keyboard: any[][] = [];

      const orderBtn = buildOrderButtonRow(buttons.order);
      const adminBtn = buildAdminButtonInline(buttons.admin);
      const row1 = [orderBtn, adminBtn].filter(Boolean);
      if (row1.length) keyboard.push(row1);

      keyboard.push([{ text: catalogCat?.name || 'Каталог', callback_data: 'catalog' }]);

      keyboard.push([buildMainMenuButtonInline(buttons.mainMenu)]);

      const caption = [salePost.name, salePost.description].filter(Boolean).join('\n\n');
      const imagePath = getImagePath(salePost.image);

      await sendOrEditWithMedia(ctx, imagePath, caption, keyboard,
        salePost.telegram_file_id,
        (id) => this.salePostService.updateTelegramFileId(salePost.id, id),
      );
    } catch (err: any) {
      if (err?.response?.error_code === 403) {
        await this.usersService.setInactive(String(ctx.from?.id));
      }
    }
  }
}
