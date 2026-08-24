import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class WebappService {
  private readonly logger = new Logger(WebappService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async recordSession(initData: string): Promise<void> {
    try {
      const params = new URLSearchParams(initData);
      const userJson = params.get('user');
      const hash = params.get('hash');
      if (!userJson) return;

      const tgUser = JSON.parse(userJson);
      const chat_id = String(tgUser.id);
      if (!chat_id) return;

      let user = await this.userRepo.findOne({ where: { chat_id } });
      if (!user) {
        user = this.userRepo.create({ chat_id });
      }
      user.first_name = tgUser.first_name ?? user.first_name ?? null;
      user.last_name = tgUser.last_name ?? user.last_name ?? null;
      user.user_name = tgUser.username ?? user.user_name ?? null;
      user.init_data_hash = hash ?? null;
      user.is_active = true;
      await this.userRepo.save(user);
    } catch (err) {
      this.logger.warn(`Failed to parse webapp session initData: ${err.message}`);
    }
  }
}
