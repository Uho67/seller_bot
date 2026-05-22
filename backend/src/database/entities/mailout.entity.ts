import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum PostType {
  PRODUCT = 'product',
  SALE = 'sale',
  WELCOME = 'welcome',
}

@Entity('mailout')
export class Mailout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chat_id: string;

  @Column()
  post_id: number;

  @Column({ type: 'simple-enum', enum: PostType })
  post_type: PostType;

  @Column({ default: false })
  is_sent: boolean;

  @Column({ nullable: true })
  message_id: string;

  @CreateDateColumn()
  created_at: Date;
}
