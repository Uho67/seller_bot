import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingPost } from '../../database/entities/shipping-post.entity';
import { ShippingPostService } from './shipping-post.service';
import { ShippingPostController } from './shipping-post.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShippingPost])],
  controllers: [ShippingPostController],
  providers: [ShippingPostService],
  exports: [ShippingPostService],
})
export class ShippingPostModule {}
