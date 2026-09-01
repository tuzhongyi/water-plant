import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CardStatistic1Component } from '../../../../common/components/card-statistic-1/card-statistic-1.component';

@Component({
  selector: 'hw-system-video-view-group-manager',
  imports: [
    CommonModule,
    CardStatistic1Component,
    //  SystemVideoViewGroupListComponent
  ],
  templateUrl: './system-video-view-group-manager.component.html',
  styleUrl: './system-video-view-group-manager.component.less',
})
export class SystemVideoViewGroupManagerComponent {}
