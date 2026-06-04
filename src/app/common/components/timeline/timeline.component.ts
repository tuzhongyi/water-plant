import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChange,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'howell-timeline',
  imports: [CommonModule, FormsModule],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.less',
})
export class TimelineComponent implements OnChanges {
  @Input() datas: Date[] = [];
  @Output('change') _change = new EventEmitter<Date>();
  @Input() playable = true;

  begin?: Date;
  end?: Date;
  current = new Date();
  index = 0;
  @ViewChild('timelineslider') slider?: ElementRef<HTMLInputElement>;

  private change = {
    datas: (simple: SimpleChange) => {
      if (simple) {
        if (this.datas && this.datas.length > 0) {
          this.begin = this.datas[0];
          this.current = new Date(this.begin.getTime());

          if (this.datas.length > 1) {
            this.end = this.datas[this.datas.length - 1];
          }
        }
      }
    },
  };
  ngOnChanges(changes: SimpleChanges): void {
    this.change.datas(changes['datas']);
  }

  on = {
    change: () => {
      if (this.slider) {
        let input = this.slider.nativeElement;
        this.mouse.left = (input.clientWidth / this.datas.length) * this.index;
      }
      this.current = this.datas[this.index];
      this._change.emit(this.current);
    },
  };

  control = {
    playing: false,
    handle: undefined as any,
    play: () => {
      if (this.control.playing) {
        return;
      }
      this.control.handle = setInterval(() => {
        if (this.index < this.datas.length - 1) {
          this.index++;
          this.on.change();
        } else {
          this.control.stop();
        }
      }, 500);
      this.control.playing = true;
    },
    stop: () => {
      if (this.control.playing) {
        clearInterval(this.control.handle);
        this.control.handle = undefined;
        this.control.playing = false;
      }
    },
  };

  mouse = {
    enter: false,
    left: 0,
    up: (e: MouseEvent) => {
      this.mouse.enter = false;
    },
    down: (e: MouseEvent) => {
      this.mouse.enter = true;
      let input = e.currentTarget as HTMLInputElement;
      this.mouse.left = (input.clientWidth / this.datas.length) * this.index;
    },
  };
}
