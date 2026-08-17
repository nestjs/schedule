import { Injectable, Scope } from '@nestjs/common';
import { Cron } from '../../lib/decorators/index.js';
import { CronExpression } from '../../lib/enums/index.js';

@Injectable({ scope: Scope.REQUEST })
export class RequestScopedCronService {
  @Cron(CronExpression.EVERY_MINUTE)
  handleCron() {}
}
