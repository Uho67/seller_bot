import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { WelcomePost } from '../../database/entities/welcome-post.entity';
import { UpdateWelcomePostDto } from './dto/update-welcome-post.dto';

@Injectable()
export class WelcomePostService {
  constructor(
    @InjectRepository(WelcomePost) private repo: Repository<WelcomePost>,
  ) {}

  get() {
    return this.repo.findOne({ where: { id: 1 } });
  }

  async updateTelegramFileId(id: number, fileId: string) {
    await this.repo.update(id, { telegram_file_id: fileId });
  }

  async update(dto: UpdateWelcomePostDto, imagePath?: string) {
    const post = await this.get();
    if (dto.description !== undefined) post.description = dto.description;
    if (imagePath) {
      if (post.image) this.deleteImageFile(post.image);
      post.image = imagePath;
      post.telegram_file_id = null;
    }
    return this.repo.save(post);
  }

  private deleteImageFile(imagePath: string) {
    const fullPath = path.join(__dirname, '..', '..', '..', 'uploads', path.basename(imagePath));
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
}
