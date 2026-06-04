import { EventEmitter, Injectable } from '@angular/core';

import { ConfigRequestService } from '../../../data-core/request/config/config-request.service';
import { wait } from '../../../tools/wait';
import { PlayerState } from '../video-player.model';

interface VideoPlayerKeepHandle {
  keep?: NodeJS.Timeout;
  tryplay?: NodeJS.Timeout;
  interval?: NodeJS.Timeout;
}
interface VideoPlayerKeepClearArgs {
  keep?: boolean;
  tryplay?: boolean;
  interval?: boolean;
}

@Injectable()
export class VideoPlayerKeepBusiness {
  constructor(private config: ConfigRequestService) {}

  load = new EventEmitter<void>();

  handle: VideoPlayerKeepHandle = {};

  interval(player: WSPlayerProxy) {
    this.config.get().then((x) => {
      this.handle.interval = setTimeout(
        () => {
          this.reload(player);
          this.interval(player);
        },
        x.reload * 1000 * 60,
      );
    });
  }

  keep(player: WSPlayerProxy) {
    if (this.handle.keep) {
      clearTimeout(this.handle.keep);
      this.handle.keep = undefined;
    }

    if (player.status === PlayerState.playing) {
      this.handle.keep = setTimeout(() => {
        this.reload(player);
      }, 15 * 1000);
    }
  }

  clear(
    args: VideoPlayerKeepClearArgs = {
      keep: true,
      tryplay: true,
      interval: true,
    },
  ) {
    if (args.keep && this.handle.keep) {
      clearTimeout(this.handle.keep);
      this.handle.keep = undefined;
    }

    if (args.tryplay && this.handle.tryplay) {
      clearTimeout(this.handle.tryplay);
      this.handle.tryplay = undefined;
    }
    if (args.interval && this.handle.interval) {
      clearTimeout(this.handle.interval);
      this.handle.interval = undefined;
    }
  }

  reload(player: WSPlayerProxy) {
    this.try.stop(player).catch((e) => {
      console.error(e, player);
      player.status = PlayerState.closed;
    });
    console.log('keep to stop');
    this.try.play(player);
  }

  try = {
    stop: (player: WSPlayerProxy) => {
      return new Promise<void>((resolve) => {
        player.stop();
        let handle: NodeJS.Timeout | undefined = undefined;
        wait(() => {
          return player.status !== PlayerState.playing;
        }).then(() => {
          if (handle) {
            clearTimeout(handle);
          }
          resolve();
        });

        handle = setTimeout(() => {
          if (player.status === PlayerState.playing) {
            this.try.stop(player).then(() => {
              resolve();
            });
          }
        }, 5 * 1000);
      });
    },
    play: (player: WSPlayerProxy) => {
      wait(() => {
        return player.status !== PlayerState.playing;
      }).then(() => {
        this.load.emit();
        console.log('keep to load');
        this.handle.tryplay = setTimeout(() => {
          if (player.status !== PlayerState.playing) {
            this.try.play(player);
          }
        }, 15 * 1000);
      });
    },
  };
}
