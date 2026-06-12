import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-bottom-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bottom-bar">
      <span>{{ (state.statusMessage$ | async) || '就绪' }}</span>
      <span style="margin-left:auto">
        模型: {{ (state.loadedModelList$ | async)?.length ?? 0 }}
      </span>
    </div>
  `,
  styles: [`
    .bottom-bar {
      display: flex; align-items: center;
      padding: 2px 12px; background: #0a1a1d; color: #888;
      border-top: 1px solid #173438; height: 24px; box-sizing: border-box;
      font-size: 11px;
    }
  `],
})
export class BottomBarComponent {
  state = inject(StateService);
}
