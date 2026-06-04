/**	CommandType (命令类型)	*/
export enum RobotCommandType {
  /**	步进	*/
  MeshStep = 'MeshStep',
  /**	移动到指定位置	*/
  MoveTo = 'MoveTo',
  /**	更换桶	*/
  ChangeTo = 'ChangeTo',
  /**	停止全部命令。如果正在移动，则停止移动。	*/
  Stop = 'Stop',
  /** 称重 */
  Weigh = 'Weigh',
}
