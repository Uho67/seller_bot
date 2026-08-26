import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebappEvent } from '../../database/entities/webapp-event.entity';
import { TrackEventDto } from './dto/track-event.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(WebappEvent)
    private repo: Repository<WebappEvent>,
  ) {}

  async track(dto: TrackEventDto): Promise<void> {
    await this.repo.save(this.repo.create(dto));
  }

  async clearAll(): Promise<void> {
    await this.repo.clear();
  }

  async getStats() {
    const total = await this.repo.count();

    const byEvent = await this.repo
      .createQueryBuilder('e')
      .select('e.event', 'event')
      .addSelect('e.label', 'label')
      .addSelect('COUNT(*)', 'count')
      .groupBy('e.event')
      .addGroupBy('e.label')
      .orderBy('count', 'DESC')
      .getRawMany();

    const uniqueUsers = await this.repo
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT e.chat_id)', 'count')
      .where('e.chat_id IS NOT NULL')
      .getRawOne();

    const byDay = await this.repo
      .createQueryBuilder('e')
      .select("strftime('%Y-%m-%d', e.created_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('date')
      .orderBy('date', 'DESC')
      .limit(30)
      .getRawMany();

    return {
      total,
      uniqueUsers: Number(uniqueUsers?.count ?? 0),
      byEvent: byEvent.map((r) => ({ event: r.event, label: r.label, count: Number(r.count) })),
      byDay: byDay.map((r) => ({ date: r.date, count: Number(r.count) })),
    };
  }
}
