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

      const saleBtn = buildSalePostButton(salePost);
      if (saleBtn) keyboard.push([saleBtn]);

      const catalogCat = await this.categoriesService.findByType(CategoryType.CATALOG);
      keyboard.push([{ text: catalogCat?.name || 'Каталог', callback_data: 'catalog' }]);

      const bottomRow = [];
      const orderBtn = buildOrderButtonRow(buttons.order);
      if (orderBtn) bottomRow.push(orderBtn);
      const channelBtn = buildChannelButtonInline(buttons.channel);
      if (channelBtn) bottomRow.push(channelBtn);
      if (bottomRow.length) keyboard.push(bottomRow);

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
