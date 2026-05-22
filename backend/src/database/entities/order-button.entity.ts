import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('order_button')
export class OrderButton {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'Замовити' })
  name: string;

  @Column({ nullable: true })
  telegram_user_link: string;

  @Column({ nullable: true })
  prefill_text: string;
}
