import client from './client';

export interface EventStat {
  event: string;
  label: string | null;
  count: number;
}

export interface DayStat {
  date: string;
  count: number;
}

export interface AnalyticsStats {
  total: number;
  uniqueUsers: number;
  byEvent: EventStat[];
  byDay: DayStat[];
}

export const analyticsApi = {
  getStats: () => client.get<AnalyticsStats>('/analytics/stats').then((r) => r.data),
  clearAll: () => client.delete('/analytics/all').then((r) => r.data),
};
