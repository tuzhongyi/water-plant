import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subscription } from 'rxjs';

@Directive({ selector: '[video-directive]' })
export class VideoDirective implements OnInit, OnDestroy {
  @Input() keycontrol = false;
  @Input() wheelcontrol = false;
  @Input() step = 1 / 25;
  @Input() wheel?: EventEmitter<WheelEvent>;
  constructor(private e: ElementRef<HTMLVideoElement>) {
    this.playing = !!e.nativeElement.getAttribute('autoplay');
  }

  playing = false;

  pause() {
    this.nativeElement.pause();
    this.playing = false;
  }
  play() {
    this.nativeElement.play();
    this.playing = true;
  }

  get controls() {
    return this.nativeElement.controls;
  }
  set controls(value: boolean) {
    this.nativeElement.controls = value;
  }

  get currentTime() {
    return this.nativeElement.currentTime;
  }

  get nativeElement() {
    return this.e.nativeElement;
  }

  private handle: { keypress?: any; wheel?: any } = {};
  private subscription = new Subscription();

  ngOnInit(): void {
    if (this.keycontrol) {
      this.regist.keypress();
    }
    if (this.wheelcontrol) {
      this.regist.wheel();
    }
    if (this.wheel) {
      let sub = this.wheel.subscribe((x) => {
        this.on.mouse.wheel(x);
      });
      this.subscription.add(sub);
    }
  }
  ngOnDestroy(): void {
    if (this.handle.keypress) {
      window.removeEventListener('keydown', this.handle.keypress);
      this.handle.keypress = undefined;
    }
    if (this.handle.wheel) {
      this.nativeElement.removeEventListener('wheel', this.handle.wheel);
      this.handle.wheel = undefined;
    }
    this.subscription.unsubscribe();
  }

  private regist = {
    keypress: () => {
      this.handle.keypress = this.on.key.press;
      window.addEventListener('keydown', this.handle.keypress);
    },
    wheel: () => {
      this.handle.wheel = this.on.mouse.wheel;
      this.nativeElement.addEventListener('wheel', this.handle.wheel, {
        passive: false,
      });
    },
  };

  async capture() {
    return new Promise<VideoCaptureModel>((resolve) => {
      let canvas = document.createElement('canvas');
      canvas.width = this.nativeElement.clientWidth;
      canvas.height = this.nativeElement.clientHeight;
      let context = canvas.getContext('2d') as CanvasRenderingContext2D;
      context.drawImage(this.nativeElement, 0, 0, canvas.width, canvas.height);
      let src = canvas.toDataURL('image/png');
      this.pause();
      canvas.toBlob((blob) => {
        if (blob) {
          blob.arrayBuffer().then((buffer) => {
            resolve({ src, buffer });
          });
        }
      });
    });
  }

  on = {
    key: {
      press: (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement) {
          return;
        }

        switch (e.code) {
          case 'Space':
            if (this.playing) {
              this.pause();
            } else {
              this.play();
            }
            break;
          case 'ArrowLeft':
            if (this.playing) {
              this.pause();
            }

            this.on.step.back();
            break;
          case 'ArrowRight':
            if (this.playing) {
              this.pause();
            }
            this.on.step.forward();
            break;

          default:
            break;
        }
      },
    },
    mouse: {
      wheel: (e: WheelEvent) => {
        e.preventDefault();

        let time = this.currentTime;
        if (time == null) return;

        // 滚轮滚动时先暂停
        if (this.playing) {
          this.pause();
        }

        if (e.deltaY > 0) {
          // 向上滚：快进
          this.nativeElement.currentTime = time + this.step;
        } else {
          // 向下滚：快退
          this.nativeElement.currentTime = Math.max(0, time - this.step);
        }
      },
    },
    step: {
      forward: () => {
        let time = this.currentTime;
        if (time != undefined) {
          time += this.step;
          this.nativeElement.currentTime = time;
        }
      },
      back: () => {
        let time = this.currentTime;
        if (time != undefined) {
          time -= this.step;
          this.nativeElement.currentTime = time;
        }
      },
    },
  };
}

export interface VideoCaptureModel {
  src: string;
  buffer: ArrayBuffer;
}
