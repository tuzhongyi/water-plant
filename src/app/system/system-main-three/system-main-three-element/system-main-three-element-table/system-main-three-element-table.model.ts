export interface SystemMainThreeElementTableItem<T = any> {
  icon: string;
  name: string;
  color: string;
  state: string;
  id: string;
  playable: boolean;
  type: number;
  data: T;
}
