/**
 * 坐标系类型
 * WGS84	WGS84	1
 * CGCS2000	CGCS2000	2
 * BD09	BD09	3
 * GCJ02	GCJ02	4
 * XA80	西安80	5
 * BJ54	北京54	6
 * Other	其他	7
 */
export enum GisType {
  /**
   * WGS84 1
   */
  WGS84 = 1,
  /**
   * CGCS2000 2
   */
  CGCS2000 = 2,
  /**
   * BD09 3
   */
  BD09 = 3,
  /**
   * GCJ02 4
   */
  GCJ02 = 4,
  /**
   * 西安80 5
   */
  XA80 = 5,
  /**
   * 北京54 6
   */
  BJ54 = 6,
  /**
   * 其他 7
   */
  Other = 7,
}
