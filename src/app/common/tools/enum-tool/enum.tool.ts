export class EnumTool {
  static values<T>(_enum: T): Array<T[keyof T]> {
    return Object.keys(_enum as any)
      .filter((key) => isNaN(Number(key)))
      .map((key) => _enum[key as keyof T]);
  }
}
