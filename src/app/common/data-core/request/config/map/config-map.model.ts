export interface MapConfig {
  find: MapFindConfig;
  model: MapModelConfig;
  marker: MapMarkerConfig;
  viewfield: MapViewfieldConfig;
}

interface MapFindConfig {
  radius: number;
}
interface MapModelConfig {
  label: {
    mode: string;
  };
}
interface MapMarkerConfig {
  label: {
    mode: string;
  };
}
interface MapViewfieldConfig {
  radius: number;
  angle: number;
}
