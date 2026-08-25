import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('shipping_post')
export class ShippingPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  telegram_file_id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: false })
  is_enabled: boolean;
}
