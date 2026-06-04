import {
  AfterViewChecked,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';

@Directive({
  selector: '[scale-font-fit]',
})
export class FontFitDirective implements OnInit, AfterViewChecked, OnDestroy {
  @Input() minFontSize = 12;
  @Input() maxFontSize = 28; // 默认最大字号
  @Input() transitionDuration = 0;

  private resizeObserver?: ResizeObserver;
  private lastFontSize = 0;
  private hasCalculated = false; // 关键：只计算一次，防止反复缩
  private isProcessing = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const element = this.el.nativeElement;
    element.style.transition = `font-size ${this.transitionDuration}ms ease`;
    element.style.boxSizing = 'border-box';
  }

  ngAfterViewChecked(): void {
    if (!this.hasCalculated) {
      this.calculatePerfectFontSize();
    }
  }

  /**
   * 核心：精准计算 刚好不超出的最大字号
   */
  private calculatePerfectFontSize(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const child = this.el.nativeElement;
    const parent = child.parentElement;

    if (!parent || parent.clientHeight === 0) {
      this.isProcessing = false;
      return;
    }

    // 等待 DOM 渲染稳定
    setTimeout(() => {
      let low = this.minFontSize;
      let high = this.maxFontSize;
      let bestSize = low;

      // 二分法精准计算（最准确）
      for (let i = 0; i < 30; i++) {
        const mid = (low + high) / 2;
        child.style.fontSize = `${mid}px`;

        if (child.scrollHeight <= parent.clientHeight) {
          bestSize = mid;
          low = mid;
        } else {
          high = mid;
        }
      }

      // 最终应用最佳字号
      child.style.fontSize = `${bestSize}px`;
      this.lastFontSize = bestSize;
      this.hasCalculated = true;
      this.isProcessing = false;

      // 开启监听（后续尺寸变化才重新计算）
      this.initResizeObserver();
    }, 50);
  }

  private initResizeObserver(): void {
    if (this.resizeObserver) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.hasCalculated = false;
    });

    const child = this.el.nativeElement;
    this.resizeObserver.observe(child);
    this.resizeObserver.observe(child.parentElement!);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
