import { formatDate } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { interval } from 'rxjs';
import { Language } from '../../../common/tools/language-tool/language';
import { HeaderInformationModel } from './header-information.model';

@Component({
  selector: 'howell-header-information',
  templateUrl: './header-information.component.html',
  styleUrls: ['./header-information.component.less'],
})
export class HeaderInformationComponent implements OnInit, OnChanges {
  @Input('date')
  input_date: Date = new Date();
  constructor() {}
  date: Date = new Date();

  model: HeaderInformationModel = new HeaderInformationModel();

  Language = Language;

  intervalHandle?: NodeJS.Timeout;
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['input_date']) {
      this.date = new Date();
    }
  }
  ngOnInit(): void {
    interval(1000).subscribe((x) => {
      this.refresh();
    });
    this.refresh();
  }

  refresh() {
    let now = new Date();
    let interval = now.getTime() - this.date.getTime();

    let date = new Date(this.input_date.getTime() + interval);

    this.model.time = formatDate(date, Language.HHmmss, 'en');
    this.model.date = formatDate(date, Language.YearMonthDay, 'en');
    this.model.week = Language.Week(date.getDay(), '星期');
  }
}
