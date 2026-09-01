export class ConfigSkinStore {
  key = 'config-skin';
  get() {
    return localStorage.getItem(this.key) ?? undefined;
  }
  set(value: string) {
    localStorage.setItem(this.key, value);
  }
  clear() {
    localStorage.removeItem(this.key);
  }
}
