import { AfterContentInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[text-space-between]',
})
export class TextSpaceBetweenDirective implements AfterContentInit {
  @Input() value: string = '';
  @Input() suffix: string = '';
  constructor(e: ElementRef) {
    this.ele = e.nativeElement;
  }
  private ele: HTMLInputElement;

  ngAfterContentInit(): void {
    if (this.ele) {
      this.ele.style.display = 'flex';
      this.ele.style.justifyContent = 'space-between';
      let value = '';
      if (this.value) {
        value = this.value;
      } else if (this.ele.innerText) {
        value = this.ele.innerText;
        this.ele.innerHTML = '';
      }
      if (value) {
        this.create(value.trim());
      }
    }
  }

  private create(value: string) {
    for (let i = 0; i < value.length; i++) {
      let div = document.createElement('div');
      div.innerHTML = value[i];
      if (this.suffix && i == value.length - 1) {
        div.innerHTML += this.suffix;
      }
      this.ele.appendChild(div);
    }
  }
}
