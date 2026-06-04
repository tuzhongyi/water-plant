/**	BatteryState (电池状态)	*/
export enum RobotBatteryState {
  /**	正常	*/ Normal = 'Normal',
  /**	充电中	*/ Charging = 'Charging',
  /**	无法充电	*/ Unable = 'Unable',
  /**	欠压、亏电	*/ UnderVoltage = 'UnderVoltage',
}
