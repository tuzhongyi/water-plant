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
  SimpleChange,
  SimpleChanges,
} from '@angular/core';

declare let $: any;

@Directive({
  selector: '[wheel-horizontal-scroll]',
})
export class WheelHorizontalScrollDirective
  implements OnInit, OnChanges, AfterContentInit, OnDestroy
{
  @Input() position: number = 0;
  @Output() positionChange = new EventEmitter<number>();

  scrollabled = false;

  constructor(e: ElementRef) {
    this.ele = e.nativeElement;
  }

  private ele: HTMLInputElement;
  private handle: any;
  private change = {
    position: (change: SimpleChange) => {
      if (change) {
        let value = change.currentValue;
        if (value >= 0 && value <= 100) {
          this.ele.scrollLeft = (this.ele.scrollWidth * value) / 100;
        }
      }
    },
  };

  ngOnChanges(changes: SimpleChanges): void {
    this.change.position(changes['position']);
  }
  ngOnInit(): void {
    this.handle = this.event.bind(this);
  }
  ngAfterContentInit(): void {
    this.ele.addEventListener('wheel', this.handle);
    this.scrollabled = this.ele.scrollWidth > this.ele.clientWidth;
  }
  ngOnDestroy(): void {
    this.ele.removeEventListener('wheel', this.handle);
  }

  event(e: WheelEvent) {
    e.preventDefault();
    this.ele.scrollBy({
      left: e.deltaY < 0 ? -120 : 120,
    });

    this.positionChange.emit(
      (this.ele.scrollLeft / this.ele.scrollWidth) * 100
    );
    e.stopImmediatePropagation();
  }
}
