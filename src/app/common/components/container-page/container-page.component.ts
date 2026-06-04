import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Page } from '../../data-core/models/interface/page-list.model';

@Component({
  selector: 'howell-container-page',
  imports: [CommonModule],
  templateUrl: './container-page.component.html',
  styleUrl: './container-page.component.less',
})
export class ContainerPageComponent {
  @Input() page?: Page;
  @Input() small: boolean = false;
  @Output() pageChange = new EventEmitter<Page>();
  @Input() loop = false;
  onprov(): void {
    if (this.page) {
      let page = new Page();
      page = Object.assign(page, this.page);
      page.PageIndex--;
      if (page.PageIndex === 0) {
        page.PageIndex = page.PageCount;
      }
      this.pageChange.emit(page);
    }
  }
  onnext(): void {
    if (this.page) {
      let page = new Page();
      page = Object.assign(page, this.page);
      page.PageIndex++;
      if (page.PageIndex > page.PageCount) {
        page.PageIndex = 1;
      }
      this.pageChange.emit(page);
    }
  }
}
