import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SystemVideoViewGroupListBusiness } from './system-video-view-group-list.business';

@Component({
  selector: 'hw-system-video-view-group-list',
  imports: [CommonModule],
  templateUrl: './system-video-view-group-list.component.html',
  styleUrl: './system-video-view-group-list.component.less',
  providers: [SystemVideoViewGroupListBusiness],
})
export class SystemVideoViewGroupListComponent {}
