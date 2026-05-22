import { Controller, Get, Patch, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SalePostService } from './sale-post.service';
import { UpdateSalePostDto } from './dto/update-sale-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { multerConfig } from '../../common/upload/multer.config';

@Controller('sale-post')
export class SalePostController {
  constructor(private service: SalePostService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  @UseInterceptors(FileInterceptor('image', multerConfig))
  update(@Body() dto: UpdateSalePostDto, @UploadedFile() file?: Express.Multer.File) {
    return this.service.update(dto, file?.filename);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('toggle')
  toggle() {
    return this.service.toggleEnabled();
  }
}
