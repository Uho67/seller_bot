import { IsString, IsOptional } from 'class-validator';

export class UpdateAdminButtonDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() telegram_user_link?: string;
}
