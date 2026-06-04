import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IIdNameModel } from '../../data-core/models/interface/model.interface';
import { WheelHorizontalScrollDirective } from '../../directives/wheel-horizontal-scroll/wheel-horizontal-scroll.directive';

@Component({
  selector: 'howell-select-multiple',
  imports: [CommonModule, FormsModule, WheelHorizontalScrollDirective],
  templateUrl: './select-multiple.component.html',
  styleUrl: './select-multiple.component.less',
})
export class SelectMultipleComponent implements OnInit, OnChanges, OnDestroy {
  @Input('datas') _datas: IIdNameModel<any>[] = [];
  @Input() selecteds: IIdNameModel<any>[] = [];
  @Output() selectedsChange = new EventEmitter<IIdNameModel<any>[]>();
  @Input() searchable = true;
  @Input() disabled = false;

  constructor() {}

  datas: IIdNameModel[] = [];
  handle = {
    close: undefined as any,
    enter: undefined as any,
  };
  show = false;
  name = '';

  private change = {
    datas: (simple: SimpleChange) => {
      if (simple) {
        this.datas = [...this._datas];
      }
    },
  };

  ngOnChanges(changes: SimpleChanges): void {
    this.change.datas(changes['_datas']);
  }
  ngOnInit(): void {
    this.handle.close = this.on.close.bind(this);
    this.handle.enter = this.on.enter.bind(this);
    document.addEventListener('click', this.handle.close);
    document.addEventListener('keydown', this.handle.enter);
  }
  ngOnDestroy(): void {
    if (this.handle.close) {
      document.removeEventListener('click', this.handle.close);
    }
    if (this.handle.enter) {
      document.removeEventListener('keydown', this.handle.enter);
    }
  }

  on = {
    close: () => {
      if (this.disabled) return;
      this.show = false;
    },
    open: (e: Event) => {
      if (this.disabled) return;
      this.show = !this.show;
      e.stopPropagation();
    },
    stop: (e: Event) => {
      e.stopPropagation();
    },
    select: (item: IIdNameModel) => {
      if (this.disabled) return;
      let index = this.selecteds.findIndex((x) => x.Id == item.Id);
      if (index < 0) {
        this.selecteds.push(item);
      } else {
        this.selecteds.splice(index, 1);
      }

      this.selectedsChange.emit(this.selecteds);
    },
    remove: (item: IIdNameModel, e: Event) => {
      if (this.disabled) return;
      this.on.select(item);
      e.stopPropagation();
    },
    enter: (e: KeyboardEvent) => {
      if (this.disabled) return;
      if (e.key === 'Enter') {
        this.on.search();
      }
    },
    search: () => {
      if (this.disabled) return;
      if (this.name) {
        this.datas = this._datas.filter((x) => x.Name.includes(this.name));
      } else {
        this.datas = [...this._datas];
      }
    },
    clean: () => {
      if (this.disabled) return;
      this.name = '';
      this.on.search();
    },
  };
}
