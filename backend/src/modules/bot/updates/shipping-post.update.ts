import { Update, Action, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../../users/users.service';
import { ShippingPostService } from '../../shipping-post/shipping-post.service';
import { ButtonsService } from '../../buttons/buttons.service';
import {
  buildMainMenuButtonInline,
  getImagePath,
  sendOrEditWithMedia,
} from '../bot.helpers';

@Update()
export class ShippingPostUpdate {
  constructor(
    private usersService: UsersService,
    private shippingPostService: ShippingPostService,
    private buttonsService: ButtonsService,
  ) {}

  @Action('shipping_post')
  async onShippingPost(@Ctx() ctx: Context) {
    try { await (ctx as any).answerCbQuery(); } catch {}
    try {
      const [shippingPost, buttons] = await Promise.all([
        this.shippingPostService.get(),
        this.buttonsService.getAll(),
      ]);

      if (!shippingPost?.is_enabled) return;

      const keyboard: any[][] = [
        [buildMainMenuButtonInline(buttons.mainMenu)],
      ];

      const caption = [shippingPost.name, shippingPost.description].filter(Boolean).join('\n\n');
      const imagePath = getImagePath(shippingPost.image);

      await sendOrEditWithMedia(ctx, imagePath, caption, keyboard,
        shippingPost.telegram_file_id,
        (id) => this.shippingPostService.updateTelegramFileId(shippingPost.id, id),
      );
    } catch (err: any) {
      if (err?.response?.error_code === 403) {
        await this.usersService.setInactive(String(ctx.from?.id));
      }
    }
  }
}
