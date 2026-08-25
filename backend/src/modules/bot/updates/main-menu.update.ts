import { Update, Start, Action, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { WelcomePostService } from '../../welcome-post/welcome-post.service';
import { SalePostService } from '../../sale-post/sale-post.service';
import { ShippingPostService } from '../../shipping-post/shipping-post.service';
import { CategoriesService } from '../../categories/categories.service';
import { ButtonsService } from '../../buttons/buttons.service';
import { AppButtonService } from '../../app-button/app-button.service';
import { CategoryType } from '../../../database/entities/category-post.entity';
import {
  buildOrderButtonRow,
  buildAdminButtonInline,
  buildChannelButtonInline,
  buildMainMenuButtonInline,
  buildSalePostButton,
  buildShippingPostButton,
  buildMiniAppButton,
  getImagePath,
  sendOrEditWithMedia,
} from '../bot.helpers';

@Update()
export class MainMenuUpdate {
  constructor(
    private usersService: UsersService,
    private welcomePostService: WelcomePostService,
    private salePostService: SalePostService,
    private shippingPostService: ShippingPostService,
    private categoriesService: CategoriesService,
    private buttonsService: ButtonsService,
    private appButtonService: AppButtonService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    try {
      await this.usersService.upsertUser(ctx.from);
    } catch {}

    try {
      const appButton = await this.appButtonService.get();
      if (appButton?.is_enabled && appButton?.url) {
        await ctx.reply('📱', {
          reply_markup: {
            keyboard: [[{ text: appButton.text || '📱', web_app: { url: appButton.url } }]],
            resize_keyboard: true,
            persistent: true,
          } as any,
        });
      } else {
        const msg = await ctx.reply('\u200B', { reply_markup: { remove_keyboard: true } as any });
        try { await ctx.deleteMessage(msg.message_id); } catch {}
      }
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
      const [welcomePost, salePost, shippingPost, buttons, botSettings] = await Promise.all([
        this.welcomePostService.get(),
        this.salePostService.get(),
        this.shippingPostService.get(),
        this.buttonsService.getAll(),
        this.buttonsService.getBotSettings(),
      ]);

      const keyboard: any[][] = [];

      if (botSettings?.mode === 'mini_app') {
        const miniAppBtn = buildMiniAppButton(botSettings.mini_app_label, botSettings.mini_app_url);
        if (miniAppBtn) keyboard.push([miniAppBtn]);
        const adminBtn = buildAdminButtonInline(buttons.admin);
        if (adminBtn) keyboard.push([adminBtn]);
        const shippingBtn = buildShippingPostButton(shippingPost);
        if (shippingBtn) keyboard.push([shippingBtn]);
      } else {
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
      }

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
