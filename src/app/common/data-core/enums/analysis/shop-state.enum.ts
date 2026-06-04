export enum ShopState {
  /** 加载中  -1 */
  Uploading = -1, // 加载中
  /** 未开始  0 */
  NotStarted = 0, // 未开始
  /** 进行中  1 */
  OnGoing = 1, // 进行中
  /** 完成  2 */
  Finished = 2, // 完成
  /** 失败  3 */
  Failed = 3, // 失败
  /**	暂停	4 */
  Paused = 4,
}
