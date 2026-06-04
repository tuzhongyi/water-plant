import {
  Directive,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';

type Anchor =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | { x: number; y: number };

interface ConnectLineConfig {
  from: HTMLElement;
  to: HTMLElement;
  fromAnchor?: Anchor;
  toAnchor?: Anchor;
}

@Directive({
  selector: '[connect-line]',
})
export class ConnectLineDirective implements OnInit, OnDestroy {
  @Input('connectLine') config!: ConnectLineConfig;

  private rafId: number | null = null;

  constructor(private el: ElementRef<HTMLElement>, private ngZone: NgZone) {}

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      this.update();
    });
  }

  ngOnDestroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  private getAnchorPoint(rect: DOMRect, anchor: Anchor = 'center') {
    switch (anchor) {
      case 'top':
        return {
          x: rect.left + rect.width / 2,
          y: rect.top,
        };
      case 'bottom':
        return {
          x: rect.left + rect.width / 2,
          y: rect.bottom,
        };
      case 'left':
        return {
          x: rect.left,
          y: rect.top + rect.height / 2,
        };
      case 'right':
        return {
          x: rect.right,
          y: rect.top + rect.height / 2,
        };
      case 'center':
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      default:
        // 百分比锚点
        return {
          x: rect.left + rect.width * anchor.x,
          y: rect.top + rect.height * anchor.y,
        };
    }
  }

  private update = () => {
    const {
      from,
      to,
      fromAnchor = 'center',
      toAnchor = 'center',
    } = this.config;

    if (!from || !to) return;

    const rect1 = from.getBoundingClientRect();
    const rect2 = to.getBoundingClientRect();

    const p1 = this.getAnchorPoint(rect1, fromAnchor);
    const p2 = this.getAnchorPoint(rect2, toAnchor);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const lineEl = this.el.nativeElement;

    lineEl.style.position = 'fixed';
    lineEl.style.left = `${p1.x}px`;
    lineEl.style.top = `${p1.y}px`;
    lineEl.style.width = `${length}px`;
    lineEl.style.height = '2px';
    lineEl.style.transformOrigin = '0 0';
    lineEl.style.transform = `rotate(${angle}deg)`;
    lineEl.style.pointerEvents = 'none';

    this.rafId = requestAnimationFrame(this.update);
  };
}
