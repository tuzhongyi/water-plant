export enum TaskState {
  /**	加载中	-1 */
  Uploading = -1,
  /**	未开始	0 */
  NotStarted = 0,
  /**	进行中	1 */
  OnGoing = 1,
  /**	完成	2 */
  Finished = 2,
  /**	失败	3 */
  Failed = 3,
  /**	暂停	4 */
  Paused = 4,
}
