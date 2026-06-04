import {
  AfterContentInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

declare let $: any;

@Directive({
  selector: '[wheel-input-number]',
})
export class WheelInputNumberDirective
  implements OnInit, OnChanges, AfterContentInit, OnDestroy
{
  @Input() value?: number = 0;
  @Output() valueChange = new EventEmitter<number>();

  constructor(e: ElementRef) {
    this.ele = e.nativeElement;
  }
  private isInnerUpdate = false;
  private ele: HTMLInputElement;
  private handle: {
    wheel?: any;
    input?: any;
  } = {};

  ngOnInit(): void {
    this.ele.value = `${this.value?.toFixed(0)}`;
    this.handle.wheel = this.on.wheel.bind(this);
    this.handle.input = this.on.input.bind(this);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.ele.value = `${this.value?.toFixed(0)}`;
  }
  ngAfterContentInit(): void {
    this.ele.addEventListener('wheel', this.handle.wheel);
    this.ele.addEventListener('input', this.handle.input);
  }
  ngOnDestroy(): void {
    this.ele.removeEventListener('wheel', this.handle.wheel);
    this.ele.removeEventListener('input', this.handle.input);
  }
  on = {
    wheel: (e: WheelEvent) => {
      e.preventDefault();

      let min = Number.MIN_SAFE_INTEGER;
      let max = Number.MAX_SAFE_INTEGER;
      let step = 1;
      let value = this.value ?? 0;

      if (this.ele.value) value = parseFloat(this.ele.value);
      if (this.ele.min) min = parseFloat(this.ele.min);
      if (this.ele.max) max = parseFloat(this.ele.max);
      if (this.ele.step) step = parseFloat(this.ele.step);

      if (e.deltaY < 0) {
        value = Math.min(value + step, max);
      } else {
        value = Math.max(value - step, min);
      }

      this.isInnerUpdate = true;

      this.value = value;
      this.ele.value = `${value}`;

      this.valueChange.emit(this.value);
    },
    input: (e: Event) => {
      if (this.isInnerUpdate) {
        this.isInnerUpdate = false;
        return;
      }

      let input = e.currentTarget as HTMLInputElement;
      let value = parseFloat(input.value) || 0;

      this.value = value;
      this.valueChange.emit(this.value);
    },
  };
}
