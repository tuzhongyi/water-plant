export class ThreePathTool {
  private folder = `/assets/3d`;

  get json() {
    return {
      models: (mode: string) => {
        return `${this.folder}/${mode}/models.json`;
      },
      config: (mode: string) => {
        return `${this.folder}/${mode}/config.json`;
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
