import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { Mailout, PostType } from '../../database/entities/mailout.entity';
import { UsersService } from '../users/users.service';
import { MailoutPostService } from './mailout-post.service';
import { MailoutSenderService } from './mailout-sender.service';
import { CreateMailoutDto } from './dto/create-mailout.dto';

const BATCH_SIZE = 1000;
const RATE_DELAY_MS = 50; // 20 sends/sec

@Injectable()
export class MailoutService {
  private readonly logger = new Logger(MailoutService.name);
  private processing = false;

  constructor(
    @InjectRepository(Mailout) private mailoutRepo: Repository<Mailout>,
    private usersService: UsersService,
    private postService: MailoutPostService,
    private senderService: MailoutSenderService,
    @InjectBot() private bot: Telegraf,
  ) {}

  findAll(filters: { post_type?: string; post_id?: number; is_sent?: boolean }) {
    const where: any = {};
    if (filters.post_type) where.post_type = filters.post_type as PostType;
    if (filters.post_id != null) where.post_id = filters.post_id;
    if (filters.is_sent != null) where.is_sent = filters.is_sent;
    return this.mailoutRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async deleteRecords(ids: number[]): Promise<{ deleted: number }> {
    const result = await this.mailoutRepo.delete({ id: In(ids) });
    return { deleted: result.affected ?? 0 };
  }

  async unsendMessages(ids: number[]): Promise<{ deleted: number; failed: number }> {
    const records = await this.mailoutRepo.find({ where: { id: In(ids), is_sent: true } });
    let deleted = 0;
    let failed = 0;

    for (const record of records) {
      if (record.message_id) {
        try {
          await this.bot.telegram.deleteMessage(record.chat_id, Number(record.message_id));
          deleted++;
        } catch {
          failed++;
        }
      }
    }

    await this.mailoutRepo.delete({ id: In(ids) });
    return { deleted, failed };
  }

  async deleteAllRecords(): Promise<{ deleted: number }> {
    const count = await this.mailoutRepo.count();
    await this.mailoutRepo.clear();
    return { deleted: count };
  }

  async unsendAllMessages(): Promise<{ deleted: number; failed: number }> {
    const records = await this.mailoutRepo.find({ where: { is_sent: true } });
    let deleted = 0;
    let failed = 0;

    for (const record of records) {
      if (record.message_id) {
        try {
          await this.bot.telegram.deleteMessage(record.chat_id, Number(record.message_id));
          deleted++;
        } catch {
          failed++;
        }
      }
    }

    await this.mailoutRepo.clear();
    return { deleted, failed };
  }

  async createAndSend(dto: CreateMailoutDto): Promise<{ queued: number }> {
    const chatIds =
      dto.chat_ids === 'all'
        ? (await this.usersService.findAllActive()).map((u) => u.chat_id).filter(Boolean)
        : Array.isArray(dto.chat_ids)
          ? dto.chat_ids
          : [dto.chat_ids];

    const records = chatIds.map((chat_id) =>
      this.mailoutRepo.create({ chat_id, post_id: dto.post_id, post_type: dto.post_type, is_sent: false }),
    );
    await this.mailoutRepo.save(records);

    return { queued: records.length };
  }

  @Cron('*/3 * * * *')
  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      const batch = await this.mailoutRepo.find({
        where: { is_sent: false },
        order: { id: 'ASC' },
        take: BATCH_SIZE,
      });

      if (!batch.length) return;

      const { buttons, catalogCat, botSettings, shippingPost } = await this.senderService.getKeyboardContext();

      const postCache = new Map<string, any>();
      const fileIdCache = new Map<string, string>();
      let sent = 0;
      let failed = 0;

      for (const record of batch) {
        const key = `${record.post_type}:${record.post_id}`;

        if (!postCache.has(key)) {
          postCache.set(key, await this.postService.getPost(record.post_type, record.post_id));
        }

        const post = postCache.get(key);
        const cachedFileId = fileIdCache.get(key) ?? post?.telegram_file_id ?? null;
        const keyboard = this.senderService.buildKeyboard(record.post_type, buttons, catalogCat, botSettings, shippingPost);

        try {
          const { msgId, fileId } = await this.senderService.sendPost(record.chat_id, post, cachedFileId, keyboard);
          if (fileId) {
            fileIdCache.set(key, fileId);
            await this.postService.updateFileId(record.post_type, record.post_id, fileId);
          }
          record.is_sent = true;
          record.message_id = String(msgId);
          sent++;
        } catch (err: any) {
          const code = err?.response?.error_code;
          const desc = err?.response?.description ?? err?.message ?? String(err);
          this.logger.warn(`Send failed chat_id=${record.chat_id} code=${code} desc="${desc}"`);
          if (code === 403) {
            await this.usersService.setInactive(record.chat_id);
          }
          record.is_sent = true;
          failed++;
        }

        await this.mailoutRepo.save(record);
        await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
      }

      this.logger.log(`Queue processed: sent=${sent}, failed=${failed}`);
    } finally {
      this.processing = false;
    }
  }
}
