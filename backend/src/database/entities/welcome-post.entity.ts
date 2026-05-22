import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('welcome_post')
export class WelcomePost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  telegram_file_id: string;

  @Column({ nullable: true, type: 'text' })
  description: string;
}
