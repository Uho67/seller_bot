import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppButton } from '../../database/entities/app-button.entity';
import { AppButtonService } from './app-button.service';
import { AppButtonController } from './app-button.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AppButton])],
  controllers: [AppButtonController],
  providers: [AppButtonService],
  exports: [AppButtonService],
})
export class AppButtonModule {}
