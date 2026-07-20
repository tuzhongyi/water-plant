import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SystemMainThreeConfigFindComponent } from '../system-main-three-config-find/system-main-three-config-find.component';

@Component({
  selector: 'hw-system-main-three-config-manager',
  imports: [CommonModule, SystemMainThreeConfigFindComponent],
  templateUrl: './system-main-three-config-manager.component.html',
  styleUrl: './system-main-three-config-manager.component.less',
})
export class SystemMainThreeConfigManagerComponent {}
