import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { ShippingPost } from '../../database/entities/shipping-post.entity';
import { UpdateShippingPostDto } from './dto/update-shipping-post.dto';

@Injectable()
export class ShippingPostService {
  constructor(
    @InjectRepository(ShippingPost) private repo: Repository<ShippingPost>,
  ) {}

  get() {
    return this.repo.findOne({ where: { id: 1 } });
  }

  async updateTelegramFileId(id: number, fileId: string) {
    await this.repo.update(id, { telegram_file_id: fileId });
  }

  async update(dto: UpdateShippingPostDto, imagePath?: string) {
    const post = await this.get();
    if (dto.name !== undefined) post.name = dto.name;
    if (dto.description !== undefined) post.description = dto.description;
    if (dto.is_enabled !== undefined) post.is_enabled = dto.is_enabled;
    if (imagePath) {
      if (post.image) this.deleteImageFile(post.image);
      post.image = imagePath;
      post.telegram_file_id = null;
    }
    return this.repo.save(post);
  }

  async toggleEnabled() {
    const post = await this.get();
    post.is_enabled = !post.is_enabled;
    return this.repo.save(post);
  }

  private deleteImageFile(imagePath: string) {
    const fullPath = path.join(__dirname, '..', '..', '..', 'uploads', path.basename(imagePath));
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
}
