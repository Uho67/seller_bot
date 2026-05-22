import { Controller, Get, Post, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { MailoutService } from './mailout.service';
import { CreateMailoutDto } from './dto/create-mailout.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('mailout')
export class MailoutController {
  constructor(private service: MailoutService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('post_type') post_type?: string,
    @Query('post_id') post_id?: string,
    @Query('is_sent') is_sent?: string,
  ) {
    return this.service.findAll({
      post_type,
      post_id: post_id != null ? Number(post_id) : undefined,
      is_sent: is_sent != null ? is_sent === 'true' : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('send')
  send(@Body() dto: CreateMailoutDto) {
    return this.service.createAndSend(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('records/all')
  deleteAllRecords() {
    return this.service.deleteAllRecords();
  }

  @UseGuards(JwtAuthGuard)
  @Delete('messages/all')
  unsendAllMessages() {
    return this.service.unsendAllMessages();
  }

  @UseGuards(JwtAuthGuard)
  @Delete('records')
  deleteRecords(@Body() body: { ids: number[] }) {
    return this.service.deleteRecords(body.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('messages')
  unsendMessages(@Body() body: { ids: number[] }) {
    return this.service.unsendMessages(body.ids);
  }
}
