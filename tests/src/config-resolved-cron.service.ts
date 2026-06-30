import { Injectable } from '@nestjs/common';
import { Cron } from '../../lib/decorators';
import { CronExpression } from '../../lib/enums';
import { ConfigService } from './config.service';

@Injectable()
export class ConfigResolvedCronService {
  callsCount = 0;

  @Cron(
    {
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('CRON_EXPRESSION'),
    },
    {
      name: 'CONFIG_RESOLVED_CRON_TIME',
      utcOffset: 0,
    },
  )
  handleCron() {
    ++this.callsCount;
  }

  @Cron(CronExpression.EVERY_SECOND, {
    name: 'CONFIG_RESOLVED_DISABLED',
    disabled: {
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('CRON_DISABLED'),
    },
    utcOffset: 0,
  })
  handleDisabledCron() {}
}
