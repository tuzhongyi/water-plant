import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import '../../../../assets/js/jquery/jquery-page/jquery.page.js';
import { Page } from '../../data-core/models/interface/page-list.model.js';
import { PaginatorText } from './paginator.model.js';

declare var $: any;

@Component({
  selector: 'paginator',
  imports: [CommonModule],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.less',
})
export class PaginatorComponent implements AfterViewInit, OnChanges {
  @Input() page = Page.create(1, 50, 50);
  @Input() jump = true;
  @Input() total = true;
  @Input() gapable = false;
  @Input() first = true;
  @Input() last = true;

  @Input('text') set _text(text: PaginatorText) {
    this.text = { ...this.text, ...text };
  }
  private text: PaginatorText = {
    first: '首页',
    last: '尾页',
    prev: '上一页',
    next: '下一页',
  };
  @Output() change = new EventEmitter<number>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['page'] && !changes['page'].firstChange) {
      if (this.element) {
        $(this.element.nativeElement).paging({
          pageNum: this.page.PageIndex, // 当前页面
          totalNum: this.page.PageCount, // 总页码
          totalList: this.page.TotalRecordCount, // 记录总数量
          callback: (num: number) => {
            this.change.emit(num);
          },
          display: {
            totalNum: this.total,
            totalList: this.total,
            jump: this.jump,
            first: this.first,
            last: this.last,
          },
          text: this.text,
        });
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.element) {
      $(this.element.nativeElement).paging({
        pageNum: this.page.PageIndex, // 当前页面
        totalNum: this.page.PageCount, // 总页码
        totalList: this.page.TotalRecordCount, // 记录总数量
        callback: (num: number) => {
          this.change.emit(num);
        },
        display: {
          totalNum: this.total,
          totalList: this.total,
          jump: this.jump,
          first: this.first,
          last: this.last,
        },
        text: this.text,
      });
    }
  }

  @ViewChild('paginator') element?: ElementRef<HTMLDivElement>;
}
