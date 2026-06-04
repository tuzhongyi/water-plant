import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[view-loading]',
})
export class ViewLoadingDirective implements AfterViewInit {
  constructor(e: ElementRef<HTMLElement>) {
    this.element = e.nativeElement;
    this.element.style.display = 'none';
  }

  private element: HTMLElement;

  ngAfterViewInit(): void {}
}
