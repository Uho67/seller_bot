import {
  Entity, PrimaryGeneratedColumn, Column, ManyToMany,
} from 'typeorm';
import { ProductPost } from './product-post.entity';

export enum CategoryType {
  CUSTOM = 'custom',
  CATALOG = 'catalog',
  RIDINA = 'ridina',
  POD = 'pod',
  CARTRIDZH = 'cartridzh',
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

  @Column({ default: 0 })
  order: number;

  @ManyToMany(() => ProductPost, (p) => p.categories, { eager: false })
  products: ProductPost[];
}
