import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { PathTool } from '../../tools/path-tool/path.tool';
import { wait } from '../../tools/wait';
import { EditInputs } from './controller/models/types';
import { ThreeDimensionController } from './controller/three-dimension.controller';

@Component({
  selector: 'hw-3d',
  imports: [],
  templateUrl: './three-dimension.html',
  styleUrl: './three-dimension.less',
  providers: [ThreeDimensionController],
})
export class ThreeDimensionComponent implements OnInit, OnDestroy {
  @Input() path = PathTool.three.get.glb('VIL.glb');
  @Output() modelClicked = new EventEmitter<string>();
  @Output() modelHovered = new EventEmitter<string | undefined>();
  @Output() transformChanged = new EventEmitter<EditInputs>();

  constructor(private controller: ThreeDimensionController) {}

  @ViewChild('canvas') ref?: ElementRef<HTMLCanvasElement>;

  ngOnInit(): void {
    this.waiting();
  }

  waiting() {
    let canvas: HTMLCanvasElement;
    wait(() => {
      if (this.ref) {
        canvas = this.ref.nativeElement;
        return canvas.clientWidth > 0 && canvas.clientHeight > 0;
      }
      return false;
    }).then(() => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      this.load(this.path, canvas);
    });
  }

  load(path: string, canvas: HTMLCanvasElement) {
    this.controller.load(path, canvas);
  }
  ngOnDestroy(): void {
    this.controller.destroy();
  }
}
