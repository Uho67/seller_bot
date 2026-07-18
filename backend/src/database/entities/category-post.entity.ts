import {
  Entity, PrimaryGeneratedColumn, Column, ManyToMany,
} from 'typeorm';
import { ProductPost } from './product-post.entity';

export enum CategoryType {
  CUSTOM = 'custom',
  CATALOG = 'catalog',
  ALL_PRODUCTS = 'all_products',
  KING_SIZE = 'king_size',
  SLIMS = 'slims',
  DEMY = 'demy',
  BF = 'bf',
}

@Entity('category_post')
export class CategoryPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  telegram_file_id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'simple-enum', enum: CategoryType, default: CategoryType.CUSTOM })
  type: CategoryType;

  @Column({ default: true })
  is_enabled: boolean;

  @ManyToMany(() => ProductPost, (p) => p.categories, { eager: false })
  products: ProductPost[];
}
