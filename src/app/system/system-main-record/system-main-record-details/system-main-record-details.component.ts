import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';

@Component({
  selector: 'hw-system-main-record-details',
  imports: [CommonModule, FormsModule],
  templateUrl: './system-main-record-details.component.html',
  styleUrl: './system-main-record-details.component.less',
})
export class SystemMainRecordDetailsComponent implements OnInit {
  @Input() data?: DeviceEventRecord;

  constructor(private language: LanguageTool) {}
  ngOnInit(): void {
    if (this.data) {
      this.load(this.data);
    }
  }

  name = {
    eventtype: '',
  };

  async load(data: DeviceEventRecord) {
    this.language.event.EventTypes(data.EventType).then((x) => {
      this.name.eventtype;
    });
  }
}
