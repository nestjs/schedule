import { Injectable } from '@nestjs/common';
import { CronExpression } from '../../lib/enums';

@Injectable()
export class ConfigService {
  private readonly store: Record<string, unknown> = {
    CRON_EXPRESSION: CronExpression.EVERY_SECOND,
    CRON_DISABLED: true,
  };

  get<T = unknown>(key: string): T {
    return this.store[key] as T;
  }
}
