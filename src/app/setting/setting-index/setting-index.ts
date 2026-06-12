import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Observable } from 'rxjs';
import { CardComponent } from '../../common/components/card/card.component';
import { SettingPath } from '../setting.model';

@Component({
  selector: 'hw-setting-index',
  imports: [CommonModule, CardComponent],
  templateUrl: './setting-index.html',
  styleUrl: './setting-index.less',
})
export class SettingIndexComponent {
  constructor(private router: Router) {}

  SettingPath = SettingPath;

  path: string = location.pathname.substring(1);

  ngOnInit(): void {
    this.load();
  }

  private load() {
    (
      this.router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
      ) as Observable<NavigationEnd>
    ).subscribe((router) => {
      this.path = location.pathname.substring(1);
    });
  }

  changePath(path: SettingPath) {
    this.router.navigateByUrl(`/${path}`);
  }
}
