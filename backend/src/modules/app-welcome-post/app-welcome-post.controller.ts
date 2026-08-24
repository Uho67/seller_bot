import { Controller, Get, Patch, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppWelcomePostService } from './app-welcome-post.service';
import { UpdateAppWelcomePostDto } from './dto/update-app-welcome-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { multerConfig } from '../../common/upload/multer.config';

@Controller('app-welcome-post')
export class AppWelcomePostController {
  constructor(private service: AppWelcomePostService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  @UseInterceptors(FileInterceptor('image', multerConfig))
  update(@Body() dto: UpdateAppWelcomePostDto, @UploadedFile() file?: Express.Multer.File) {
    return this.service.update(dto, file?.filename);
  }
}
