import { IsString, IsOptional } from 'class-validator';

export class UpdateChannelButtonDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() channel_link?: string;
}
