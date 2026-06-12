import { GeoMapElement } from '../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../common/data-core/models/geographic/map.model';

/** @widgetjs/tree 节点格式 */
export interface MapTreeNode<T extends GeoMap | GeoMapElement = any> {
  id: string;
  text: string;
  attributes?: Record<string, any>;
  children?: MapTreeNode<GeoMapElement>[];
  check?: boolean;
  data?: T;
}

/** 节点操作事件 */
export interface MapTreeOperation {
  type: 'edit' | 'delete' | 'bind' | 'unbind';
  data: GeoMap | GeoMapElement;
}
