export enum SystemVideoPathNode {
  preview = 'preview',
  playback = 'playback',
}
export enum SystemPathNode {
  main = 'main',
  video = 'video',
}
export class SystemPath {
  private static base = 'system';
  static main = `${this.base}/${SystemPathNode.main}`;

  static get video() {
    return new SystemVideoPath(`${this.base}/${SystemPathNode.video}`);
  }
}
export class SystemVideoPath {
  constructor(private base: string) {}

  get preview() {
    return `${this.base}/${SystemVideoPathNode.preview}`;
  }
  get playback() {
    return `${this.base}/${SystemVideoPathNode.playback}`;
  }

  tostring() {
    return this.base;
  }
}
