import { FlatTreeNode } from '../component/tree.model';

/** 可编辑树节点：在 FlatTreeNode 基础上增加「是否可修改 / 是否可添加」 */
export interface TreeEditNode<T = any> extends FlatTreeNode<T> {
  /** 是否可修改（右侧显示修改按钮） */
  editable?: boolean;
  /** 是否可添加子节点（右侧显示添加按钮） */
  addable?: boolean;
  /** 是否可删除（右侧显示删除按钮） */
  deletable?: boolean;
}

/** 新增节点的保存结果（省略/为空 parentId 表示新增根节点） */
export interface TreeEditCreate {
  /** 父节点 id */
  parentId?: string;
  /** 输入的名称 */
  value: string;
}
/** 修改节点的保存结果 */
export interface TreeEditUpdate {
  /** 被修改节点 id */
  id: string;
  /** 输入的名称 */
  value: string;
}
/** 删除节点的结果 */
export interface TreeEditDelete {
  /** 被删除节点 id */
  id: string;
}
