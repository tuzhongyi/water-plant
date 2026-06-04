import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ThreeDimensionComponent } from '../../../common/components/three-dimension/three-dimension.component';
import { PathTool } from '../../../common/tools/path-tool/path.tool';
import { EditInputs } from '../system-main-three-container/controller/models/types';

@Component({
  selector: 'hw-system-main-three-manager',
  imports: [CommonModule, ThreeDimensionComponent],
  templateUrl: './system-main-three-manager.html',
  styleUrl: './system-main-three-manager.less',
})
export class SystemMainThreeManager {
  @Output() modelClicked = new EventEmitter<string>();
  @Output() modelHovered = new EventEmitter<string | undefined>();
  @Output() transformChanged = new EventEmitter<EditInputs>();

  path = PathTool.three.get.glb('VIL.glb');

  on = {
    model: {
      click: (id: string) => {
        this.modelClicked.emit(id);
        console.log(id);
      },
      over: (id?: string) => {
        this.modelHovered.emit(id);
        console.log(id);
      },
    },
    transform: (args: EditInputs) => {
      this.transformChanged.emit(args);
      console.log(args);
    },
  };
}
