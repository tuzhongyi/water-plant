import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { CommonModule } from '@angular/common';
import { WindowViewModel } from './window.model';

@Component({
  selector: 'app-window',
  templateUrl: './window.component.html',
  styleUrls: ['./window.component.less'],
  imports: [CommonModule],
})
export class WindowComponent implements OnInit {
  @Input()
  model = new WindowViewModel();

  @Output()
  OnClosing: EventEmitter<boolean> = new EventEmitter();
  @Input() headable = true;
  @Input()
  background = true;
  @Input()
  title: string = '';

  @Input() lineable = false;

  @Input()
  closeButton = true;

  private _style: any = {
    width: '80%',
    height: '80%',
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    top: '50%',
    left: '50%',
  };
  public get style(): any {
    return this._style;
  }
  @Input()
  public set style(v: any) {
    this._style = Object.assign(this._style, v);
  }

  @Input()
  manualClose = false;

  constructor() {}

  ngOnInit() {}

  closeButtonClick() {
    if (this.manualClose === false) {
      this.model.show = false;
    }
    this.OnClosing.emit(true);
  }
}
