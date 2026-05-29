import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { parse } from 'csv-parse/sync';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
  ) {}

  async upsertUser(from: { id: number; first_name?: string; last_name?: string; username?: string }) {
    const chat_id = String(from.id);
    let user = await this.repo.findOne({ where: { chat_id } });

    if (user) {
      user.first_name = from.first_name || user.first_name;
      user.last_name = from.last_name || user.last_name;
      user.user_name = from.username || user.user_name;
      user.is_active = true;
    } else {
      user = this.repo.create({
        chat_id,
        first_name: from.first_name,
        last_name: from.last_name,
        user_name: from.username,
        is_active: true,
      });
    }

    return this.repo.save(user);
  }

  async setInactive(chat_id: string) {
    await this.repo.update({ chat_id }, { is_active: false });
  }

  findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  findAllActive() {
    return this.repo
      .createQueryBuilder('user')
      .where('user.is_active = :active', { active: true })
      .andWhere('user.chat_id IS NOT NULL')
      .getMany();
  }

  count() {
    return this.repo.count();
  }

  async deleteOne(id: number) {
    await this.repo.delete(id);
  }

  async deleteMany(ids: number[]) {
    if (ids.length === 0) return;
    await this.repo.delete({ id: In(ids) });
  }

  async importFromCsv(buffer: Buffer): Promise<{ inserted: number; skipped: number }> {
    const records: Record<string, string>[] = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const existingChatIds = new Set(
      (await this.repo.find({ select: ['chat_id'] })).map((u) => u.chat_id),
    );

    let inserted = 0;
    let skipped = 0;

    for (const row of records) {
      const chat_id = row['chat_id'];
      if (!chat_id || existingChatIds.has(chat_id)) {
        skipped++;
        continue;
      }

      const nameParts = (row['name'] || '').trim().split(/\s+/);
      const first_name = nameParts[0] || undefined;
      const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;
      const user_name = row['username'] || undefined;
      const is_active = (row['status'] || '').toLowerCase() === 'active';

      await this.repo.save(this.repo.create({ chat_id, first_name, last_name, user_name, is_active }));
      existingChatIds.add(chat_id);
      inserted++;
    }

    return { inserted, skipped };
  }
}
