import { Injectable, Scope } from '@nestjs/common';
import { Cron } from '../../lib/decorators';
import { CronExpression } from '../../lib/enums';

@Injectable({ scope: Scope.REQUEST })
export class RequestScopedCronService {
  @Cron(CronExpression.EVERY_MINUTE)
  handleCron() {}
}
