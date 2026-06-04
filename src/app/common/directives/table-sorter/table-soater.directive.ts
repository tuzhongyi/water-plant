import {
  AfterContentInit,
  Directive,
  ElementRef,
  EventEmitter,
  Output,
} from '@angular/core';
import { Sort, SortDirection } from './table-sorter.model.js';

@Directive({
  selector: '[TableSorter]',
})
export class TableSorterDirective implements AfterContentInit {
  @Output('sort') _sort = new EventEmitter<Sort>();

  constructor(e: ElementRef<HTMLTableElement>) {
    this.table = e.nativeElement;
  }

  private table: HTMLTableElement;
  private get thead(): HTMLTableSectionElement {
    return this.table.querySelector('thead') as HTMLTableSectionElement;
  }

  ngAfterContentInit(): void {
    this.regist();
  }

  private clear(current: HTMLElement) {
    this.thead.querySelectorAll('th').forEach((th) => {
      let th_sort = th.getAttribute('sort');
      let c_sort = current.getAttribute('sort');
      if (th_sort != c_sort) {
        let span = th.querySelector('.sort-span');
        if (span) {
          th.removeAttribute('direction');
          th.removeChild(span);
        }
      }
    });
  }

  private icon = {
    create: (th: HTMLTableCellElement, icon: string) => {
      let span = document.createElement('span');
      span.className = 'sort-span';
      let i = document.createElement('i');
      i.className = icon;
      span.appendChild(i);
      th.appendChild(span);
    },
    set: (th: HTMLTableCellElement, icon: string) => {
      (th.querySelector('.sort-span > i') as HTMLElement).className = icon;
    },
  };

  regist() {
    this.thead.querySelectorAll('th').forEach((th) => {
      let attr = th.attributes.getNamedItem('sort');
      if (attr) {
        th.style.cursor = 'pointer';
        th.classList.add('sort');
        th.addEventListener('click', (e) => {
          let target = e.currentTarget as HTMLTableCellElement;

          this.clear(target);
          let active = target.getAttribute('sort');
          if (active) {
            let direction = (target.getAttribute('direction') ??
              '') as SortDirection;
            switch (direction) {
              case 'desc':
                direction = 'asc';
                this.icon.set(target, 'mdi mdi-chevron-up');
                break;
              case 'asc':
                direction = 'desc';
                this.icon.set(target, 'mdi mdi-chevron-down');
                break;
              default:
                direction = 'desc';
                this.icon.create(th, 'mdi mdi-chevron-down');
                break;
            }
            target.setAttribute('direction', direction);

            this._sort.emit({
              active: active,
              direction: direction,
            });
          }
        });
      }
    });
  }
}
