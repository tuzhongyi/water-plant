import { IParams, PagedParams } from '../../../models/interface/params.interface';

export class GetVideoAnalysisDevicesParams extends PagedParams {
  /**	String[]	ID列表	O	*/
  Ids?: string[];
  /**	String	名称或描述	O	*/
  Name?: string;
  /**	Int32[]	设备类型	O	*/
  DeviceTypes?: number[];
  /**	Int32	设备状态	O	*/
  DeviceState?: number;
  /**	String	设备地址	O	*/
  Host?: string;
}

export class GetVideoAnalysisTasksParams extends PagedParams {
  /**	String[]	ID列表	O	*/
  Ids?: string[];
  /**	String	名称或描述	O	*/
  Name?: string;
  /**	String[]	视频通道ID列表	O	*/
  VideoChannelIds?: string[];
  /**	String[]	设备ID列表	O	*/
  DeviceIds?: string[];
  /**	String[]	部署的视频分析设备ID列表	O	*/
  DeploymentDeviceIds?: string[];
  /**	Int32[]	视频任务类型	O	*/
  TaskTypes?: number[];
  /**	Boolean	是否已部署	O	*/
  Deployed?: boolean;
  /**	Int32[]	视频任务状态	O	*/
  TaskStates?: number[];
}

export class VideoAnalysisTaskDeployParams implements IParams {
  /**	String[]	分析任务ID	O	*/
  TaskIds?: string[];
  /**	String	分析设备ID	O	*/
  DeviceId?: string;
}

export class VideoAnalysisCapturePictureParams implements IParams {
  /**	String	视频Url地址	M	*/
  VideoUrl!: string;
  /**	String	用户名	O	*/
  Username?: string;
  /**	String	密码	O	*/
  Password?: string;
}
