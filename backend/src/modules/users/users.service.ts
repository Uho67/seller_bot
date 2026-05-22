import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

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
}
