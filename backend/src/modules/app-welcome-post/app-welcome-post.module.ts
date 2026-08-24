import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppWelcomePost } from '../../database/entities/app-welcome-post.entity';
import { AppWelcomePostService } from './app-welcome-post.service';
import { AppWelcomePostController } from './app-welcome-post.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AppWelcomePost])],
  controllers: [AppWelcomePostController],
  providers: [AppWelcomePostService],
})
export class AppWelcomePostModule {}
