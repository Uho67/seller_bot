import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostType } from '../../database/entities/mailout.entity';
import { ProductPost } from '../../database/entities/product-post.entity';
import { SalePost } from '../../database/entities/sale-post.entity';
import { WelcomePost } from '../../database/entities/welcome-post.entity';

@Injectable()
export class MailoutPostService {
  constructor(
    @InjectRepository(ProductPost) private productRepo: Repository<ProductPost>,
    @InjectRepository(SalePost) private saleRepo: Repository<SalePost>,
    @InjectRepository(WelcomePost) private welcomeRepo: Repository<WelcomePost>,
  ) {}

  getPost(type: PostType, id: number) {
    if (type === PostType.PRODUCT) return this.productRepo.findOne({ where: { id } });
    if (type === PostType.SALE) return this.saleRepo.findOne({ where: { id } });
    return this.welcomeRepo.findOne({ where: { id } });
  }

  async updateFileId(type: PostType, id: number, fileId: string) {
    if (type === PostType.PRODUCT) await this.productRepo.update(id, { telegram_file_id: fileId });
    else if (type === PostType.SALE) await this.saleRepo.update(id, { telegram_file_id: fileId });
    else await this.welcomeRepo.update(id, { telegram_file_id: fileId });
  }
}
