import { Injectable } from '@angular/core';
import { VideoPlayerKeepBusiness } from './video-player-keep.business';
import { VideoPlayerSubtitleBusiness } from './video-player-subtitle.business';

@Injectable()
export class VideoPlayerBusiness {
  constructor(
    public subtitle: VideoPlayerSubtitleBusiness,
    public keep: VideoPlayerKeepBusiness,
  ) {}
}
