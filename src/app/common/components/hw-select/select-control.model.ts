export class SelectItem<T = any> {
  constructor(key?: string, value?: T, language?: string) {
    this.Id = key ?? '';
    this.value = value ?? undefined;
    this.Name = language ?? '';
  }
  Id: string = '';
  value?: T;
  Name!: string;

  static create<T>(t: T, language: string | ((t: T) => string)) {
    let key = t === undefined ? '' : (t as any).toString();
    if (typeof language === 'string') {
      return new SelectItem(key, t, language);
    }
    return new SelectItem(key, t, language(t));
  }
}

export interface ISelect<T> {
  selected?: T;
}
