export class ThreePathTool {
  private folder = `/assets/3d`;

  get json() {
    return {
      models: () => {
        return `${this.folder}/models.json`;
      },
      config: (mode: string) => {
        return `${this.folder}/${mode}/config.json`;
      },
    };
  }

  get tree() {
    return {
      json: () => {
        return `${this.folder}/tree/tree-models.json`;
      },
      model: (type: number) => {
        return `${this.folder}/tree/tree.glb`;
      },
    };
  }

  get draco() {
    return `${this.folder}/draco/`;
  }

  get = {
    file: (mode: string, filename: string) => {
      return `${this.folder}/${mode}/models/${filename}`;
    },
  };
}
