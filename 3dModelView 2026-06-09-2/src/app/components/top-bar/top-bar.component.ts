import { Component, inject, NgZone, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';
import { ViewService } from '../../services/view.service';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="top-bar">
      <span class="title">3D Model Viewer</span>
      <span class="fps">{{ fps() }} FPS</span>
      <div class="view-btns">
        <button [class.active]="(state.viewPreset$ | async) === 'small'"
                (click)="viewService.setViewPreset('small')">小视图</button>
        <button [class.active]="(state.viewPreset$ | async) === 'medium'"
                (click)="viewService.setViewPreset('medium')">中视图</button>
        <button [class.active]="(state.viewPreset$ | async) === 'large'"
                (click)="viewService.setViewPreset('large')">大视图</button>
      </div>
      <div class="action-btns">
        <button (click)="save()" title="保存配置">保存</button>
        <button (click)="configService.exportConfig()" title="导出配置">导出</button>
        <button (click)="fileInput.click()" title="导入配置">导入</button>
        <input #fileInput type="file" accept=".json" hidden
               (change)="onImport($event)" />
      </div>
    </div>
  `,
  styles: [`
    .top-bar {
      display: flex; align-items: center; gap: 12px;
      padding: 6px 12px; background: #0a1a1d; color: #eee;
      border-bottom: 1px solid #173438; height: 40px; box-sizing: border-box;
      flex-shrink: 0; z-index: 20;
    }
    .title { font-weight: bold; font-size: 14px; margin-right: auto; }
    .fps {
      font-size: 12px; color: #888; font-variant-numeric: tabular-nums;
      min-width: 55px; text-align: right;
    }
    .view-btns { display: flex; gap: 4px; }
    .view-btns button {
      background: #0f2529; color: #aaa; border: 1px solid #1b3f46;
      padding: 2px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;
    }
    .view-btns button:hover { background: #14353f; color: #ddd; }
    .view-btns button.active {
      background: #07a990; color: #fff; border-color: #07a990;
    }
    .action-btns button {
      background: #0f2529; color: #aaa; border: 1px solid #1b3f46;
      padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;
    }
    .action-btns button:hover { background: #14353f; color: #ddd; }
  `],
})
export class TopBarComponent implements OnInit, OnDestroy {
  state = inject(StateService);
  viewService = inject(ViewService);
  configService = inject(ConfigService);
  private zone = inject(NgZone);

  fps = signal(0);

  private rafId = 0;
  private lastTime = 0;
  private frameCount = 0;
  private fpsAccum = 0;

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => this.countFps());
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  private countFps(): void {
    this.rafId = requestAnimationFrame((now: number) => {
      if (this.lastTime > 0) {
        const delta = now - this.lastTime;
        this.frameCount++;
        this.fpsAccum += delta;

        if (this.fpsAccum >= 1000) {
          const fps = Math.round(this.frameCount / (this.fpsAccum / 1000));
          this.fps.set(fps);
          this.frameCount = 0;
          this.fpsAccum = 0;
        }
      }
      this.lastTime = now;
      this.countFps();
    });
  }

  async save(): Promise<void> {
    const ok = await this.configService.saveConfig();
    this.state.statusMessage$.next(ok ? '配置已保存' : '保存失败');
  }

  async onImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const ok = await this.configService.importConfig(file);
    this.state.statusMessage$.next(ok ? '配置已导入' : '导入失败');
    input.value = '';
  }
}
