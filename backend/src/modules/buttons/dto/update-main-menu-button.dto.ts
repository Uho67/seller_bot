import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateMainMenuButtonDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() bot_text?: string;
  @IsOptional() @IsString() bot_url?: string;
  @IsOptional() @IsBoolean() bot_is_enabled?: boolean;
}
