import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';

@Directive({
  selector: '[scroll-full]',
})
export class ScrollFullDirective implements OnInit, OnDestroy {
  // 滚动锁，防止多次触发
  private isScrolling = false;
  // 滚动条拖动状态
  private isDragging = false;
  // 父容器元素
  private scrollEl: HTMLElement;

  constructor(private el: ElementRef) {
    this.scrollEl = this.el.nativeElement;
  }

  ngOnInit(): void {
    // 初始化必须样式
    this.initStyle();
  }

  ngOnDestroy(): void {
    // 清理监听（可选）
  }

  /** 初始化 CSS 滚动吸附（增强体验） */
  private initStyle(): void {
    Object.assign(this.scrollEl.style, {
      overflowY: 'auto',
      scrollSnapType: 'y mandatory',
      scrollBehavior: 'smooth',
      height: '100%',
    });

    // 给所有子元素添加吸附对齐
    const children = this.scrollEl.children;
    for (let i = 0; i < children.length; i++) {
      (children[i] as HTMLElement).style.scrollSnapAlign = 'start';
    }
  }

  // ======================================
  // 方法1：鼠标滚轮 → 每次滚动一整屏
  // ======================================
  @HostListener('wheel', ['$event'])
  onWheel(e: WheelEvent): void {
    e.preventDefault();

    if (this.isScrolling) return;
    this.isScrolling = true;

    const height = this.scrollEl.clientHeight;
    const direction = e.deltaY > 0 ? 1 : -1;
    const target = this.scrollEl.scrollTop + direction * height;

    this.scrollEl.scrollTo({ top: target, behavior: 'smooth' });

    // 解锁
    setTimeout(() => {
      this.isScrolling = false;
    }, 500);
  }

  // ======================================
  // 方法2：滚动条拖动 → 自动吸附锚定
  // ======================================
  @HostListener('mousedown')
  onMouseDown(): void {
    this.isDragging = true;
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    this.snapToScreen();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.snapToScreen();
  }

  @HostListener('scrollend')
  onScrollEnd(): void {
    this.snapToScreen();
  }

  /** 自动吸附到最近整屏位置 */
  private snapToScreen(): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    const height = this.scrollEl.clientHeight;
    const current = this.scrollEl.scrollTop;
    const targetScreen = Math.round(current / height);
    const target = targetScreen * height;

    this.scrollEl.scrollTo({ top: target, behavior: 'smooth' });
  }
}
