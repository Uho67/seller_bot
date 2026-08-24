import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateAppButtonDto {
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsBoolean() is_enabled?: boolean;
}
