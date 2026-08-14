import { AbstractUrl } from '../abstract.url';

export class GeographicMapElementUrl extends AbstractUrl {
  constructor(private base: string) {
    super(`${base}/MapElements`);
  }

  reset = {
    state: (id: string) => {
      return `${this.item(id)}/ResetState`;
    },
  };
}
