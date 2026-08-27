import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { CommonModule } from '@angular/common';
import { RegionNode, RoutePath } from '../../../app.path';
import { LocalStorage } from '../../../common/storage/local.storage';
import { AccountOperationDisplay } from './account-operation.model';

@Component({
  selector: 'app-account-operation',
  imports: [CommonModule],
  templateUrl: './account-operation.component.html',
  styleUrls: ['./account-operation.component.less'],
})
export class AccountOperationComponent implements OnInit, OnDestroy {
  constructor(
    private local: LocalStorage,
    private router: Router,
  ) {}

  username: string = '';
  display = new AccountOperationDisplay();
  /** 当前浏览器 URL 对应页面（用于高亮选中态） */
  selected = {
    main: false,
    video: false,
    setting: false,
  };

  private sub = new Subscription();

  ngOnInit(): void {
    let info = this.local.auth.get();
    if (info) {
      this.username = info.username;
    }
    this.init();
    this.sub.add(
      this.router.events.subscribe((e) => {
        if (e instanceof NavigationEnd) {
          this.update(e.urlAfterRedirects);
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private init() {
    this.update(location.toString());
  }

  /** 根据当前 URL 刷新各入口选中态 */
  private update(url: string) {
    url = url.toLowerCase();
    this.display.setting = !url.includes('setting');
    this.selected.main = url.includes(`${RegionNode.system}/${RegionNode.main}`);
    this.selected.video = url.includes(`${RegionNode.system}/${RegionNode.video}`);
    this.selected.setting = url.includes(`${RegionNode.setting}`);
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
      this.router.navigateByUrl(RegionNode.login);
    },
    help: () => {
      window.open(`http://${location.hostname}:${location.port ?? 80}/help/help.html`);
    },
    setting: () => {
      this.router.navigateByUrl(RegionNode.setting);
    },
    main: () => {
      this.router.navigateByUrl(`${RegionNode.system}/${RegionNode.main}`);
    },

    download: () => {
      window.open(RoutePath.download, '_blank');
    },
    video: () => {
      this.router.navigateByUrl(`${RegionNode.system}/${RegionNode.video}`);
    },
  };
}
