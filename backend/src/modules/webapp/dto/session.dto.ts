import { IsString } from 'class-validator';

export class SessionDto {
  @IsString()
  initData: string;
}
