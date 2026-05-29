import {
  Controller, Get, Delete, Post, Param, Body, UseGuards,
  UseInterceptors, UploadedFile, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('count')
  count() {
    return this.service.count();
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  deleteMany(@Body('ids') ids: number[]) {
    return this.service.deleteMany(ids);
  }

  @UseGuards(JwtAuthGuard)
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importCsv(@UploadedFile() file: Express.Multer.File) {
    return this.service.importFromCsv(file.buffer);
  }
}
