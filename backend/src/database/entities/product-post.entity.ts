import {
  Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable,
} from 'typeorm';
import { CategoryPost } from './category-post.entity';

@Entity('product_post')
export class ProductPost {
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

  @Column({ default: true })
  is_enabled: boolean;

  @Column({ default: 0 })
  order: number;

  @ManyToMany(() => CategoryPost, (cat) => cat.products, { eager: false })
  @JoinTable({ name: 'product_category' })
  categories: CategoryPost[];
}
