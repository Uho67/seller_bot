import { Controller, Get, Patch, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ShippingPostService } from './shipping-post.service';
import { UpdateShippingPostDto } from './dto/update-shipping-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { multerConfig } from '../../common/upload/multer.config';

@Controller('shipping-post')
export class ShippingPostController {
  constructor(private service: ShippingPostService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  @UseInterceptors(FileInterceptor('image', multerConfig))
  update(@Body() dto: UpdateShippingPostDto, @UploadedFile() file?: Express.Multer.File) {
    return this.service.update(dto, file?.filename);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('toggle')
  toggle() {
    return this.service.toggleEnabled();
  }
}
