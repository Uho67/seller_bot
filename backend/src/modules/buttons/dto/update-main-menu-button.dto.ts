import { IsString, IsOptional } from 'class-validator';

export class UpdateMainMenuButtonDto {
  @IsOptional() @IsString() name?: string;
}
