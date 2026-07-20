import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { ConfigRequestService } from '../../common/data-core/request/config/config-request.service';
import { GlobalStorage } from '../../common/storage/global.storage';
import { LocalStorage } from '../../common/storage/local.storage';
import { HeaderComponent } from '../../share/header/header.component';

@Component({
  selector: 'hw-system',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './system.html',
  styleUrl: './system.less',
})
export class SystemComponent implements OnInit {
  constructor(
    private local: LocalStorage,
    private global: GlobalStorage,
    private router: Router,
    private config: ConfigRequestService,
  ) {}

  keep = {
    key: 'keep',
    get: () => {
      let time = localStorage.getItem(this.keep.key);
      return time ? new Date(parseInt(time)) : undefined;
    },
    set: (date: Date) => {
      localStorage.setItem(this.keep.key, date.getTime().toString());
    },
    time: () => {
      let time = this.keep.get();
      if (time) {
        let now = new Date();
        return now.getTime() - time.getTime();
      }
      return 0;
    },
    check: () => {
      let time = this.keep.time();
      return time > 5000;
    },
  };

  private regist() {
    setInterval(() => {
      this.keep.set(new Date());
    }, 1000);
  }
  private clear() {
    this.local.clean();
    this.global.destroy();
  }

  ngOnInit(): void {
    // this.regist();
    // if (this.keep.check()) {
    //   this.clear();
    //   this.router.parseUrl(`/${RoutePath.login}`);
    // }

    this.config.version.then((version) => {
      if (this.global.version !== version) {
        location.replace(window.location.href);
        return;
      }
    });
  }
}
