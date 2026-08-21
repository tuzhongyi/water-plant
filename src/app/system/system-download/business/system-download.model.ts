import { Duration } from '../../../common/tools/date-time-tool/duration.model';

/**	下载任务状态 */
export type DownloadTaskState =
  | 'queued' // 排队中
  | 'downloading' // 下载中
  | 'paused' // 已暂停
  | 'saving' // 保存中（进度已满，等待写入本地）
  | 'completed' // 已完成
  | 'failed'; // 失败/已取消

/**	客户端下载任务（模拟百度云盘传输列表） */
export interface DownloadTask {
  /**	唯一ID */
  id: string;
  /**	资源名称（不含时间段） */
  name: string;
  /**	视频通道Id */
  videoChannelId: string;
  /**	时间段 */
  duration: Duration;
  /**	总大小（字节） */
  total: number;
  /**	已下载（字节） */
  loaded: number;
  /**	当前速度（字节/秒） */
  speed: number;
  /**	状态 */
  state: DownloadTaskState;
  /**	状态说明（失败原因等） */
  message?: string;
}

export interface SystemDownloadArgs<T = string> {
  channelId: T;
  name: string;
  duration: Duration;
}
