import { IsString, IsOptional } from 'class-validator';

export class TrackEventDto {
  @IsString()
  event: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  chat_id?: string;
}
