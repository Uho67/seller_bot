import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('webapp_event')
export class WebappEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  event: string;

  @Column({ nullable: true })
  label: string;

  @Column({ nullable: true })
  chat_id: string;

  @CreateDateColumn()
  created_at: Date;
}
