export class ThreePathTool {
  private folder = `/assets/3d`;

  get json() {
    return {
      models: `${this.folder}/models.json`,
      config: {
        models: `${this.folder}/models_config.json`,
        global: `${this.folder}/config.json`,
      },
    };
  }

  get draco() {
    return `${this.folder}/draco/`;
  }

  get = {
    file: (filename: string) => {
      return `${this.folder}/models/${filename}`;
    },
  };
}
