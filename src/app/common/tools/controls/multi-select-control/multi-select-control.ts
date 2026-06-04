import { Directive, EventEmitter, Output } from '@angular/core';
import { IIdNameModel } from '../../../data-core/models/interface/model.interface';
import './multi-select-control.less';

@Directive({
  selector: '[hw-multi-select]',
})
export class MultiSelectControl {
  @Output() select = new EventEmitter<IIdNameModel[]>();

  constructor(public element: HTMLDivElement) {
    element.classList.add('multi-select-control');
    this.init();
    this.regist();
  }

  private _element = {
    selection: document.createElement('div'),
    items: document.createElement('div'),
  };

  get parentElement() {
    return this.element.parentElement;
  }

  get show() {
    return this._element.items.classList.contains('show');
  }
  set show(value: boolean) {
    if (this.show === value) {
      return;
    }
    if (value) {
      this._element.items.classList.add('show');
    } else {
      this._element.items.classList.remove('show');
    }
  }

  private _selecteds: Map<string, IIdNameModel> = new Map();
  private items: IIdNameModel[] = [];

  get selecteds() {
    return Array.from(this._selecteds.values());
  }

  private init() {
    this._element.selection.classList.add('multi-select-control-selections');
    this._element.items.classList.add('multi-select-control-items');
    this.element.appendChild(this._element.selection);
    this.element.appendChild(this._element.items);
  }
  private regist() {
    this._element.selection.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      this.show = !this.show;
    });
    window.addEventListener('click', () => {
      this.show = false;
    });
  }

  appendSelection(model: IIdNameModel) {
    let item = document.createElement('div');
    item.id = this.setSelectionId(model.Id);
    item.classList.add('multi-select-control-selection');
    item.title = model.Name;
    item.innerHTML = model.Name;

    this._element.selection.appendChild(item);
  }
  appendItem(model: IIdNameModel) {
    let item = document.createElement('div');
    item.id = this.setItemId(model.Id);
    item.addEventListener('click', (e) => {
      this.on.item(e);
    });
    item.classList.add('multi-select-control-item');

    let check = document.createElement('div');
    let _checkbox = document.createElement('input');
    _checkbox.type = 'checkbox';
    check.appendChild(_checkbox);
    item.appendChild(check);

    let label = document.createElement('div');
    label.innerText = model.Name;
    item.appendChild(label);

    this._element.items.appendChild(item);
  }

  private setItemId(id: string) {
    return `msc_item_${id}`;
  }
  private setSelectionId(id: string) {
    return `msc_selection_${id}`;
  }
  private getId(id: string) {
    let _id = id.split('_');
    return _id[_id.length - 1];
  }

  private loadSelection() {
    this._element.selection.innerHTML = '';
    this._selecteds.forEach((value) => {
      this.appendSelection(value);
    });
    this.select.emit(this.selecteds);
  }

  clear() {
    this.items = [];
    this._selecteds.clear();
    this._element.items.innerHTML = '';
    this._element.selection.innerHTML = '';
  }

  load(datas: IIdNameModel[]) {
    this.items = datas;
    for (let i = 0; i < datas.length; i++) {
      this.appendItem(datas[i]);
    }
  }

  on = {
    select: (items: IIdNameModel[]) => {
      this._selecteds.clear();
      for (let i = 0; i < this.items.length; i++) {
        let item = this.items[i];
        let id = this.setItemId(item.Id);
        let div = this.element.querySelector(`#${id}`) as HTMLDivElement;
        let checkbox = div.querySelector('input') as HTMLInputElement;
        let selected = items.find((x) => x.Id == item.Id);
        if (selected) {
          checkbox.checked = true;
          this._selecteds.set(item.Id, item);
        } else {
          checkbox.checked = false;
        }
      }

      this.loadSelection();
    },
    item: (e: MouseEvent) => {
      e.stopImmediatePropagation();
      let div = e.target as HTMLDivElement;
      let checkbox = div.querySelector('input') as HTMLInputElement;
      checkbox.checked = !checkbox.checked;
      let id = this.getId(div.id);
      if (checkbox.checked) {
        if (!this._selecteds.has(id)) {
          let item = this.items.find((x) => x.Id == id);
          if (item) {
            this._selecteds.set(id, item);
          }
        }
      } else {
        if (this._selecteds.has(id)) {
          this._selecteds.delete(id);
        }
      }
      this.loadSelection();
    },
  };
}
