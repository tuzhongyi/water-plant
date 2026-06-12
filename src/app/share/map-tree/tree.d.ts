declare module '@widgetjs/tree' {
  interface TreeNode {
    id: string;
    text: string;
    attributes?: Record<string, any>;
    children?: TreeNode[];
    check?: boolean;
  }

  interface TreeOptions {
    url?: string;
    method?: 'GET' | 'POST';
    data?: TreeNode[];
    values?: string[];
    closeDepth?: number;
    beforeLoad?: (rawData: any) => any;
    loaded?: (this: Tree) => void;
    onChange?: (this: Tree) => void;
  }

  class Tree {
    constructor(container: string, options: TreeOptions);
    values: string[];
    selectedNodes: TreeNode[];
    disables: string[];
    disabledNodes: TreeNode[];
  }

  export default Tree;
}
