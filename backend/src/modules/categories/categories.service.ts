import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { CategoryPost, CategoryType } from '../../database/entities/category-post.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryPost) private repo: Repository<CategoryPost>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async findById(id: number) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  findByType(type: CategoryType) {
    return this.repo.findOne({ where: { type } });
  }

  findAllExceptCatalog() {
    return this.repo
      .createQueryBuilder('c')
      .where('c.type != :type', { type: CategoryType.CATALOG })
      .orderBy('c.order', 'ASC')
      .getMany();
  }

  create(dto: CreateCategoryDto, imagePath?: string) {
    const cat = this.repo.create({
      name: dto.name,
      description: dto.description,
      type: CategoryType.CUSTOM,
      image: imagePath,
      order: dto.order ?? 0,
    });
    return this.repo.save(cat);
  }

  async updateTelegramFileId(id: number, fileId: string) {
    await this.repo.update(id, { telegram_file_id: fileId });
  }

  async update(id: number, dto: UpdateCategoryDto, imagePath?: string) {
    const cat = await this.findById(id);
    if (imagePath && cat.image) {
      this.deleteImageFile(cat.image);
    }
    Object.assign(cat, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.order !== undefined && { order: dto.order }),
      ...(imagePath && { image: imagePath, telegram_file_id: null }),
    });
    return this.repo.save(cat);
  }

  async remove(id: number) {
    const cat = await this.findById(id);
    if (cat.type !== CategoryType.CUSTOM) {
      throw new ForbiddenException('Cannot delete built-in categories');
    }
    if (cat.image) this.deleteImageFile(cat.image);
    await this.repo.remove(cat);
  }

  private deleteImageFile(imagePath: string) {
    const fullPath = path.join(__dirname, '..', '..', '..', 'uploads', path.basename(imagePath));
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
}
