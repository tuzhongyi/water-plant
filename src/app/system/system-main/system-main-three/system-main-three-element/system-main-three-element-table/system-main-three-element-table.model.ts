export interface SystemMainThreeElementTableItem<T = any> {
  icon: string;
  name: string;
  color: string;
  id: string;
  playable: boolean;
  type: number;
  data: T;
}
