import { IsString, IsOptional } from 'class-validator';

export class UpdateBotSettingsDto {
  @IsOptional() @IsString() mode?: string;
  @IsOptional() @IsString() mini_app_label?: string;
  @IsOptional() @IsString() mini_app_url?: string;
}
