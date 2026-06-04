import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WindowComponent } from '../window-control/window.component';
import { WindowViewModel } from '../window-control/window.model';

@Component({
  selector: 'confirm-window',
  templateUrl: './window-confirm.component.html',
  styleUrls: ['./window-confirm.component.less'],
  imports: [CommonModule, FormsModule, WindowComponent],
})
export class WindowConfirmComponent implements OnInit {
  private _style: any = {
    width: '500px',
    height: 'auto',
  };
  public get style(): any {
    return this._style;
  }
  @Input() public set style(v: any) {
    this._style = Object.assign(this._style, v);
  }
  @Input() model: WindowViewModel = new WindowViewModel();
  @Input() title: string = '提示';
  @Input() content: string = '';

  @Output() ok: EventEmitter<void> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();
  constructor() {}

  ngOnInit(): void {}

  onok() {
    this.ok.emit();
  }
  oncancel() {
    this.cancel.emit();
  }
}
