import { Update, Start, Action, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { WelcomePostService } from '../../welcome-post/welcome-post.service';
import { SalePostService } from '../../sale-post/sale-post.service';
import { CategoriesService } from '../../categories/categories.service';
import { ButtonsService } from '../../buttons/buttons.service';
import { CategoryType } from '../../../database/entities/category-post.entity';
import {
  buildOrderButtonRow,
  buildAdminButtonInline,
  buildChannelButtonInline,
  buildMainMenuButtonInline,
  buildSalePostButton,
  getImagePath,
  sendOrEditWithMedia,
} from '../bot.helpers';

@Update()
export class MainMenuUpdate {
  constructor(
    private usersService: UsersService,
    private welcomePostService: WelcomePostService,
    private salePostService: SalePostService,
    private categoriesService: CategoriesService,
    private buttonsService: ButtonsService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    try {
      await this.usersService.upsertUser(ctx.from);
    } catch {}
    await this.renderMainMenu(ctx);
  }

  @Action('main_menu')
  async onMainMenu(@Ctx() ctx: Context) {
    try { await (ctx as any).answerCbQuery(); } catch {}
    await this.renderMainMenu(ctx);
  }

  async renderMainMenu(ctx: Context) {
    try {
      const [welcomePost, salePost, buttons] = await Promise.all([
        this.welcomePostService.get(),
        this.salePostService.get(),
        this.buttonsService.getAll(),
      ]);

      const keyboard: any[][] = [];

      const catalogCat = await this.categoriesService.findByType(CategoryType.CATALOG);
      keyboard.push([{ text: catalogCat?.name || 'Каталог', callback_data: 'catalog' }]);

      const saleBtn = buildSalePostButton(salePost);
      if (saleBtn) keyboard.push([saleBtn]);

      const channelBtn = buildChannelButtonInline(buttons.channel);
      if (channelBtn) keyboard.push([channelBtn]);

      const orderAdminRow: any[] = [];
      const orderBtn = buildOrderButtonRow(buttons.order);
      if (orderBtn) orderAdminRow.push(orderBtn);
      const adminBtn = buildAdminButtonInline(buttons.admin);
      if (adminBtn) orderAdminRow.push(adminBtn);
      if (orderAdminRow.length) keyboard.push(orderAdminRow);

      const caption = welcomePost?.description || 'Ласкаво просимо!';
      const imagePath = getImagePath(welcomePost?.image);

      await sendOrEditWithMedia(ctx, imagePath, caption, keyboard,
        welcomePost?.telegram_file_id,
        welcomePost ? (id) => this.welcomePostService.updateTelegramFileId(welcomePost.id, id) : undefined,
      );
    } catch (err: any) {
      console.error('[renderMainMenu] error:', err?.message ?? err);
      if (err?.response?.error_code === 403) {
        await this.usersService.setInactive(String(ctx.from?.id));
      }
    }
  }
}
