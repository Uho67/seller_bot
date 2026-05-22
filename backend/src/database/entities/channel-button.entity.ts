import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('channel_button')
export class ChannelButton {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'До каналу' })
  name: string;

  @Column({ nullable: true })
  channel_link: string;
}
