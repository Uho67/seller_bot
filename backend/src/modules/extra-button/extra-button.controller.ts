import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ExtraButtonService } from './extra-button.service';
import { UpdateExtraButtonDto } from './dto/update-extra-button.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('extra-button')
export class ExtraButtonController {
  constructor(private service: ExtraButtonService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  update(@Body() dto: UpdateExtraButtonDto) {
    return this.service.update(dto);
  }
}
