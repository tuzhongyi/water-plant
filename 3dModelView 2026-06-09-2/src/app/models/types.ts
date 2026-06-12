import * as THREE from 'three';

export type RenderMode = 'solid' | 'edges' | 'overlay';
export type ViewPreset = 'small' | 'medium' | 'large';

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
  labelVisible: boolean;
  labelPerHeight?: number;
  labelFontSize?: number;
  locked: boolean;
}

export interface ModelFile {
  name: string;
  size: number;
  ext: string;
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
  labelVisible?: boolean;
  labelPerHeight?: number;
  labelFontSize?: number;
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
  renderMode: RenderMode;
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
  url?: string;
  group?: THREE.Group;
  fileName?: string;
  transform?: ModelTransformConfig;
  locked?: boolean;
}

export interface ModelViewerDisplayParams {
  renderMode?: 'solid' | 'edges' | 'overlay';
  backgroundColor?: string;
  showBoundingBox?: boolean;
  showLabels?: boolean;
  labelFontSize?: number;
  labelHeight?: number;
  autoRotate?: boolean;
  thresholdAngle?: number;
  edgeLineWidth?: number;
  solidOpacity?: number;
  wfOpacity?: number;
  edgeSeeThrough?: boolean;
  solidSeeThrough?: boolean;
  showGrid?: boolean;
  showAxes?: boolean;
}
