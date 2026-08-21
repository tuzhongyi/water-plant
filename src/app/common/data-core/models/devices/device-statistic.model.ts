import { IModel } from '../interface/model.interface';

/**	DeviceStatistic (设备统计信息)	*/
export class DeviceStatistic implements IModel {
  /**	Int32	总设备数量	M	*/
  DeviceCount!: number;
  /**	Int32	在线设备数量	M	*/
  DeviceOnlineCount!: number;
  /**	Int32	离线设备数量	M	*/
  DeviceOfflineCount!: number;
  /**	Int32	视频通道数量	M	*/
  VideoChannelCount!: number;
  /**	Int32	视频通道在线数量	M	*/
  VideoChannelOnlineCount!: number;
  /**	Int32	视频通道离线数量	M	*/
  VideoChannelOfflineCount!: number;
}
