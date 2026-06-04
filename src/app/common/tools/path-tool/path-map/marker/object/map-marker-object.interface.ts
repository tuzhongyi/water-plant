import { IMapMarkerPath } from '../map-marker.interface';

export abstract class IMapMarkerObjectPath {
  constructor() {}
  abstract get blue(): IMapMarkerPath;
  abstract get red(): IMapMarkerPath;
  abstract get orange(): IMapMarkerPath;
  abstract get gray(): IMapMarkerPath;
  abstract get green(): IMapMarkerPath;
  abstract get cyan(): IMapMarkerPath;
}
