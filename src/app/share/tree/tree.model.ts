export interface FlatTreeNode<T = any> {
  id: string;
  label: string;
  level: number;
  parentId?: string;
  expandable?: boolean;
  expanded?: boolean;
  html?: string;
  /** 右侧操作按钮 HTML */
  actionsHtml?: string;
  data?: T;
}
