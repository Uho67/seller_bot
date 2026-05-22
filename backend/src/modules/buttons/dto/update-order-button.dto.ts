import { IsString, IsOptional } from 'class-validator';

export class UpdateOrderButtonDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() telegram_user_link?: string;
  @IsOptional() @IsString() prefill_text?: string;
}
