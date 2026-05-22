import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WelcomePost } from '../../database/entities/welcome-post.entity';
import { WelcomePostService } from './welcome-post.service';
import { WelcomePostController } from './welcome-post.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WelcomePost])],
  controllers: [WelcomePostController],
  providers: [WelcomePostService],
  exports: [WelcomePostService],
})
export class WelcomePostModule {}
