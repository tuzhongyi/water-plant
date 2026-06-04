export class WindowViewModel {
  protected _show: boolean = false;
  public get show(): boolean {
    return this._show;
  }
  public set show(v: boolean) {
    this._show = v;
  }
}
