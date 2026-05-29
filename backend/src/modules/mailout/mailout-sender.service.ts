import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';
import { PostType } from '../../database/entities/mailout.entity';
import { ButtonsService } from '../buttons/buttons.service';
import { CategoriesService } from '../categories/categories.service';
import { CategoryType } from '../../database/entities/category-post.entity';
import {
  buildOrderButtonRow,
  buildAdminButtonInline,
  buildChannelButtonInline,
  buildMainMenuButtonInline,
} from '../bot/bot.helpers';

@Injectable()
export class MailoutSenderService {
  constructor(
    private buttonsService: ButtonsService,
    private categoriesService: CategoriesService,
    @InjectBot() private bot: Telegraf,
  ) {}

  async getKeyboardContext() {
    const [buttons, catalogCat] = await Promise.all([
      this.buttonsService.getAll(),
      this.categoriesService.findByType(CategoryType.CATALOG),
    ]);
    return { buttons, catalogCat };
  }

  buildKeyboard(postType: PostType, buttons: any, catalogCat: any): any[][] {
    const keyboard: any[][] = [];

    if (postType === PostType.SALE) {
      const orderBtn = buildOrderButtonRow(buttons.order);
      const adminBtn = buildAdminButtonInline(buttons.admin);
      const row1 = [orderBtn, adminBtn].filter(Boolean);
      if (row1.length) keyboard.push(row1);
      keyboard.push([{ text: catalogCat?.name || 'Каталог', callback_data: 'catalog' }]);
    } else if (postType === PostType.PRODUCT) {
      const orderBtn = buildOrderButtonRow(buttons.order);
      if (orderBtn) keyboard.push([orderBtn]);
      const adminBtn = buildAdminButtonInline(buttons.admin);
      const channelBtn = buildChannelButtonInline(buttons.channel);
      const row2 = [adminBtn, channelBtn].filter(Boolean);
      if (row2.length) keyboard.push(row2);
    } else {
      const orderBtn = buildOrderButtonRow(buttons.order);
      const channelBtn = buildChannelButtonInline(buttons.channel);
      const row1 = [orderBtn, channelBtn].filter(Boolean);
      if (row1.length) keyboard.push(row1);
    }

    keyboard.push([buildMainMenuButtonInline(buttons.mainMenu)]);
    return keyboard;
  }

  async sendPost(
    chatId: string,
    post: any,
    cachedFileId: string | null,
    keyboard: any[][],
  ): Promise<{ msgId: number; fileId: string | null }> {
    const caption = [post?.name, post?.description].filter(Boolean).join('\n\n');
    const reply_markup = { inline_keyboard: keyboard };

    if (cachedFileId) {
      const res = await this.bot.telegram.sendPhoto(chatId, cachedFileId, { caption, reply_markup, parse_mode: 'HTML' });
      return { msgId: res.message_id, fileId: null };
    }

    if (post?.image) {
      const imagePath = path.join(__dirname, '..', '..', '..', '..', 'uploads', post.image);
      if (fs.existsSync(imagePath)) {
        const res = await this.bot.telegram.sendPhoto(
          chatId,
          { source: fs.createReadStream(imagePath) },
          { caption, reply_markup, parse_mode: 'HTML' },
        );
        const fileId =
          Array.isArray(res.photo) && res.photo.length > 0
            ? res.photo[res.photo.length - 1].file_id
            : null;
        return { msgId: res.message_id, fileId };
      }
    }

    const res = await this.bot.telegram.sendMessage(chatId, caption || 'Post', { reply_markup, parse_mode: 'HTML' });
    return { msgId: res.message_id, fileId: null };
  }
}
