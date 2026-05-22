import { Controller, Get, Patch, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WelcomePostService } from './welcome-post.service';
import { UpdateWelcomePostDto } from './dto/update-welcome-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { multerConfig } from '../../common/upload/multer.config';

@Controller('welcome-post')
export class WelcomePostController {
  constructor(private service: WelcomePostService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  @UseInterceptors(FileInterceptor('image', multerConfig))
  update(@Body() dto: UpdateWelcomePostDto, @UploadedFile() file?: Express.Multer.File) {
    return this.service.update(dto, file?.filename);
  }
}
