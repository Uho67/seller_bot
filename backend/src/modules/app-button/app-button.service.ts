import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppButton } from '../../database/entities/app-button.entity';
import { UpdateAppButtonDto } from './dto/update-app-button.dto';

@Injectable()
export class AppButtonService {
  constructor(
    @InjectRepository(AppButton) private repo: Repository<AppButton>,
  ) {}

  get() {
    return this.repo.findOne({ where: { id: 1 } });
  }

  async update(dto: UpdateAppButtonDto) {
    const btn = await this.get();
    Object.assign(btn, dto);
    return this.repo.save(btn);
  }
}
