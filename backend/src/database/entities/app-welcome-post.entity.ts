import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('app_welcome_post')
export class AppWelcomePost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true, type: 'text' })
  description: string;
}
