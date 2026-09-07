import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'howell-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.less'],
  encapsulation: ViewEncapsulation.None,
})
export class CardComponent implements OnInit {
  constructor() {}

  @ViewChild('card_container') element?: ElementRef<HTMLDivElement>;

  ngOnInit(): void {}
}
