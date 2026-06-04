import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

@Directive({
  selector: '[scroll-full]',
})
export class ScrollFullDirective implements OnInit, OnChanges {
  // 输入：当前页码（从 0 或 1 开始都支持）
  @Input() index = 0;

  // 输出：页码变化时发射
  @Output() indexChange = new EventEmitter<number>();

  // 滚动锁
  private isScrolling = false;
  private scrollEl: HTMLElement;

  constructor(private el: ElementRef) {
    this.scrollEl = this.el.nativeElement;
  }

  ngOnInit(): void {
    this.initStyle();
    // 初始化滚动到输入的 page
    this.scrollToPage(this.index);
  }

  // 外部修改 page → 自动滚动到对应页
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['index'] && !changes['index'].firstChange) {
      this.scrollToPage(this.index);
    }
  }

  /** 初始化滚动吸附样式 */
  private initStyle(): void {
    Object.assign(this.scrollEl.style, {
      overflowY: 'auto',
      scrollSnapType: 'y mandatory',
      scrollBehavior: 'smooth',
      height: '100%',
    });

    // 子元素自动对齐
    const children = this.scrollEl.children;
    for (let i = 0; i < children.length; i++) {
      (children[i] as HTMLElement).style.scrollSnapAlign = 'start';
    }
  }

  // ==============================================
  // 功能 1：鼠标滚轮 → 每次滚动一页
  // ==============================================
  @HostListener('wheel', ['$event'])
  onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (this.isScrolling) return;

    this.isScrolling = true;
    const pageHeight = this.scrollEl.clientHeight;
    const direction = e.deltaY > 0 ? 1 : -1;
    const targetPage = this.index + direction;

    this.scrollToPage(targetPage);

    setTimeout(() => {
      this.isScrolling = false;
    }, 500);
  }

  // ==============================================
  // 功能 2：滚动条拖动 → 自动吸附到整页
  // ==============================================
  @HostListener('scrollend')
  onScrollEnd(): void {
    this.autoDetectPage();
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    this.autoDetectPage();
  }

  // ==============================================
  // 核心方法：自动检测当前是第几页
  // ==============================================
  private autoDetectPage(): void {
    const pageHeight = this.scrollEl.clientHeight;
    const currentScroll = this.scrollEl.scrollTop;
    const currentPage = Math.round(currentScroll / pageHeight);

    if (currentPage !== this.index) {
      this.index = currentPage;
      this.indexChange.emit(currentPage); // 输出当前页
    }

    this.snapToPage(currentPage);
  }

  // ==============================================
  // 核心方法：滚动到指定页码
  // ==============================================
  scrollToPage(page: number): void {
    const pageCount = this.scrollEl.children.length;
    // 限制页码范围
    const safePage = Math.max(0, Math.min(page, pageCount - 1));

    this.index = safePage;
    const targetTop = safePage * this.scrollEl.clientHeight;

    this.scrollEl.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    });

    this.indexChange.emit(safePage);
  }

  // 吸附到最近一页
  private snapToPage(page: number): void {
    const targetTop = page * this.scrollEl.clientHeight;
    this.scrollEl.scrollTo({ top: targetTop, behavior: 'smooth' });
  }
}
