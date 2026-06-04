import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[hw-select-content]',
})
export class SelectDirective {
  constructor(private e: ElementRef<HTMLSelectElement>) {}

  get nativeElement() {
    return this.e.nativeElement;
  }
}
