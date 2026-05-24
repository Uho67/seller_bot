import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { ProductPost } from '../../database/entities/product-post.entity';
import { CategoryPost } from '../../database/entities/category-post.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductPost) private repo: Repository<ProductPost>,
    @InjectRepository(CategoryPost) private categoryRepo: Repository<CategoryPost>,
  ) {}

  findAll() {
    return this.repo.find({ relations: ['categories'] });
  }

  async findById(id: number) {
    const product = await this.repo.findOne({ where: { id }, relations: ['categories'] });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  findAllEnabled() {
    return this.repo.find({ where: { is_enabled: true }, relations: ['categories'], order: { order: 'ASC' } });
  }

  async findEnabledByCategory(categoryId: number) {
    return this.repo
      .createQueryBuilder('p')
      .innerJoin('p.categories', 'c', 'c.id = :categoryId', { categoryId })
      .where('p.is_enabled = :enabled', { enabled: true })
      .orderBy('p.order', 'ASC')
      .getMany();
  }

  async create(dto: CreateProductDto, imagePath?: string) {
    const product = this.repo.create({
      name: dto.name,
      description: dto.description,
      is_enabled: dto.is_enabled ?? true,
      order: dto.order ?? 0,
      image: imagePath,
    });

    if (dto.categoryIds?.length) {
      product.categories = await this.categoryRepo.findByIds(dto.categoryIds);
    }

    return this.repo.save(product);
  }

  async updateTelegramFileId(id: number, fileId: string) {
    await this.repo.update(id, { telegram_file_id: fileId });
  }

  async update(id: number, dto: UpdateProductDto, imagePath?: string) {
    const product = await this.findById(id);

    if (imagePath && product.image) {
      this.deleteImageFile(product.image);
    }

    Object.assign(product, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.is_enabled !== undefined && { is_enabled: dto.is_enabled }),
      ...(dto.order !== undefined && { order: dto.order }),
      ...(imagePath && { image: imagePath, telegram_file_id: null }),
    });

    if (dto.categoryIds !== undefined) {
      product.categories = await this.categoryRepo.findByIds(dto.categoryIds);
    }

    return this.repo.save(product);
  }

  async remove(id: number) {
    const product = await this.findById(id);
    if (product.image) this.deleteImageFile(product.image);
    await this.repo.remove(product);
  }

  async toggleEnabled(id: number) {
    const product = await this.findById(id);
    product.is_enabled = !product.is_enabled;
    return this.repo.save(product);
  }

  private deleteImageFile(imagePath: string) {
    const fullPath = path.join(__dirname, '..', '..', '..', 'uploads', path.basename(imagePath));
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
}
