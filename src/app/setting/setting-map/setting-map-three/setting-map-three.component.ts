import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CardComponent } from '../../../common/components/card/card.component';
import { ModelViewerModel } from '../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionComponent } from '../../../common/components/three-dimension/three-dimension.component';
import { PathTool } from '../../../common/tools/path-tool/path.tool';

@Component({
  selector: 'hw-setting-map-three',
  imports: [CommonModule, CardComponent, ThreeDimensionComponent],
  templateUrl: './setting-map-three.component.html',
  styleUrl: './setting-map-three.component.less',
})
export class SettingMapThreeComponent implements OnInit {
  models: ModelViewerModel[] = [
    {
      id: 'VIL',
      url: PathTool.three.get.glb('VIL.glb'),
      fileName: "'VIL.glb'",
    },
  ];

  ngOnInit(): void {
    console.log(this.models);
  }
}
