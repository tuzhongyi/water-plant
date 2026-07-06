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
export interface StandbyClickArgs {
  x: number;
  y: number;
  z: number;
  modelId: string;
  meshId?: string;
  data: { Id: string; Name: string };
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
  /** 模型几何中心（wrapper 本地空间），在加载时计算 */
  geoCenter: THREE.Vector3;
}

export interface ModelFile {
  name: string;
  type: ModelType;
}
export enum ModelType {
  building = 'building',
  floors = 'floors',
  village = 'village',
}

export interface ModelTransformConfig {
  name?: string;
  position: Vec3;
  scale: Vec3;
  rotation: { h: number; p: number; b: number };
  colors?: ModelColors;
  materialColors?: Record<string, MaterialColorState>;
  meshVisibility?: Record<string, boolean>;
  label?: string;
  labelMode?: 'always' | 'never' | 'hover';
  labelPerHeight?: number;
  labelFontSize?: number;
  locked?: boolean;
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

/** 外部传入的场景摄像机标记 */
export interface MarkerEntity<T = any> {
  id: string; // 唯一编号
  name: string; // label 显示名称
  position: Vec3; // 所在位置
  modelId: string; // 所属模型 ID
  meshId?: string; // 模型 mesh 的 key（Group 名优先）
  offline?: boolean;
  alarm?: boolean;
  icon: AlarmEntityState;
  data: T;
  [key: string]: any; // 可扩展
}

export interface SceneCameraConfig {
  id: string;
  name: string;
  position: Vec3;
  rotation: { h: number; p: number; b: number };
  fov: number;
  near: number;
  far: number;
  isOrtho: boolean;
  zoom: number;
  colors: CameraColors;
}

export interface ModelConfig {
  settings: RenderSettings;
  models: Record<string, ModelTransformConfig>;
  sceneCameras?: SceneCameraConfig[];
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
  showCameraHelpers: boolean;
  showLabels: boolean;
  labelFontSize: number;
  labelHeight: number;
  viewPreset: ViewPreset;
  camPos: Vec3;
  camTgt: Vec3;
  /** 变换工具参考点: 'origin'=模型文件原点, 'center'=模型几何中心 */
  gizmoPivot: 'origin' | 'center';
}

export interface CameraView {
  pos: THREE.Vector3;
  tgt: THREE.Vector3;
}

export interface CameraColor {
  body: string;
  lens: string;
  viewfinder: string;
}

export interface CameraColors {
  normal: CameraColor;
  hover: CameraColor;
  selected: CameraColor;
}

export interface SceneCamera {
  id: string;
  name: string;
  helper: THREE.CameraHelper;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  perspCamera: THREE.PerspectiveCamera;
  orthoCamera: THREE.OrthographicCamera;
  isOrtho: boolean;
  model: THREE.Group;
  colors: CameraColors;
  bodyMat: THREE.MeshStandardMaterial;
  lensMat: THREE.MeshStandardMaterial;
  vfMat: THREE.MeshStandardMaterial;
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

export interface ApiConfigResponse {
  settings: RenderSettings;
  models: Record<string, ModelTransformConfig>;
  sceneCameras?: SceneCameraConfig[];
}

export interface ApiSaveResponse {
  ok: boolean;
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
