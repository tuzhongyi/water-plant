export class ColorTool {
  static green = '#17f1c6';
  static yellow = '#f5c842';
  static red = '#ff4646';
  static gray = '#666666';
  static from = {
    MapElementState: (value?: number) => {
      switch (value) {
        case 1:
          return {
            name: 'gray',
            hex: this.gray,
          };
        case 2:
          return {
            name: 'yellow',
            hex: this.yellow,
          };
        case 0:
        default:
          return {
            name: 'green',
            hex: this.green,
          };
      }
    },
  };
}
