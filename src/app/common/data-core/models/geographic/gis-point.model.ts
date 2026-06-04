import { IModel } from '../interface/model.interface';

/**	GisPoint (地理信息坐标点)	*/
export class GisPoint implements IModel {
  /**	Double	经度	M	*/
  Longitude!: number;
  /**	Double	纬度	M	*/
  Latitude!: number;
  /**	Double	高度	M	*/
  Altitude!: number;
  /**	Int32	楼层	O	*/
  Floor?: number;
  /**	Int32	坐标系类型	O	*/
  GisType?: number;
}
