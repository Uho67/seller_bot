import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('app_button')
export class AppButton {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  text: string;

  @Column({ default: '' })
  url: string;

  @Column({ default: false })
  is_enabled: boolean;
}
