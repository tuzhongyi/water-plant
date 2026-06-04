import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PathTool } from '../../../common/tools/path-tool/path.tool';
import { ThreeDimensionComponent } from '../../../common/components/three-dimension/three-dimension.component';
import { EditInputs } from './controller/models/types';

@Component({
  selector: 'hw-system-main-three-container',
  imports: [ThreeDimensionComponent],
  templateUrl: './system-main-three-container.html',
  styleUrl: './system-main-three-container.less',
})
export class SystemMainThreeContainer {
  @Input() path = PathTool.three.get.glb('VIL.glb');
  @Output() modelClicked = new EventEmitter<string>();
  @Output() modelHovered = new EventEmitter<string | undefined>();
  @Output() transformChanged = new EventEmitter<EditInputs>();
}
