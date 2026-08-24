import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { WebappService } from './webapp.service';
import { WebappController } from './webapp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [WebappController],
  providers: [WebappService],
})
export class WebappModule {}
