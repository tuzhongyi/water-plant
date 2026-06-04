import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Directive({
  selector: '[scroll-bar]',
})
export class ScrollBarDirective {
  @Output() positionChange = new EventEmitter<number>();

  @Input() wheelStep = 0.02;
  @Input() barWidth = 50;
  @Input() barPercent?: number;

  private dragging = false;
  private clickOffsetX = 0;

  constructor(private el: ElementRef<HTMLElement>) {}

  private get bar() {
    return this.el.nativeElement;
  }
  private get track() {
    return this.bar.parentElement as HTMLElement;
  }

  private getActualBarWidth(): number {
    const trackWidth = this.track.clientWidth;
    if (this.barPercent !== undefined) {
      return Math.max(0, Math.min(1, this.barPercent)) * trackWidth;
    }
    return Math.min(this.barWidth, trackWidth);
  }

  // -------------------
  // 拖动
  // -------------------
  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    e.preventDefault();

    const barRect = this.bar.getBoundingClientRect();
    this.clickOffsetX = e.clientX - barRect.left;

    this.dragging = true;

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);

    document.body.style.userSelect = 'none';
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.dragging) return;

    const trackRect = this.track.getBoundingClientRect();
    const trackWidth = this.track.clientWidth;
    const barWidth = this.getActualBarWidth();
    const maxLeft = Math.max(0, trackWidth - barWidth);

    let left = e.clientX - trackRect.left - this.clickOffsetX;
    left = Math.max(0, Math.min(maxLeft, left));

    this.updateUI(left, trackWidth, barWidth);
  };

  private onMouseUp = () => {
    this.dragging = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.body.style.userSelect = '';

    document.addEventListener(
      'click',
      (e) => {
        e.stopPropagation();
        e.preventDefault();
      },
      { once: true, capture: true }
    );
  };

  // -------------------
  // 滚轮
  // -------------------
  @HostListener('wheel', ['$event'])
  onWheel(e: WheelEvent) {
    e.preventDefault();

    const trackWidth = this.track.clientWidth;
    const barWidth = this.getActualBarWidth();
    const maxLeft = Math.max(0, trackWidth - barWidth);

    const currentLeft = parseFloat(this.bar.style.left || '0');

    let newLeft =
      currentLeft +
      (e.deltaY > 0 ? this.wheelStep * maxLeft : -this.wheelStep * maxLeft);
    newLeft = Math.max(0, Math.min(maxLeft, newLeft));

    this.updateUI(newLeft, trackWidth, barWidth);
  }

  // -------------------
  // 更新 UI
  // -------------------
  private updateUI(left: number, trackWidth: number, barWidth: number) {
    this.bar.style.width = `${barWidth}px`;
    this.bar.style.left = `${left}px`;

    // 考虑滑块宽度占比
    let percent = left / trackWidth;
    percent = Math.min(percent, 1 - barWidth / trackWidth);

    this.positionChange.emit(percent);
  }
}
