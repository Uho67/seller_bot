import { IsString, IsOptional } from 'class-validator';

export class UpdateWelcomePostDto {
  @IsOptional()
  @IsString()
  description?: string;
}
