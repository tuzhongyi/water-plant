import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

@Directive({
  selector: '[scroll]',
  exportAs: 'appScroll',
})
export class ScrollDirective implements OnInit, OnDestroy {
  // 方向：'vertical' 或 'horizontal'
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  // 内容选择器（默认 .content）
  @Input() contentSelector = '.content';
  // 是否启用滚轮（默认 true）
  @Input() wheelEnabled = true;

  @Output() appScrollChange = new EventEmitter<{
    scrollPos: number; // 当前滚动位置（scrollTop 或 scrollLeft）
    maxScroll: number; // 最大可滚动距离
    contentSize: number; // 内容总尺寸（高度或宽度）
    wrapperSize: number; // 可视区尺寸
  }>();

  private wrapperEl: HTMLElement;
  private contentEl!: HTMLElement;
  private mutationObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private onScrollBound = this.onScroll.bind(this);
  private onWheelBound = this.onWheel.bind(this);

  constructor(private elementRef: ElementRef, private ngZone: NgZone) {
    this.wrapperEl = elementRef.nativeElement;
  }

  ngOnInit() {
    this.contentEl = this.wrapperEl.querySelector(
      this.contentSelector
    ) as HTMLElement;
    if (!this.contentEl) {
      console.error(
        `ScrollDirective: 未找到内容元素 (selector: ${this.contentSelector})`
      );
      return;
    }

    // 在容器上添加方向类（便于 CSS 样式）
    this.wrapperEl.classList.add(`scroll-${this.orientation}`);

    this.ngZone.runOutsideAngular(() => {
      this.wrapperEl.addEventListener('scroll', this.onScrollBound);
      if (this.wheelEnabled) {
        this.wrapperEl.addEventListener('wheel', this.onWheelBound, {
          passive: false,
        });
      }
    });

    this.mutationObserver = new MutationObserver(() => this.emitScrollInfo());
    this.mutationObserver.observe(this.contentEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.emitScrollInfo());
      this.resizeObserver.observe(this.wrapperEl);
      this.resizeObserver.observe(this.contentEl);
    }
  }

  ngOnDestroy() {
    this.wrapperEl.removeEventListener('scroll', this.onScrollBound);
    this.wrapperEl.removeEventListener('wheel', this.onWheelBound);
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();
  }

  // 获取当前滚动信息（根据方向）
  getScrollInfo() {
    if (this.orientation === 'vertical') {
      const wrapperHeight = this.wrapperEl.clientHeight;
      const contentHeight = this.contentEl.scrollHeight;
      const scrollTop = this.wrapperEl.scrollTop;
      const maxScroll = Math.max(0, contentHeight - wrapperHeight);
      return {
        scrollPos: scrollTop,
        maxScroll,
        contentSize: contentHeight,
        wrapperSize: wrapperHeight,
      };
    } else {
      const wrapperWidth = this.wrapperEl.clientWidth;
      const contentWidth = this.contentEl.scrollWidth;
      const scrollLeft = this.wrapperEl.scrollLeft;
      const maxScroll = Math.max(0, contentWidth - wrapperWidth);
      return {
        scrollPos: scrollLeft,
        maxScroll,
        contentSize: contentWidth,
        wrapperSize: wrapperWidth,
      };
    }
  }

  // 设置滚动位置（根据方向）
  scrollTo(position: number) {
    const { maxScroll } = this.getScrollInfo();
    const target = Math.max(0, Math.min(position, maxScroll));
    if (this.orientation === 'vertical') {
      this.wrapperEl.scrollTop = target;
    } else {
      this.wrapperEl.scrollLeft = target;
    }
    this.onScroll(); // 立即触发事件（scroll 事件可能延迟）
  }

  private onScroll() {
    const info = this.getScrollInfo();
    this.ngZone.run(() => this.appScrollChange.emit(info));
  }

  private onWheel(event: WheelEvent) {
    const info = this.getScrollInfo();
    if (info.contentSize <= info.wrapperSize) return; // 无需滚动

    event.preventDefault();

    // 根据方向选择滚轮增量
    let delta: number;
    if (this.orientation === 'vertical') {
      delta = event.deltaY;
    } else {
      // 水平滚动优先使用 deltaX，若为0则尝试 deltaY（触控板水平滑动有时会使用 deltaY + shift）
      delta = event.deltaX !== 0 ? event.deltaX : event.deltaY;
    }

    let newScrollPos = info.scrollPos + delta;
    newScrollPos = Math.max(0, Math.min(newScrollPos, info.maxScroll));
    this.scrollTo(newScrollPos);
  }

  // 手动触发刷新（供外部调用）
  emitScrollInfo() {
    this.onScroll();
  }
}
