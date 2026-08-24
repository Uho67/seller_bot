import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AppWelcomePost } from '../../database/entities/app-welcome-post.entity';
import { UpdateAppWelcomePostDto } from './dto/update-app-welcome-post.dto';

@Injectable()
export class AppWelcomePostService {
  constructor(
    @InjectRepository(AppWelcomePost) private repo: Repository<AppWelcomePost>,
  ) {}

  async get() {
    let post = await this.repo.findOne({ where: { id: 1 } });
    if (!post) {
      post = this.repo.create({ id: 1 });
      await this.repo.save(post);
    }
    return post;
  }

  async update(dto: UpdateAppWelcomePostDto, imagePath?: string) {
    const post = await this.get();
    if (dto.description !== undefined) post.description = dto.description;
    if (imagePath) {
      if (post.image) this.deleteImageFile(post.image);
      post.image = imagePath;
    }
    return this.repo.save(post);
  }

  private deleteImageFile(imagePath: string) {
    const fullPath = path.join(__dirname, '..', '..', '..', 'uploads', path.basename(imagePath));
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
}
