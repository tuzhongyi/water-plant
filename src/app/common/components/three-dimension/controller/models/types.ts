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
  renderSettings?: PerModelRenderSettings;
  materialColors: Map<string, MaterialColorState>;
}

export interface ModelFile {
  name: string;
  size: number;
  ext: string;
}

export interface ModelTransformConfig {
  position: Vec3;
  scale: Vec3;
  rotation: { h: number; p: number; b: number };
  colors?: ModelColors;
  render?: PerModelRenderSettings;
  materialColors?: Record<string, MaterialColorState>;
  meshVisibility?: Record<string, boolean>;
}

export interface ModelConfig {
  settings: RenderSettings;
  models: Record<string, ModelTransformConfig>;
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
  viewPreset: ViewPreset;
  camPos: Vec3;
  camTgt: Vec3;
}

export interface CameraView {
  pos: THREE.Vector3;
  tgt: THREE.Vector3;
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
}

export interface ApiSaveResponse {
  ok: boolean;
}
