export interface FlatTreeNode<T = any> {
  id: string;
  label: string;
  level: number;
  parentId?: string;
  expandable?: boolean;
  expanded?: boolean;
  html?: string;
  /** 节点图标（class，例如 `howell-icon-camera_line` / `mdi mdi-grid`） */
  icon?: string;
  /** 右侧操作按钮 HTML */
  actionsHtml?: string;
  data?: T;
}
