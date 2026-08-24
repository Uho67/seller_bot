import { IsString, IsOptional } from 'class-validator';

export class UpdateAppWelcomePostDto {
  @IsOptional()
  @IsString()
  description?: string;
}
