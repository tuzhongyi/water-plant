import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { SystemRecordContainerComponent } from '../system-record-container/system-record-container.component';
import { SystemRecordEntranceComponent } from '../system-record-entrance/system-record-entrance.component';
import { SystemRecordSource } from '../system-record.source';

@Component({
  selector: 'hw-system-record-manager',
  imports: [CommonModule, SystemRecordContainerComponent, SystemRecordEntranceComponent],
  templateUrl: './system-record-manager.component.html',
  styleUrl: './system-record-manager.component.less',
  providers: [SystemRecordSource],
})
export class SystemRecordManagerComponent {
  @Output() playback = new EventEmitter<DeviceEventRecord>();
  @Output() close = new EventEmitter<void>();

  entrance = false;

  on = {
    index: (value: boolean) => {
      this.entrance = value;
    },
    close: () => {
      this.close.emit();
    },
    playback: (data: DeviceEventRecord) => {
      this.playback.emit(data);
    },
  };
}
