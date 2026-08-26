import { Controller, Post, Get, Delete, Body, HttpCode, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Post('event')
  @HttpCode(200)
  async track(@Body() dto: TrackEventDto) {
    await this.service.track(dto);
    return {};
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async stats() {
    return this.service.getStats();
  }

  @Delete('all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async clearAll() {
    await this.service.clearAll();
    return {};
  }
}
