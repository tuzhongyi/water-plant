import {
  AfterViewInit,
  ChangeDetectorRef,
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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ConfigRequestService } from '../../data-core/request/config/config-request.service';
import { base64encode, utf16to8 } from '../../tools/base64-tool/base64.tool';
import { HtmlTool } from '../../tools/html-tool/html.tool';
import { wait } from '../../tools/wait';
import { ButtonName } from './WSPlayerButtonName.enum';
import { VideoPlayerKeepBusiness } from './business/video-player-keep.business';
import { VideoPlayerSubtitleBusiness } from './business/video-player-subtitle.business';
import { VideoPlayerBusiness } from './business/video-player.business';
import { VideoPlayerCreater as Creater } from './video-player.creater';
import {
  PlayerState,
  StreamType,
  TimeArgs,
  VideoModel,
  WSPlayerEventArgs,
} from './video-player.model';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.less'],
  providers: [VideoPlayerSubtitleBusiness, VideoPlayerKeepBusiness, VideoPlayerBusiness],
})
export class VideoPlayerComponent implements OnDestroy, OnInit, AfterViewInit, OnChanges {
  @Input() url?: string;
  @Input() model?: VideoModel;
  @Input() webUrl: string = Creater.WebUrl();
  @Input() name: string = '';
  @Input() index = 0;
  @Input() subtitle = false;
  @Input() localsubtitle = true;
  @Input() play?: EventEmitter<VideoModel>;
  @Input() stop?: EventEmitter<void>;
  @Input() download?: EventEmitter<{ filename: string; type: string }>;
  @Input() resize?: EventEmitter<{ width: number; height: number }>;
  @Input() fullscreen?: EventEmitter<void>;
  @Input() frame?: EventEmitter<void>;
  @Input() resume?: EventEmitter<void>;
  @Input() speedResume?: EventEmitter<void>;
  @Input() pause?: EventEmitter<void>;
  @Input() capturePicture?: EventEmitter<void>;
  @Input() slow?: EventEmitter<void>;
  @Input() fast?: EventEmitter<void>;
  @Input() changeRuleState?: EventEmitter<boolean>;
  @Input() seek?: EventEmitter<number>;
  @Input() subtitling?: EventEmitter<string>;
  @Input() getOSDTime?: EventEmitter<void>;

  @Output() loaded: EventEmitter<void> = new EventEmitter();
  @Output() destroy: EventEmitter<VideoModel> = new EventEmitter();
  @Output() onStoping: EventEmitter<number> = new EventEmitter();
  @Output() onPlaying: EventEmitter<number> = new EventEmitter();
  @Output() getPosition: EventEmitter<number> = new EventEmitter();
  @Output() onButtonClicked: EventEmitter<ButtonName> = new EventEmitter();
  @Output() onViewerDoubleClicked: EventEmitter<number> = new EventEmitter();
  @Output() onRuleStateChanged: EventEmitter<boolean> = new EventEmitter();
  @Output() onViewerClicked: EventEmitter<number> = new EventEmitter();
  @Output() onSubtitleEnableChanged: EventEmitter<WSPlayerEventArgs> = new EventEmitter();
  @Output() onOSDTime: EventEmitter<number> = new EventEmitter();
  @Output() timer = new EventEmitter<TimeArgs>();

  constructor(
    private business: VideoPlayerBusiness,
    private sanitizer: DomSanitizer,
    private config: ConfigRequestService,
    private cdr: ChangeDetectorRef,
  ) {}

  src?: SafeResourceUrl;
  isinited = false;
  isloaded = false;
  playing = false;
  stream: StreamType = StreamType.main;
  registHandle?: NodeJS.Timeout;
  subtitleopened = false;
  private _ruleState: boolean = false;
  private _player?: WSPlayerProxy;
  private get player(): Promise<WSPlayerProxy> {
    return new Promise<WSPlayerProxy>((resolve) => {
      if (this._player) {
        resolve(this._player);
      }
      wait(() => {
        return !!this.iframe && !!this.iframe.nativeElement.contentWindow;
      }).then(() => {
        if (!this._player) {
          this._player = new WSPlayerProxy(this.iframe.nativeElement);
        }
        resolve(this._player);
      });
    });
  }

