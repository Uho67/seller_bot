import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ButtonsService } from './buttons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateOrderButtonDto } from './dto/update-order-button.dto';
import { UpdateAdminButtonDto } from './dto/update-admin-button.dto';
import { UpdateMainMenuButtonDto } from './dto/update-main-menu-button.dto';
import { UpdateChannelButtonDto } from './dto/update-channel-button.dto';
import { UpdateBotSettingsDto } from './dto/update-bot-settings.dto';

@Controller('buttons')
export class ButtonsController {
  constructor(private service: ButtonsService) {}

  @Get()
  getAll() { return this.service.getAll(); }

  @Get('order') getOrder() { return this.service.getOrderButton(); }
  @Get('admin-btn') getAdmin() { return this.service.getAdminButton(); }
  @Get('main-menu') getMainMenu() { return this.service.getMainMenuButton(); }
  @Get('channel') getChannel() { return this.service.getChannelButton(); }

  @UseGuards(JwtAuthGuard) @Patch('order')
  updateOrder(@Body() dto: UpdateOrderButtonDto) { return this.service.updateOrderButton(dto); }

  @UseGuards(JwtAuthGuard) @Patch('admin-btn')
  updateAdmin(@Body() dto: UpdateAdminButtonDto) { return this.service.updateAdminButton(dto); }

  @UseGuards(JwtAuthGuard) @Patch('main-menu')
  updateMainMenu(@Body() dto: UpdateMainMenuButtonDto) { return this.service.updateMainMenuButton(dto); }

  @UseGuards(JwtAuthGuard) @Patch('channel')
  updateChannel(@Body() dto: UpdateChannelButtonDto) { return this.service.updateChannelButton(dto); }

  @Get('bot-settings') getBotSettings() { return this.service.getBotSettings(); }

  @UseGuards(JwtAuthGuard) @Patch('bot-settings')
  updateBotSettings(@Body() dto: UpdateBotSettingsDto) { return this.service.updateBotSettings(dto); }
}
