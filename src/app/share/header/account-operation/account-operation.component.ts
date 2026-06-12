import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { RoutePath } from '../../../app.path';
import { LocalStorage } from '../../../common/storage/local.storage';
import { AccountOperationDisplay } from './account-operation.model';

@Component({
  selector: 'app-account-operation',
  imports: [CommonModule],
  templateUrl: './account-operation.component.html',
  styleUrls: ['./account-operation.component.less'],
})
export class AccountOperationComponent implements OnInit {
  constructor(
    private local: LocalStorage,
    private router: Router,
  ) {}

  username: string = '';
  display = new AccountOperationDisplay();

  ngOnInit(): void {
    let info = this.local.auth.get();
    if (info) {
      this.username = info.username;
    }
    this.init();
  }

  private init() {
    let url = location.toString();
    this.display.setting = !url.toLowerCase().includes('setting');
  }

  @HostListener('window:click')
  window_click() {
    this.menu.show = false;
  }

  menu = {
    show: false,
    target: (e: Event) => {
      this.menu.show = !this.menu.show;
      e.stopPropagation();
    },
  };

  on = {
    logout: () => {
      this.router.navigateByUrl(RoutePath.login);
    },
    help: () => {
      window.open(`http://${location.hostname}:${location.port ?? 80}/help/help.html`);
    },
    setting: () => {
      this.router.navigateByUrl(RoutePath.setting);
    },
    main: () => {
      this.router.navigateByUrl(RoutePath.system);
    },
  };
}
