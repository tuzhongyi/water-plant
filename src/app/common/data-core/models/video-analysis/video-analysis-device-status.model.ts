import { IModel } from '../interface/model.interface';

/**	VideoAnalysisDeviceStatus (视频分析设备状态)	*/
export class VideoAnalysisDeviceStatus implements IModel {
  /**	String	GPU类型	O	*/
  GPUType?: string;
  /**	String	GPU型号	O	*/
  GPUModel?: string;
  /**	Double	显存总大小，单位：MB	O	*/
  GPUMemory?: number;
  /**	Double	GPU占用率，0-100	O	*/
  GPUUtilization?: number;
  /**	Double	显存使用大小，单位：MB	O	*/
  GPUMemoryUsage?: number;
  /**	Int32	GPU总数量	O	*/
  GPUCount?: number;
}
