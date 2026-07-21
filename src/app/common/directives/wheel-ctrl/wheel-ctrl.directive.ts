import {
  AfterContentInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

@Directive({
  selector: '[wheel-ctrl]',
  standalone: true,
})
export class WheelCtrlDirective implements OnInit, AfterContentInit, OnDestroy {
  @Input() value = 0;
  @Input() step = 1;
  @Input() min = Number.MIN_SAFE_INTEGER;
  @Input() max = Number.MAX_SAFE_INTEGER;
  @Output() valueChange = new EventEmitter<number>();

  private ele: HTMLElement;
  private handle!: (e: WheelEvent) => void;

  constructor(e: ElementRef) {
    this.ele = e.nativeElement;
  }

  ngOnInit(): void {
    this.handle = this.onWheel.bind(this);
  }

  ngAfterContentInit(): void {
    this.ele.addEventListener('wheel', this.handle, { passive: false, capture: true });
  }

  ngOnDestroy(): void {
    this.ele.removeEventListener('wheel', this.handle);
  }

  private onWheel(e: WheelEvent): void {
    if (!e.ctrlKey) return;

    e.preventDefault();
    e.stopPropagation();

    let value = this.value;
    if (e.deltaY < 0) {
      value = Math.min(value + this.step, this.max);
    } else {
      value = Math.max(value - this.step, this.min);
    }

    this.value = value;
    this.valueChange.emit(this.value);
  }
}
