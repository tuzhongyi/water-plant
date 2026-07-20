import { ThreeDConfig } from './three-d-store.model';

export class ThreeDStore {
  key = 'three-d';
  get() {
    let str = localStorage.getItem(this.key);
    if (str) {
      let model = JSON.parse(str) as ThreeDConfig;
      return model;
    }
    return undefined;
  }
  set(value: ThreeDConfig) {
    localStorage.setItem(this.key, JSON.stringify(value));
  }
  clear() {
    localStorage.removeItem(this.key);
  }
}
