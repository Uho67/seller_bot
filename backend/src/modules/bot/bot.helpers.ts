import { Context } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';
import { OrderButton } from '../../database/entities/order-button.entity';
import { AdminButton } from '../../database/entities/admin-button.entity';
import { MainMenuButton } from '../../database/entities/main-menu-button.entity';
import { ChannelButton } from '../../database/entities/channel-button.entity';
import { ProductPost } from '../../database/entities/product-post.entity';
import { SalePost } from '../../database/entities/sale-post.entity';

export function buildOrderButtonRow(btn: OrderButton) {
  if (!btn?.telegram_user_link) return null;
  const url = btn.prefill_text
    ? `${btn.telegram_user_link}?text=${encodeURIComponent(btn.prefill_text)}`
    : btn.telegram_user_link;
  return { text: btn.name, url };
}

export function buildAdminButtonInline(btn: AdminButton) {
  if (!btn?.telegram_user_link) return null;
  return { text: btn.name, url: btn.telegram_user_link };
}

export function buildChannelButtonInline(btn: ChannelButton) {
  if (!btn?.channel_link) return null;
  return { text: btn.name, url: btn.channel_link };
}

export function buildMainMenuButtonInline(btn: MainMenuButton) {
  return { text: btn.name.toUpperCase(), callback_data: 'main_menu' };
}

export function buildProductGrid(products: ProductPost[], source?: string) {
  const suffix = source ? `_${source}` : '';
  const rows = [];
  for (let i = 0; i < products.length; i += 2) {
    const row = [{ text: products[i].name, callback_data: `product_${products[i].id}${suffix}` }];
    if (products[i + 1]) {
      row.push({ text: products[i + 1].name, callback_data: `product_${products[i + 1].id}${suffix}` });
    }
    rows.push(row);
  }
  return rows;
}

export function getImagePath(filename: string | null): string | null {
  if (!filename) return null;
  const p = path.join(process.cwd(), 'uploads', filename);
  return fs.existsSync(p) ? p : null;
}

function extractFileId(msg: any): string | null {
  if (msg && typeof msg === 'object' && Array.isArray(msg.photo) && msg.photo.length > 0) {
    return msg.photo[msg.photo.length - 1].file_id ?? null;
  }
  return null;
}

export async function sendOrEditWithMedia(
  ctx: Context,
  imagePath: string | null,
  caption: string,
  keyboard: any[][],
  telegramFileId?: string,
  onFileIdCaptured?: (id: string) => Promise<void>,
) {
  const reply_markup = { inline_keyboard: keyboard };
  const hasPhoto = telegramFileId || imagePath;
  const buildMedia = () => telegramFileId
    ? telegramFileId
    : { source: fs.createReadStream(imagePath!) };

  if (hasPhoto) {
    try {
      let msg: any;
      if ((ctx as any).callbackQuery) {
        msg = await (ctx as any).editMessageMedia(
          { type: 'photo', media: buildMedia(), caption },
          { reply_markup },
        );
      } else {
        msg = await ctx.replyWithPhoto(buildMedia() as any, { caption, reply_markup });
      }
      if (!telegramFileId && onFileIdCaptured) {
        const fid = extractFileId(msg);
        if (fid) await onFileIdCaptured(fid);
      }
    } catch {
      const msg = await ctx.replyWithPhoto(buildMedia() as any, { caption, reply_markup });
      if (!telegramFileId && onFileIdCaptured) {
        const fid = extractFileId(msg);
        if (fid) await onFileIdCaptured(fid);
      }
    }
  } else {
    try {
      if ((ctx as any).callbackQuery) {
        await (ctx as any).editMessageText(caption || '​', { reply_markup });
      } else {
        await ctx.reply(caption || '​', { reply_markup });
      }
    } catch {
      await ctx.reply(caption || '​', { reply_markup });
    }
  }
}

export function buildSalePostButton(salePost: SalePost) {
  if (!salePost?.is_enabled || !salePost?.name) return null;
  return { text: salePost.name, callback_data: 'sale_post' };
}
