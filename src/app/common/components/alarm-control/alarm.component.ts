import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { AlarmViewModel } from './alram.model';

@Component({
  selector: 'app-alarm',
  imports: [CommonModule],
  templateUrl: './alarm.component.html',
  styleUrls: ['./alarm.component.less'],
})
export class AlarmComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input()
  model = new AlarmViewModel();

  @Input()
  background = true;
  @Input()
  title: string = '';

  @Input()
  closeButton = true;

  private _style: any = {
    width: '80%',
    height: '80%',
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    top: '50%',
    left: '50%',
  };
  public get style(): any {
    return this._style;
  }
  @Input()
  public set style(v: any) {
    this._style = Object.assign(this._style, v);
  }

  @Output()
  OnClosing: EventEmitter<boolean> = new EventEmitter();

  @Input()
  manualClose = false;

  constructor() {}

  @ViewChild('audio')
  audio?: ElementRef<HTMLAudioElement>;
  @ViewChild('titleEl')
  titleEl?: ElementRef<HTMLElement>;

  loop = true;

  ngOnInit() {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['title']) {
      this.fitTitle();
    }
  }
  ngAfterViewInit(): void {
    if (this.audio) {
      this.audio.nativeElement.addEventListener('ended', (e) => {
        if (this.loop) {
          let target = e.target as HTMLAudioElement;
          setTimeout(() => {
            target.play();
          }, 1 * 1000);
        }
      });
    }
    this.fitTitle();
  }
  ngOnDestroy(): void {
    this.loop = false;
  }

  private fitTitle() {
    const el = this.titleEl?.nativeElement;
    if (!el) return;

    el.style.fontSize = '';
    const max = parseFloat(getComputedStyle(el).fontSize);
    let low = 12;
    let high = max;
    let best = max;

    for (let i = 0; i < 30; i++) {
      const mid = (low + high) / 2;
      el.style.fontSize = `${mid}px`;
      if (el.scrollHeight <= el.clientHeight) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    el.style.fontSize = `${Math.floor(best)}px`;
  }

  closeButtonClick() {
    if (this.manualClose === false) {
      this.model.show.set(false);
    }
    this.OnClosing.emit(true);
  }
}
