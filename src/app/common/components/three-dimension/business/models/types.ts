import * as THREE from 'three';

export type ViewPreset = 'small' | 'medium' | 'large';

export enum RenderMode {
  solid = 'solid',
  edges = 'edges',
  overlay = 'overlay',
}

/** 摄像机视图方向 */
export enum FitView {
  /** 45° 俯视适配全部模型 */
  Fit = 'fit',
  /** 俯视 — 模型正上方 */
  Top = 'top',
  /** 左方 */
  Left = 'left',
  /** 右方 */
  Right = 'right',
}

export interface ViewPresetConfig {
  grid: number;
  camDist: number;
  far: number;
  maxDist: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** standby 点击事件参数 */
export interface StandbyClickArgs<T = any> {
  x: number;
  y: number;
  z: number;
  modelId: string;
  meshId?: string;
  data: T;
}

export interface ModelColor {
  edge: string;
  background: string;
}

export interface MaterialColorState {
  normal: string;
  hover: string;
  selected: string;
}

export interface ModelColors {
  normal: ModelColor;
  hover: ModelColor;
  selected: ModelColor;
}

export interface PerModelRenderSettings {
  renderMode?: RenderMode;
  thresholdAngle?: number;
  edgeLineWidth?: number;
  solidOpacity?: number;
  wfOpacity?: number;
  bloom?: boolean;
  bloomThreshold?: number;
  bloomStrength?: number;
  bloomRadius?: number;
  flatShading?: boolean;
  edgeSeeThrough?: boolean;
  solidSeeThrough?: boolean;
}

export interface ModelEntry {
  id: string;
  fileName: string;
  wrapper: THREE.Group;
  model: THREE.Group;
  allMeshes: THREE.Mesh[];
  depthPrePassGroup?: THREE.Group;
  edgesGroup?: THREE.Group;
  bbox: THREE.Box3;
  bboxHelper?: THREE.Box3Helper;
  editPosition: THREE.Vector3;
  editScale: THREE.Vector3;
  editRotation: THREE.Vector3;
  colors: ModelColors;
  visible: boolean;
  materialColors: Map<string, MaterialColorState>;
  label: string;
  labelObject?: THREE.Object3D;
  /** Label 显示模式: 'always'=常显示, 'never'=常隐藏, 'hover'=移入显示 */
  labelMode: 'always' | 'never' | 'hover';
  labelPerHeight?: number;
  labelFontSize?: number;
  locked: boolean;
  /** 是否可选中（通过鼠标点击/悬停），默认 true */
  selectable: boolean;
  /** 模型几何中心（wrapper 本地空间），在加载时计算 */
  geoCenter: THREE.Vector3;
}

export interface ModelFile {
  name: string;
  type: ModelType;
  /** 模型变换配置，由 config.json 的 models 字段迁移而来，无匹配时为空对象 */
  config?: ModelTransformConfig;
}
export enum ModelType {
  building = 'building',
  floors = 'floors',
  village = 'village',
}

/** 单个颜色状态（edge + background + 各材质颜色），来自 config.json 的 typeColorPresets */
export interface TypeColorState {
  edge: string;
  background: string;
  materials: Record<string, string>;
}

/** 一个模型类型的完整颜色预设（按交互状态分） */
export interface TypeColorPreset {
  normal: TypeColorState;
  hover: TypeColorState;
  selected: TypeColorState;
  alarm?: TypeColorState;
}

export interface ModelTransformConfig {
  name?: string;
  position: Vec3;
  scale: Vec3;
  rotation: { h: number; p: number; b: number };
  meshVisibility?: Record<string, boolean>;
  label?: string;
  labelMode?: 'always' | 'never' | 'hover';
  labelPerHeight?: number;
  labelFontSize?: number;
  locked?: boolean;
  selectable?: boolean;
  findable?: boolean;
}

interface EntityState {
  normal: string;
  hover?: string;
  selected?: string;
  offline?: string;
}
interface AlarmEntityState extends EntityState {
  alarm?: EntityState;
}

export interface MarkerArgs<T = any> {
  id: string; // 唯一编号
  name: string; // label 显示名称
  icon: EntityState;
  data: T;
}

/** 外部传入的场景摄像机标记 */
export interface MarkerEntity<T = any> extends MarkerArgs<T> {
  position: Vec3; // 所在位置
  modelId: string; // 所属模型 ID
  meshId?: string; // 模型 mesh 的 key（Group 名优先）
  offline?: boolean;
  alarm?: boolean;
  icon: AlarmEntityState;
  [key: string]: any; // 可扩展
}

export interface ThreeDimensionConfig {
  settings: RenderSettings;
  /** 按模型类型(building/floors/village)分组的颜色预设 */
  typeColorPresets?: Record<string, TypeColorPreset>;
}

export interface RenderSettings {
  renderMode: RenderMode | string;
  edgeLineWidth: number;
  thresholdAngle: number;
  solidOpacity: number;
  wfOpacity: number;
  bgColor: string;
  ambientIntensity: number;
  keyIntensity: number;
  fillIntensity: number;
  hemiIntensity: number;
  showGrid: boolean;
  showAxes: boolean;
  showCenterDot: boolean;
  showBBox: boolean;
  gizmoVisible: boolean;
  autoRotate: boolean;
  flatShading: boolean;
  sobel: boolean;
  bloom: boolean;
  fxaa: boolean;
  edgeSeeThrough: boolean;
  solidSeeThrough: boolean;
  bloomThreshold: number;
  bloomStrength: number;
  bloomRadius: number;
  cameraNear: number;
  cameraFar: number;
  cameraType: 'perspective' | 'orthographic';
  showLabels: boolean;
  labelFontSize: number;
  labelHeight: number;
  viewPreset: ViewPreset;
  camPos: Vec3;
  camTgt: Vec3;
  /** 变换工具参考点: 'origin'=模型文件原点, 'center'=模型几何中心 */
  gizmoPivot: 'origin' | 'center';
}

export interface EditInputs {
  posX: number;
  posY: number;
  posZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotH: number;
  rotP: number;
  rotB: number;
}

/* ModelViewerComponent 相关类型 */

export interface ModelViewerModel {
  id: string;
  fileName: string;
  url: string;
  /** 可选：直接指定位置，有值时跳过 config 查找直接使用 */
  position?: Vec3;
  /** 可选：覆盖模型 label 的显示文本 */
  label?: string;
}
