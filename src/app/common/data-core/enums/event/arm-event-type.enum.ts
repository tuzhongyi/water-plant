/**	EventType (事件类型)	*/
export enum ArmEventType {
  /** 机动车乱停 */
  VehicleIllegalParking = 1,
  /** 非机动车乱停 */
  BicycleIllegalParking = 2,
  /** 暴露垃圾 */
  GarbageExposure = 3,
  /** 道路设施损坏 */
  RoadDeviceBroken = 4,
  /** 店招损坏 */
  ShopSignBroken = 5,
  /** 占道施工 */
  RoadWork = 6,
  /** 店铺装修 */
  ShopRenovation = 7,
  /** 店招消失 */
  ShopSignDisappeared = 8,
  /** 店招新增 */
  ShopSignCreated = 9,
  EmergencyEvent = 10,
}