  @ViewChild('iframe') iframe!: ElementRef<HTMLIFrameElement>;

  getSrc(webUrl: string, url: string, cameraName?: string) {
    // webUrl = webUrl.replace('wsplayer.html', 'wsplayer_v2.html');
    let result = webUrl + '?url=' + base64encode(url);
    if (cameraName) {
      let name = utf16to8(cameraName);
      result += '&name=' + base64encode(name);
    }
    result += '&index=' + this.index;
    return result;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model'] && !changes['model'].firstChange) {
      this.isloaded = false;
    }

    this.load();
  }
  ngAfterViewInit(): void {
    this.load();
  }
  async ngOnInit() {
    this.regist();
    await this.init();
    await this.load();
    this.player.then((x) => {
      this.business.keep.interval(x);
    });
  }
  ngOnDestroy(): void {
    if (this.registHandle) {
      clearTimeout(this.registHandle);
    }
    this.destroy.emit(this.model);

    this.player.then((x) => {
      x.destroy();
    });
    this.business.keep.clear();
  }

  regist() {
    this.business.keep.load.subscribe(() => {
      this.isloaded = false;
      this.load();
    });
    if (this.play) {
      this.play.subscribe((x) => {
        this.model = x;
        this.onplay(x);
      });
    }
    if (this.stop) {
      this.stop.subscribe((x) => {
        this.onstop();
      });
    }
    if (this.download) {
      this.download.subscribe((x) => {
        this.ondownload(x.filename, x.type);
      });
    }
    if (this.resize) {
      this.resize.subscribe((x) => {
        this.onresize(x.width, x.height);
      });
    }
    if (this.fullscreen) {
      this.fullscreen.subscribe((x) => {
        this.onfullScreen();
      });
    }
    if (this.frame) {
      this.frame.subscribe((x) => {
        this.onframe();
      });
    }
    if (this.resume) {
      this.resume.subscribe((x) => {
        this.onresume();
      });
    }
    if (this.speedResume) {
      this.speedResume.subscribe((x) => {
        this.onspeedResume();
      });
    }
    if (this.pause) {
      this.pause.subscribe((x) => {
        this.onpause();
      });
    }
    if (this.capturePicture) {
      this.capturePicture.subscribe((x) => {
        this.oncapturePicture();
      });
    }
    if (this.slow) {
      this.slow.subscribe((x) => {
        this.onslow();
      });
    }
    if (this.fast) {
      this.fast.subscribe((x) => {
        this.onfast();
      });
    }
    if (this.seek) {
      this.seek.subscribe((x) => {
        this.onseek(x);
      });
    }
    if (this.getOSDTime) {
      this.getOSDTime.subscribe((x) => {
        this._getOSDTime();
      });
    }
    if (this.subtitling) {
      this.subtitling.subscribe((text) => {
        this.player.then((x) => {
          x.setSubtitle(text);
        });
      });
    }
  }

  async init() {
    let x = await this.config.get();
    let url = x.videoUrl
      .replace('localhost', location.hostname)
      .replace('127.0.0.1', location.hostname);
    this.webUrl = url;

    if (location.port === '9000') {
      this.webUrl = Creater.WebUrl();
    }
    this.isinited = true;
  }
  load() {
    return new Promise<void>((resolve) => {
      wait(() => {
        return this.isinited;
      }).then(() => {
        if (!this.isloaded) {
          if (this.model) {
            this.url = this.model.toString();
            if (this.model.web) {
              this.webUrl = this.model.web;
            }
          }

          if (this.url) {
            let src = this.getSrc(this.webUrl, this.url, this.name);
            this.src = this.sanitizer.bypassSecurityTrustResourceUrl(src);
            this.isloaded = true;
            this.loaded.emit();
            this.cdr.detectChanges();
          }
        }
        resolve();
      });
    });
  }

  onLoad(event: Event) {
    let iframe = event.target as HTMLIFrameElement;
    if (iframe && iframe.src) {
      this.player.then((x) => {
        this.eventRegist(x);
      });
    }
  }

  async eventRegist(player: WSPlayerProxy) {
    let that = this;
    player.onPlaying = (index: number = 0) => {
      if (this.index != index) return;
      this.business.keep.keep(player);
    };

    player.onRuleStateChanged = (index: number = 0, state: boolean) => {
      if (that.index != index) return;
      // that.saveRuleState(state);
      that.onRuleStateChanged.emit(state);
    };
    player.onStoping = (index: number = 0) => {
      if (document.visibilityState == 'hidden') {
        return;
      }
      try {
        if (that.index != index) return;
        player.status = PlayerState.closed;
        if (!HtmlTool.iframe.crossorigin(that.iframe.nativeElement.src)) {
          try {
            that.iframe.nativeElement.contentWindow?.document.clear();
            that.iframe.nativeElement.src = '';
            that._player = undefined;
          } catch (e) {}
        }

        that.src = undefined;
        that.playing = false;

        this.business.keep.clear({ keep: true });

        that.onStoping.emit(index);
      } catch (error) {
        console.error(error);
      }
    };
    player.getPosition = (index: number = 0, value: number) => {
      if (that.index != index) return;
      if (value >= 1) {
        that.playing = false;
      }

      that.getPosition.emit(value);
    };
    player.getTimer = (index: number = 0, value: TimeArgs) => {
      if (that.index != index) return;
      that.timer.emit(value);

      // if (that.subtitleopened) {
      //   that.setsubtitle(index, value);
      // }
    };
    player.onSubtitleEnableChanged = (index: number, enabled: boolean) => {
      if (that.index != index) return;
      that.onSubtitleEnableChanged.emit({ index: index, value: enabled });
      that.subtitleopened = enabled;
      if (that.subtitleopened) {
        that.opensound();
      }
      // if (that.localsubtitle) {
      //   if (enabled && that.model) {
      //     that.business.subtitle.load(index, that.model);
      //   } else {
      //     that.business.subtitle.close(index);
      //   }
      // }
    };
    player.onButtonClicked = (index: number = 0, btn: string) => {
      if (that.index != index) return;
      that.onButtonClicked.emit(btn as ButtonName);

      new Promise((x) => {
        let url = new URL(that.webUrl);
        if (location.hostname !== url.hostname && location.port != url.port) {
          switch (btn) {
            case ButtonName.fullscreen:
              if (that.iframe) {
                (that.iframe.nativeElement as HTMLIFrameElement).requestFullscreen();
              }
              break;
            default:
              break;
          }
        }
      });
    };

    player.onViewerClicked = (index: number = 0) => {
      if (that.index != index) return;
      that.onViewerClicked.emit(index);
    };
    player.onViewerDoubleClicked = (index: number = 0) => {
      if (that.index != index) return;
      that.onViewerDoubleClicked.emit(index);
      new Promise((x) => {
        let url = new URL(that.webUrl);
        if (location.hostname !== url.hostname && location.port != url.port) {
          if (that.iframe) {
            (that.iframe.nativeElement as HTMLIFrameElement).requestFullscreen();
          }
        }
      });
    };
    player.onStatusChanged = (index: number = 0, state: PlayerState) => {
      if (that.index != index) return;
      player.status = state;
      console.log('onStatusChanged', PlayerState[state]);
      switch (state) {
        case PlayerState.playing:
          this.business.keep.clear({ tryplay: true });

          if (that.subtitle) {
            that.subtitleenable(that.subtitle);
          }
          that.onPlaying.emit(that.index);
          break;
        case PlayerState.closed:
          this.business.keep.clear({ keep: true });
          break;

        default:
          break;
      }
    };
    player.onOsdTime = (index: number = 0, value: number) => {
      if (that.index != index) return;
      that._onOSDTime(value);
    };
  }
  onplay(model: VideoModel) {
    this.model = model;
    // this.model.stream = this.stream;
    this.isloaded = false;
    this.load();
  }

  async onstop() {
    try {
      new Promise(() => {
        this.player.then((x) => {
          x.stop();
        });
      });
    } catch (error) {}
    if (!HtmlTool.iframe.crossorigin(this.iframe.nativeElement.src)) {
      this.iframe.nativeElement.contentWindow?.document.clear();
    }

    this.src = undefined;

    return;
  }

  ondownload(filename: string, type: string) {
    this.player.then((x) => {
      x.download(filename, type);
    });
  }
  onresize(width: number, height: number) {
    this.player.then((x) => {
      x.resize(width, height);
    });
  }
  onfullScreen() {
    this.player.then((x) => {
      x.fullScreen();
    });
  }
  onframe() {
    this.player.then((x) => {
      x.frame();
    });
  }
  onresume() {
    this.player.then((x) => {
      x.resume();
    });
  }
  onspeedResume() {
    this.player.then((x) => {
      x.speedResume();
    });
  }
  onpause() {
    return this.player.then((x) => {
      return x.pause();
    });
  }
  oncapturePicture() {
    this.player.then((x) => {
      x.capturePicture();
    });
  }
  onslow() {
    this.player.then((x) => {
      x.slow();
    });
  }
  onfast() {
    this.player.then((x) => {
      x.fast();
    });
  }
  onseek(value: number) {
    this.player.then((x) => {
      this.onpause().then(() => {
        x.seek(value);
      });
    });
  }
  subtitleenable(enabled: boolean) {
    this.player.then((x) => {
      x.subtitleEnabled(enabled);
    });
  }

  opensound() {
    this.player.then((x) => {
      x.openSound();
    });
  }

  setsubtitle(index: number, value: TimeArgs) {
    // let date = {
    //   min: formatDate(new Date(value.min), 'HH:mm:ss', 'en'),
    //   max: formatDate(new Date(value.max), 'HH:mm:ss', 'en'),
    //   current: formatDate(new Date(value.current), 'HH:mm:ss', 'en'),
    // };
    // console.log('timer', date);
    // this.player.then((x) => {
    //   if (x) {
    //     let item = this.business.subtitle.get(index, value.current - value.min);
    //     x.setSubtitle(item ? (item.text ?? '') : '');
    //   }
    // });
  }

  _getOSDTime() {
    this.player.then((x) => {
      x.getOSDTime();
    });
  }

  _onOSDTime(value: number) {
    this.onOSDTime.emit(value);
  }

  // handle: { keep?: NodeJS.Timeout; tryplay?: NodeJS.Timeout } = {};

  // keep() {
  //   this.player.then((player) => {
  //     if (this.handle.keep) {
  //       clearTimeout(this.handle.keep);
  //       this.handle.keep = undefined;
  //     }

  //     if (player.status === PlayerState.playing) {
  //       this.handle.keep = setTimeout(() => {
  //         this.trystop(player);
  //         console.log('keep to stop');
  //         this.tryplay(player);
  //       }, 15 * 1000);
  //     }
  //   });
  // }

  // trystop(player: WSPlayerProxy) {
  //   return new Promise<void>((resolve) => {
  //     player.stop();
  //     let handle: NodeJS.Timeout | undefined = undefined;
  //     wait(
  //       () => {
  //         return player.status !== PlayerState.playing;
  //       },
  //       () => {
  //         if (handle) {
  //           clearTimeout(handle);
  //         }
  //         resolve();
  //       }
  //     );

  //     handle = setTimeout(() => {
  //       if (player.status === PlayerState.playing) {
  //         this.trystop(player).then(() => {
  //           resolve();
  //         });
  //       }
  //     }, 5 * 1000);
  //   });
  // }

  // tryplay(player: WSPlayerProxy) {
  //   wait(
  //     () => {
  //       return player.status !== PlayerState.playing;
  //     },
  //     () => {
  //       this.isloaded = false;
  //       this.load();
  //       console.log('keep to load');
  //       this.handle.tryplay = setTimeout(() => {
  //         if (player.status !== PlayerState.playing) {
  //           this.tryplay(player);
  //         }
  //       }, 15 * 1000);
  //     }
  //   );
  // }
}
