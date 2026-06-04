import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChild,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { EnumNameValue } from '../../data-core/models/capabilities/enum-name-value.model';
import { ISelection } from './common-label-select.model';

/**
 *  显示树的选中节点信息
 */
@Component({
  selector: 'common-label-select',
  templateUrl: './common-label-select.component.html',
  styleUrls: ['./common-label-select.component.less'],
  imports: [CommonModule],
})
export class CommonLabelSelecComponent
  implements OnInit, AfterViewInit, AfterContentInit, OnDestroy
{
  @Input() show = false;
  @Output() showChange: EventEmitter<boolean> = new EventEmitter();

  @Input() selected: EnumNameValue<any>[] = [];

  @Input() autoclose = false;

  @Input() single = false;

  @Input() canremove = true;
  @Input() candrop = true;
  @Input() height = 'auto';

  @Output() toggleDropDown = new EventEmitter<boolean>();
  @Output() remove = new EventEmitter<EnumNameValue<any>[]>();

  constructor(@Inject(DOCUMENT) private document: Document) {}

  @ContentChild('select') selection?: ISelection;
  handle: any;

  subscription!: Subscription;

  ngOnInit(): void {}
  ngAfterViewInit(): void {
    this.subscription = fromEvent(this.document.body, 'click').subscribe(() => {
      if (this.autoclose) {
        this.show = false;
        this.showChange.emit(this.show);
      }
    });
  }
  ngAfterContentInit(): void {}
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleHandler(e: Event) {
    if (!this.candrop) {
      return;
    }
    e.stopPropagation();
    this.show = !this.show;
    this.showChange.emit(this.show);
    this.toggleDropDown.emit(this.show);
  }
  onremove(e: Event, item: EnumNameValue<any>) {
    e.stopPropagation();

    this.selection?.toggleNodes(item);
    this.remove.emit([item]);
  }
  closeDropDown() {
    this.show = false;
    this.showChange.emit(this.show);
  }
}
