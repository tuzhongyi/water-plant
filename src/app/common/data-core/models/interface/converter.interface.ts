export interface IConverter<T, R> {
  convert(source: T): R;
}
