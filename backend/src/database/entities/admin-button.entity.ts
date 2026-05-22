import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('admin_button')
export class AdminButton {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'Адмiн' })
  name: string;

  @Column({ nullable: true })
  telegram_user_link: string;
}
