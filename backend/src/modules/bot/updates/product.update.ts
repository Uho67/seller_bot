import { Update, Action, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { ProductsService } from '../../products/products.service';
import { ButtonsService } from '../../buttons/buttons.service';
import {
  buildOrderButtonRow,
  buildAdminButtonInline,
  buildChannelButtonInline,
  buildMainMenuButtonInline,
  getImagePath,
  sendOrEditWithMedia,
} from '../bot.helpers';

@Update()
export class ProductUpdate {
  constructor(
    private usersService: UsersService,
    private productsService: ProductsService,
    private buttonsService: ButtonsService,
  ) {}

  @Action(/^product_(\d+)(?:_(cat_\d+|all))?$/)
  async onProduct(@Ctx() ctx: Context) {
    try { await (ctx as any).answerCbQuery(); } catch {}
    try {
      const match = (ctx as any).match;
      const productId = parseInt(match[1], 10);
      const source: string | undefined = match[2];

      const [product, buttons] = await Promise.all([
        this.productsService.findById(productId),
        this.buttonsService.getAll(),
      ]);

      const keyboard: any[][] = [];
      const orderBtn = buildOrderButtonRow(buttons.order);
      if (orderBtn) keyboard.push([orderBtn]);

      const adminBtn = buildAdminButtonInline(buttons.admin);
      const channelBtn = buildChannelButtonInline(buttons.channel);
      const row2 = [adminBtn, channelBtn].filter(Boolean);
      if (row2.length) keyboard.push(row2);

      const backCallback = source === 'all'
        ? 'all_products'
        : source?.startsWith('cat_')
          ? `category_${source.slice(4)}`
          : 'catalog';
      keyboard.push([{ text: '⬅️ Повернутися', callback_data: backCallback }]);

      keyboard.push([buildMainMenuButtonInline(buttons.mainMenu)]);

      const caption = `<b>${product.name}</b>\n\n${product.description || ''}`.trim();
      const imagePath = getImagePath(product.image);

      await sendOrEditWithMedia(ctx, imagePath, caption, keyboard,
        product.telegram_file_id,
        (id) => this.productsService.updateTelegramFileId(product.id, id),
      );
    } catch (err: any) {
      if (err?.response?.error_code === 403) {
        await this.usersService.setInactive(String(ctx.from?.id));
      }
    }
  }
}
