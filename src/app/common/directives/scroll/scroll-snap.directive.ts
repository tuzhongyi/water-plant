import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[scroll-snap]',
})
export class ScrollSnapDirective implements OnInit {
  // 吸附阈值百分比
  @Input() snapPercent = 50;
  // 防抖延迟
  @Input() snapDelay = 150;

  private el: HTMLElement;
  private scrollTimer?: NodeJS.Timeout;
  // 标记鼠标是否按下（拖动滚动条时为 true）
  private isMouseDown = false;

  constructor(private elementRef: ElementRef) {
    this.el = this.elementRef.nativeElement;
  }

  ngOnInit(): void {
    // 给容器绑定鼠标按下/抬起事件
    this.el.addEventListener('mousedown', () => {
      this.isMouseDown = true;
    });

    document.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      // 鼠标松开时，立即执行一次吸附判断
      this.autoSnap();
    });
  }

  // 监听滚动
  @HostListener('scroll')
  onScroll(): void {
    // 滚动中只做防抖，不立即执行
    clearTimeout(this.scrollTimer);

    this.scrollTimer = setTimeout(() => {
      // 只有鼠标没按下时才吸附
      if (!this.isMouseDown) {
        this.autoSnap();
      }
    }, this.snapDelay);
  }

  // 核心吸附逻辑
  private autoSnap(): void {
    const scrollTop = this.el.scrollTop;
    const scrollHeight = this.el.scrollHeight;
    const clientHeight = this.el.clientHeight;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 0) return;

    const mid = (maxScroll * this.snapPercent) / 100;

    if (scrollTop <= mid) {
      this.el.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.el.scrollTo({ top: maxScroll, behavior: 'smooth' });
    }
  }
}
