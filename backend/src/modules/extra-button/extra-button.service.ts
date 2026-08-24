import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtraButton } from '../../database/entities/extra-button.entity';
import { UpdateExtraButtonDto } from './dto/update-extra-button.dto';

@Injectable()
export class ExtraButtonService {
  constructor(
    @InjectRepository(ExtraButton) private repo: Repository<ExtraButton>,
  ) {}

  get() {
    return this.repo.findOne({ where: { id: 1 } });
  }

  async update(dto: UpdateExtraButtonDto) {
    const btn = await this.get();
    Object.assign(btn, dto);
    return this.repo.save(btn);
  }
}
