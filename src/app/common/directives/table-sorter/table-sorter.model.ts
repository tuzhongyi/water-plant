export interface Sort {
  active: string;
  direction: SortDirection;
}
export type SortDirection = 'asc' | 'desc' | '';
