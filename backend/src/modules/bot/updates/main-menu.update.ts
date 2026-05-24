import { Update, Start, Action, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { WelcomePostService } from '../../welcome-post/welcome-post.service';
import { SalePostService } from '../../sale-post/sale-post.service';
import { CategoriesService } from '../../categories/categories.service';
import { ButtonsService } from '../../buttons/buttons.service';
import { CategoryType } from '../../../database/entities/category-post.entity';
import {
  buildAdminButtonInline,
  buildChannelButtonInline,
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
      const [welcomePost, catalogCat, salePost, buttons] = await Promise.all([
        this.welcomePostService.get(),
        this.categoriesService.findByType(CategoryType.CATALOG),
        this.salePostService.get(),
        this.buttonsService.getAll(),
      ]);

      const keyboard: any[][] = [];

      keyboard.push([{ text: catalogCat?.name || 'Каталог', callback_data: 'catalog' }]);

      const saleBtn = buildSalePostButton(salePost);
      if (saleBtn) keyboard.push([saleBtn]);

      const adminBtn = buildAdminButtonInline(buttons.admin);
      if (adminBtn) keyboard.push([adminBtn]);

      const channelBtn = buildChannelButtonInline(buttons.channel);
      if (channelBtn) keyboard.push([channelBtn]);

      const caption = welcomePost?.description || 'Ласкаво просимо!';
      const imagePath = getImagePath(welcomePost?.image);

      await sendOrEditWithMedia(ctx, imagePath, caption, keyboard,
        welcomePost?.telegram_file_id,
        welcomePost ? (id) => this.welcomePostService.updateTelegramFileId(welcomePost.id, id) : undefined,
      );
    } catch (err: any) {
      if (err?.response?.error_code === 403) {
        await this.usersService.setInactive(String(ctx.from?.id));
      }
    }
  }
}
