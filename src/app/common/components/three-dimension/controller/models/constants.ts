import { ModelColors, RenderSettings, ViewPresetConfig } from './types';

export const DEFAULT_MODEL_COLORS: ModelColors = {
  normal: { edge: '#00cccc', background: '#444444' },
  hover: { edge: '#ffaa00', background: '#666644' },
  selected: { edge: '#ff8800', background: '#664422' },
};

export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  renderMode: 'solid',
  edgeLineWidth: 1.0,
  thresholdAngle: 1,
  solidOpacity: 1.0,
  wfOpacity: 0.9,
  bgColor: '#000000',
  ambientIntensity: 2.5,
  keyIntensity: 3.0,
  fillIntensity: 1.0,
  hemiIntensity: 1.2,
  showGrid: false,
  showAxes: false,
  showCenterDot: false,
  showBBox: false,
  autoRotate: false,
  flatShading: false,
  sobel: false,
  bloom: false,
  fxaa: false,
  edgeSeeThrough: false,
  solidSeeThrough: false,
  bloomThreshold: 0.6,
  bloomStrength: 1.5,
  bloomRadius: 0.4,
  cameraNear: 0.1,
  cameraFar: 500,
  viewPreset: 'medium',
  camPos: { x: 0, y: 20, z: 55 },
  camTgt: { x: 0, y: 0, z: 0 },
};

export const VIEW_PRESETS: Record<string, ViewPresetConfig> = {
  small:  { grid: 20,  camDist: 12,  far: 100,  maxDist: 40 },
  medium: { grid: 100, camDist: 55,  far: 500,  maxDist: 160 },
  large:  { grid: 500, camDist: 280, far: 2500, maxDist: 2400 },
};

export const SUPPORTED_EXTENSIONS = new Set(['.glb', '.gltf', '.obj', '.fbx', '.stl', '.ply', '.dae']);
