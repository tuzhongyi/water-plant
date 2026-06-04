import 'reflect-metadata';
export interface IModel {}
export interface IIdModel<T = string> extends IModel {
  Id: T;
}
export interface INameModel<T = string> extends IModel {
  Name: T;
}
export interface IIdNameModel<TId = string, TName = string>
  extends IIdModel<TId>,
    INameModel<TName> {}
export interface IGisPoint extends IModel {
  Longitude: number;
  Latitude: number;
}
export interface IGisPoints extends IModel {
  WGS84: IGisPoint;
  GCJ02: IGisPoint;
  BD09: IGisPoint;
}
export interface ILocation<T extends IGisPoints = IGisPoints> extends IModel {
  Location?: T;
}
export interface IIdNameLocationModel<
  TId = string,
  TName = string,
  TLocation extends IGisPoints = IGisPoints
> extends IIdNameModel<TId, TName>,
    ILocation<TLocation> {}
