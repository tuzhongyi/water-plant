import { AbstractUrl } from '../abstract.url';

export class EventBehaviorUrl extends AbstractUrl {
  constructor(base: string) {
    super(`${base}/Behaviors`);
  }
}
