import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExtraButton } from '../../database/entities/extra-button.entity';
import { ExtraButtonService } from './extra-button.service';
import { ExtraButtonController } from './extra-button.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExtraButton])],
  controllers: [ExtraButtonController],
  providers: [ExtraButtonService],
  exports: [ExtraButtonService],
})
export class ExtraButtonModule {}
