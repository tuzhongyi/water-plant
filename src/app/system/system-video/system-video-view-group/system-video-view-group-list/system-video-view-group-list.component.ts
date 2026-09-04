import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { InputIconComponent } from '../../../../common/components/input-icon/input-icon.component';
import { VideoChannelViewGroup } from '../../../../common/data-core/models/devices/video-channel-view-group.model';
import { SystemVideoViewGroupBusiness } from '../business/system-video-view-group.business';
import { SystemVideoViewGroupArgs } from '../business/system-video-view-group.model';

@Component({
  selector: 'hw-system-video-view-group-list',
  imports: [CommonModule, InputIconComponent],
  templateUrl: './system-video-view-group-list.component.html',
  styleUrl: './system-video-view-group-list.component.less',
  providers: [SystemVideoViewGroupBusiness],
})
export class SystemVideoViewGroupListComponent implements OnInit, OnDestroy {
  @Input('load') _load?: EventEmitter<SystemVideoViewGroupArgs>;

  @Input() selected?: VideoChannelViewGroup;

  @Output() selectedChange = new EventEmitter<VideoChannelViewGroup>();
  @Output() play = new EventEmitter<VideoChannelViewGroup>();
  @Output() delete = new EventEmitter<VideoChannelViewGroup>();
  @Output() loaded = new EventEmitter<VideoChannelViewGroup[]>();

  constructor(private business: SystemVideoViewGroupBusiness) {}

  private args: SystemVideoViewGroupArgs = {};
  private subs = new Subscription();
  datas = signal<VideoChannelViewGroup[]>([]);

  ngOnInit(): void {
    this.regist();
    this.load(this.args);
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private regist() {
    if (this._load) {
      this.subs.add(
        this._load.subscribe((x) => {
          this.args = x;
          this.load(this.args);
        }),
      );
    }
  }

  private load(args: SystemVideoViewGroupArgs) {
    return this.business.load(args).then((x) => {
      let datas = x.sort((a, b) => {
        return a.Sort - b.Sort;
      });
      this.datas.set(datas);
      this.loaded.emit(datas);
      return;
    });
  }

  on = {
    select: (e: Event, item: VideoChannelViewGroup) => {
      if (this.selected == item) {
        e.stopPropagation();
        return;
      }
      this.selected = item;
      this.selectedChange.emit(this.selected);
      if (this.update.ing) {
        this.update.ing = false;
      }
    },
    play: (e: Event, item: VideoChannelViewGroup) => {
      this.play.emit(item);
      if (this.selected == item) {
        e.stopPropagation();
      }
    },
    update: (e: Event, item: VideoChannelViewGroup) => {
      this.update.ing = true;
      if (this.selected) {
        this.update.value = this.selected?.Name;
      }

      if (this.selected == item) {
        e.stopPropagation();
      }
    },
    delete: (e: Event, item: VideoChannelViewGroup) => {
      this.delete.emit(item);
      if (this.selected == item) {
        e.stopPropagation();
      }
    },
  };

  update = {
    ing: false,
    value: '',
    on: {
      save: () => {
        if (this.selected) {
          this.selected.Name = this.update.value;
          this.business.update(this.selected).then((x) => {
            this.load(this.args);
          });
          this.update.ing = false;
        }
      },
      cancel: () => {
        this.update.value = '';
        this.update.ing = false;
      },
    },
  };
}
