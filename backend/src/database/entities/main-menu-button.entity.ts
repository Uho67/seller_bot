import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('main_menu_button')
export class MainMenuButton {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'Головне меню' })
  name: string;

  @Column({ default: '' })
  bot_text: string;

  @Column({ default: '' })
  bot_url: string;

  @Column({ default: false })
  bot_is_enabled: boolean;
}
