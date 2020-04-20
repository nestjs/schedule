import { Provider } from '@nestjs/common';

export const nullPrototypeObjectProvider: Provider = {
  provide: 'NULL_PROTOTYPE_OBJECT',
  useValue: Object.create(null),
};
