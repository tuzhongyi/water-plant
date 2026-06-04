export enum RobotState {
  /**  None：无 */
  None = 'None',
  /**  Busy：繁忙状态 */
  Busy = 'Busy',
  /**  Charging：充电状态 */
  Charging = 'Charging',
  /**  LoBAT：低电量 */
  LoBAT = 'LoBAT',
  /**  Error：故障 */
  Error = 'Error',
  /**  Upgrading：升级中 */
  Upgrading = 'Upgrading',
  /**  Offline：信号丢失 */
  Offline = 'Offline',
}
