import { Vec3 } from '../../models/types';

export interface ThreeDTreeModel {
  position: Vec3;
  direction: number;
  scale: number;
  type: number;
}
