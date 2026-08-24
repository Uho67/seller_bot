import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { WebappService } from './webapp.service';
import { SessionDto } from './dto/session.dto';

@Controller('webapp')
export class WebappController {
  constructor(private service: WebappService) {}

  @Post('session')
  @HttpCode(200)
  async session(@Body() dto: SessionDto) {
    await this.service.recordSession(dto.initData);
    return {};
  }
}
