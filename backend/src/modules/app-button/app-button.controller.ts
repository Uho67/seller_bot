import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AppButtonService } from './app-button.service';
import { UpdateAppButtonDto } from './dto/update-app-button.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('app-button')
export class AppButtonController {
  constructor(private service: AppButtonService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  update(@Body() dto: UpdateAppButtonDto) {
    return this.service.update(dto);
  }
}
