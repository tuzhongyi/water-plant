import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VideoPlayerComponent } from '../../../common/components/video-player/video-player.component';
import { VideoModel } from '../../../common/components/video-player/video-player.model';
import { VideoPlayerContentBusiness } from './business/video-player-content.business';
import { PlaybackArgs, PreviewArgs } from './video-player-content.model';

@Component({
  selector: 'video-player-content',
  imports: [VideoPlayerComponent],
  templateUrl: './video-player-content.component.html',
  styleUrls: ['./video-player-content.component.less'],
  providers: [VideoPlayerContentBusiness],
})
export class VideoPlayerContentComponent implements OnInit {
  @Input('preview') input_preview?: EventEmitter<PreviewArgs>;
  @Input('playback') input_playback?: EventEmitter<PlaybackArgs>;
  @Input() name: string = '';
  @Input() stop = new EventEmitter<void>();
  @Input() seek: EventEmitter<number> = new EventEmitter();
  @Input('reserve')
  public set input_reserve(v: number | undefined) {
    if (v === undefined) return;
    this.reserve = v;
  }

  @Input() index: number = 0;

  @Output() destroy: EventEmitter<VideoModel> = new EventEmitter();
  @Output() onStoping: EventEmitter<number> = new EventEmitter();
  @Output() onViewerClicked: EventEmitter<number> = new EventEmitter();
  @Output() onPlaying: EventEmitter<number> = new EventEmitter();
  @Output() viewed: EventEmitter<void> = new EventEmitter();
  @Input() pause = new EventEmitter<void>();

  constructor(private business: VideoPlayerContentBusiness) {}

  play = new EventEmitter<VideoModel>();

  private _playing: boolean = false;
  public get playing(): boolean {
    return this._playing;
  }
  public set playing(v: boolean) {
    if (this._playing === v) return;
    this._playing = v;
    if (this._playing) {
      this.onbegin();
    }
  }
  private reserve = 0 * 1000;

  ngOnInit(): void {
    if (this.input_preview) {
      this.input_preview.subscribe((args) => {
        this.preview(args);
      });
    }
    if (this.input_playback) {
      this.input_playback.subscribe((args) => {
        this.playback(args);
      });
    }
    Promise.resolve().then(() => {
      this.viewed.emit();
    });
  }

  preview(args: PreviewArgs) {
    this.business.preview(args).then((data) => {
      this.play.emit(data);
    });
  }
  playback(args: PlaybackArgs) {
    if (this.playing) {
      this.playing = false;
    }
    this.business.playback(args, this.reserve).then((data) => {
      this.play.emit(data);
    });
  }

  ondestroy(data: VideoModel) {
    this.destroy.emit(data);
  }
  onstoping(index: number) {
    this.playing = false;
    this.onStoping.emit(index);
  }
  onviewerclicked(index: number) {
    this.onViewerClicked.emit(index);
  }
  onplaying(index: number) {
    this.playing = true;
    this.onPlaying.emit(index);
  }

  onbegin() {
    if (this.reserve) {
      this.pause.emit();
      this.seek.emit(this.reserve - 5 * 1000);
    }
  }
}
