import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IIdNameModel } from '../../data-core/models/interface/model.interface';

@Component({
  selector: 'ias-input-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input-select.component.html',
  styleUrl: './input-select.component.less',
})
export class InputSelectComponent implements OnChanges {
  @Input() text?: string;
  @Output() textChange = new EventEmitter<string>();
  @Input() results: IIdNameModel<string, string | undefined>[] = [];
  @Input() placeholder: string = '';
  @Output() select = new EventEmitter<string>();
  @Input() selected?: IIdNameModel<string, string | undefined>;

  @Output() focus = new EventEmitter<void>();

  constructor() {}

  is = {
    input: false,
    dropdown: false,
    selected: false,
  };

  ngOnChanges(changes: SimpleChanges): void {
    this.change.result(changes['results']);
  }

  private change = {
    result: (change: SimpleChange) => {
      if (change && !change.firstChange) {
        if (!this.is.selected) {
          this.is.dropdown = this.results.length > 0;
        }
      }
    },
    selected: (change: SimpleChange) => {
      if (change && !change.firstChange) {
        if (this.selected) {
          this.text = this.selected.Name;
          this.is.selected = true;
          this.is.dropdown = false;
        }
      }
    },
  };

  // 处理输入变化
  oninput(): void {
    if (this.is.input) {
      return;
    }
    this.is.selected = false;
    this.textChange.emit(this.text);
  }
  oninputstart() {
    this.is.selected = false;
    this.is.input = true;
  }
  oninputend() {
    this.is.selected = false;
    this.is.input = false;
    this.textChange.emit(this.text);
  }

  // 处理失去焦点
  onblur(): void {
    // 延迟关闭下拉框，以便能够点击选项
    setTimeout(() => {
      this.is.dropdown = false;
    }, 100);
  }

  // 处理获得焦点
  onfocus(): void {
    this.is.selected = false;

    if (this.results.length > 0) {
      this.is.dropdown = true;
    }
    this.focus.emit();
  }

  // 选择搜索结果
  onselect(item: IIdNameModel<string, string | undefined>): void {
    this.is.selected = true;
    this.text = item.Name;
    this.select.emit(item.Id);
  }
}
