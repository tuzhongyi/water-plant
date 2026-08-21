import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AccountOperationComponent } from './account-operation/account-operation.component';
import { HeaderInformationComponent } from './header-information/header-information.component';

@Component({
  selector: 'howell-header',
  imports: [
    CommonModule,
    HeaderInformationComponent,
    AccountOperationComponent,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less'],
})
export class HeaderComponent implements OnInit {
  @Input() visibility: boolean = true;
  @Output() visibilityChange = new EventEmitter<boolean>();

  @Input() title: string = '惠南水厂智能平台';
  @Input() date: Date = new Date();

  constructor() {}
  Navigation = Navigation;

  ngOnInit(): void {}

  on = {
    visibility: () => {
      this.visibility = !this.visibility;
      this.visibilityChange.emit(this.visibility);
    },
  };
}

enum Navigation {
  map = '/system/main',
  download = '/system/download',
}
