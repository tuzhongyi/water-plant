import { EventEmitter } from '@angular/core';
import { VideoModel } from '../../../common/components/video-player/video-player.model';
import {
  PlaybackArgs,
  PreviewArgs,
  VideoPlayerArgs,
} from '../video-player-content/video-player-content.model';

export enum ScreenMode {
  one = 1,
  four = 4,
  nine = 9,
}

export interface IndexArgs<T> {
  index: number;
  data: T;
}
export class VideoPlayerListEvent {
  seeks: EventEmitter<number>[] = [];
  plays: EventEmitter<VideoModel>[] = [];
}

export class VideoPlayerListItem {
  constructor(index: number) {
    this.index = index;
  }
  index: number;
  seek = new EventEmitter<number>();
  selected = false;
  event = {
    preview: new EventEmitter<PreviewArgs>(),
    playback: new EventEmitter<PlaybackArgs>(),
    stop: new EventEmitter(),
  };

  playing = false;

  private args?: VideoPlayerArgs;

  resume() {
    if (this.args) {
      if (this.args instanceof PreviewArgs) {
        this.preview(this.args);
      } else if (this.args instanceof PlaybackArgs) {
        this.playback(this.args);
      } else {
      }
    }
  }

  preview(args: PreviewArgs) {
    this.event.preview.emit(args);
    this.playing = true;
  }
  playback(args: PlaybackArgs) {
    this.event.playback.emit(args);
    this.playing = true;
  }

  stop() {
    this.event.stop.emit();
    this.playing = false;
  }
}
