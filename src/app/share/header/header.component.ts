import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AccountOperationComponent } from './account-operation/account-operation.component';
import { HeaderInformationComponent } from './header-information/header-information.component';

@Component({
  selector: 'howell-header',
  imports: [CommonModule, HeaderInformationComponent, AccountOperationComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less'],
})
export class HeaderComponent implements OnInit {
  @Input() visibility: boolean = true;
  @Output() visibilityChange = new EventEmitter<boolean>();

  @Input() title: string = '南惠水厂智能平台';
  @Input() date: Date = new Date();

  constructor() {}

  ngOnInit(): void {}

  onvisibility() {
    this.visibility = !this.visibility;
    this.visibilityChange.emit(this.visibility);
  }
}
