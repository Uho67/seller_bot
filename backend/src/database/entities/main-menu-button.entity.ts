import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('main_menu_button')
export class MainMenuButton {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'Головне меню' })
  name: string;
}
