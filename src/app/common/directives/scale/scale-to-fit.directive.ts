import {
  AfterViewChecked,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';

@Directive({
  selector: '[scale-to-fit]',
})
export class ScaleToFitDirective
  implements OnInit, AfterViewChecked, OnDestroy
{
  // 可选：是否开启宽度约束（默认仅高度约束）
  @Input() constrainWidth = false;
  // 可选：缩放过渡时间（单位ms，0为无动画）
  @Input() transitionDuration = 300;
  // 可选：最小缩放比例（防止缩得太小）
  @Input() minScale = 0.5;

  // ✅ 新增：缩放中心点（transform-origin），默认左上角
  @Input() transformOrigin: string = 'top left';

  private resizeObserver?: ResizeObserver;
  private isScaling = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const element = this.el.nativeElement;
    // ✅ 使用自定义的中心点
    element.style.transformOrigin = this.transformOrigin;
    element.style.transition = `transform ${this.transitionDuration}ms ease`;
    element.style.display = 'inline-block';
    element.style.width = 'fit-content';

    this.initResizeObserver();
  }

  ngAfterViewChecked(): void {
    this.calculateAndApplyScale();
  }

  private calculateAndApplyScale(): void {
    if (this.isScaling) return;
    this.isScaling = true;

    const child = this.el.nativeElement;
    const parent = child.parentElement;

    if (!parent) {
      this.isScaling = false;
      return;
    }

    // 每次计算前更新 transformOrigin（支持动态修改）
    child.style.transformOrigin = this.transformOrigin;
    child.style.transform = 'scale(1)';

    const childHeight = child.scrollHeight;
    const childWidth = child.scrollWidth;
    const parentHeight = parent.clientHeight;
    const parentWidth = parent.clientWidth;

    let scale = 1;
    const heightScale = parentHeight / childHeight;
    const widthScale = parentWidth / childWidth;

    if (heightScale < 1) {
      scale = heightScale;
    }
    if (this.constrainWidth && widthScale < scale) {
      scale = widthScale;
    }

    scale = Math.max(scale, this.minScale);
    child.style.transform = `scale(${scale})`;

    parent.style.overflow = 'hidden';
    this.isScaling = false;
  }

  private initResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.calculateAndApplyScale();
    });
    this.resizeObserver.observe(this.el.nativeElement);
    this.resizeObserver.observe(this.el.nativeElement.parentElement!);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
