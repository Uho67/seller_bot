import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('extra_button')
export class ExtraButton {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  text: string;

  @Column({ default: '' })
  url: string;

  @Column({ default: false })
  is_enabled: boolean;
}
