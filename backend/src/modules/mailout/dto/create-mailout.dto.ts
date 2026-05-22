import { IsNumber, IsEnum, Allow } from 'class-validator';
import { PostType } from '../../../database/entities/mailout.entity';

export class CreateMailoutDto {
  @IsNumber()
  post_id: number;

  @IsEnum(PostType)
  post_type: PostType;

  @Allow()
  chat_ids: string[] | 'all';
}
