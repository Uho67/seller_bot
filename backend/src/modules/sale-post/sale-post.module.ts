import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalePost } from '../../database/entities/sale-post.entity';
import { SalePostService } from './sale-post.service';
import { SalePostController } from './sale-post.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SalePost])],
  controllers: [SalePostController],
  providers: [SalePostService],
  exports: [SalePostService],
})
export class SalePostModule {}
