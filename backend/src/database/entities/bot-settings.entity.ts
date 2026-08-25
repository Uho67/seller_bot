import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bot_settings')
export class BotSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'catalog' })
  mode: string; // 'catalog' | 'mini_app'

  @Column({ default: 'Відкрити' })
  mini_app_label: string;

  @Column({ default: '' })
  mini_app_url: string;
}
