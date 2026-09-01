import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Observable } from 'rxjs';
import { CardComponent } from '../../../common/components/card/card.component';
import { SystemPath } from '../../system.model';

@Component({
  selector: 'hw-system-video-index',
  imports: [CommonModule, RouterOutlet, CardComponent],
  templateUrl: './system-video-index.component.html',
  styleUrl: './system-video-index.component.less',
})
export class SystemVideoIndexComponent {
  constructor(private router: Router) {}

  Path = SystemPath;

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

  on = {
    path: (path: string) => {
      this.router.navigateByUrl(`/${path}`);
    },
  };
}
