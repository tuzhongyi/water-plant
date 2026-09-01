export class ConfigDownloadStore {
  key = 'config-download';
  get() {
    let item = localStorage.getItem(this.key) ?? undefined;
    let value = 5;
    if (item) {
      value = parseInt(item);
    }

    if (isNaN(value)) {
      value = 5;
    }

    return value;
  }
  set(value: number) {
    localStorage.setItem(this.key, value.toString());
  }
  clear() {
    localStorage.removeItem(this.key);
  }
}
