import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as THREE from 'three';
import { StateService } from '../../services/state.service';
import { ColorsService, ColorState } from '../../services/colors.service';
import { ModelService } from '../../services/model.service';
import { EdgesService } from '../../services/edges.service';
import { ModelEntry, EditInputs } from '../../models/types';

@Component({
  selector: 'app-info-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (selectedEntry) {
      <div class="info-card">
        <div class="card-header">
          <span>{{ selectedEntry.fileName }}</span>
          <div class="header-actions">
            <button class="lock-btn" [class.locked]="selectedEntry.locked"
                    (click)="toggleLock()" title="锁定后只能从列表中选中模型">
              {{ selectedEntry.locked ? '🔒' : '🔓' }}
            </button>
            <button class="close-btn" (click)="deselect()">×</button>
          </div>
        </div>

        <div class="card-body">
          <!-- 颜色状态控件组 -->
          <div class="state-group">
            <div class="tab-bar">
              @for (st of colorStates; track st) {
                <button [class.active]="activeColorState === st"
                        (click)="setColorState(st)">{{ stateLabel(st) }}</button>
              }
            </div>

            <div class="state-body">
              <div class="color-group">
                <label>边缘颜色</label>
                <div class="color-row">
                  <input type="color"
                         [ngModel]="selectedEntry.colors[activeColorState].edge"
                         (ngModelChange)="setEdgeColor(activeColorState, $event)" />
                  <span class="hex-label">{{ selectedEntry.colors[activeColorState].edge }}</span>
                </div>
              </div>

              <div class="color-group">
                <label>Emissive（自发光）</label>
                <div class="color-row">
                  <input type="color"
                         [ngModel]="selectedEntry.colors[activeColorState].background"
                         (ngModelChange)="setBackgroundColor(activeColorState, $event)" />
                  <span class="hex-label">{{ selectedEntry.colors[activeColorState].background }}</span>
                </div>
              </div>

              @if (materialNames.length > 0) {
                <div class="color-group">
                  <label>材质颜色</label>
                  @for (name of materialNames; track name) {
                    <div class="color-row">
                      <span class="clr-label">{{ name }}</span>
                      <input type="color"
                             [ngModel]="colorsService.getMaterialColor(selectedEntry, name, activeColorState)"
                             (ngModelChange)="onMaterialColorChange(name, $event)" />
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          @if (meshNames.length > 0) {
            <div class="color-group">
              <label>Mesh 可见性</label>
              @for (name of meshNames; track name) {
                <div class="mesh-row">
                  <span class="clr-label">{{ name }}</span>
                  <input type="checkbox"
                         [checked]="getMeshVisible(name)"
                         (change)="toggleMeshVisible(name)" />
                </div>
              }
            </div>
          }

          <div class="info-group">
            <label>Label 文本</label>
            <input type="text" [ngModel]="selectedEntry.label"
                   (ngModelChange)="setLabel($event)" />
          </div>

          <div class="info-group">
            <div class="checkbox-row">
              <label><input type="checkbox"
                     [ngModel]="selectedEntry.labelVisible"
                     (ngModelChange)="setLabelVisible($event)" /> 显示 Label</label>
            </div>
          </div>

          @if (selectedEntry.labelVisible) {
            <div class="info-group">
              <label>Label 高度: {{ labelHeight.toFixed(1) }}</label>
              <div class="slider-row">
                <input type="range" min="0.1" max="10" step="0.1"
                       [ngModel]="labelHeight"
                       (ngModelChange)="setLabelHeight($event)" />
                <input type="number" min="0.1" max="10" step="0.1"
                       [ngModel]="labelHeight"
                       (ngModelChange)="setLabelHeight($event)" />
              </div>
            </div>

            <div class="info-group">
              <label>Label 文字大小: {{ labelFontSize }}</label>
              <div class="slider-row">
                <input type="range" min="5" max="80" step="1"
                       [ngModel]="labelFontSize"
                       (ngModelChange)="setLabelFontSize($event)" />
                <input type="number" min="5" max="80" step="1"
                       [ngModel]="labelFontSize"
                       (ngModelChange)="setLabelFontSize($event)" />
              </div>
            </div>
          }

          <div class="info-group">
            <label>位置</label>
            <div class="input-row">
              <span>X</span>
              <input type="number" step="0.01" [ngModel]="editInputs.posX"
                     (ngModelChange)="setEditValue('posX', $event)" />
              <span>Y</span>
              <input type="number" step="0.01" [ngModel]="editInputs.posY"
                     (ngModelChange)="setEditValue('posY', $event)" />
              <span>Z</span>
              <input type="number" step="0.01" [ngModel]="editInputs.posZ"
                     (ngModelChange)="setEditValue('posZ', $event)" />
            </div>
          </div>
          <div class="info-group">
            <label>旋转 (H/P/B)</label>
            <div class="input-row">
              <span>H</span>
              <input type="number" step="0.5" [ngModel]="editInputs.rotH"
                     (ngModelChange)="setEditValue('rotH', $event)" />
              <span>P</span>
              <input type="number" step="0.5" [ngModel]="editInputs.rotP"
                     (ngModelChange)="setEditValue('rotP', $event)" />
              <span>B</span>
              <input type="number" step="0.5" [ngModel]="editInputs.rotB"
                     (ngModelChange)="setEditValue('rotB', $event)" />
            </div>
          </div>
          <div class="info-group">
            <label>缩放</label>
            <div class="input-row">
              <span>X</span>
              <input type="number" step="0.01" min="0.01" [ngModel]="editInputs.scaleX"
                     (ngModelChange)="setEditValue('scaleX', $event)" />
              <span>Y</span>
              <input type="number" step="0.01" min="0.01" [ngModel]="editInputs.scaleY"
                     (ngModelChange)="setEditValue('scaleY', $event)" />
              <span>Z</span>
              <input type="number" step="0.01" min="0.01" [ngModel]="editInputs.scaleZ"
                     (ngModelChange)="setEditValue('scaleZ', $event)" />
            </div>
          </div>
          <div class="info-group">
            <label>尺寸 (W/H/D)</label>
            <span class="info-val">
              W: {{ modelSize.x.toFixed(2) }}
              H: {{ modelSize.y.toFixed(2) }}
              D: {{ modelSize.z.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .info-card {
      position: absolute; top: 4px; right: 4px;
      width: 280px; max-height: calc(100% - 8px); overflow-y: auto;
      background: #0a1a1d; border: 1px solid #173438; border-radius: 6px;
      color: #ccc; font-size: 12px; z-index: 10;
    }
    .card-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 10px; background: #0c1e23; border-radius: 6px 6px 0 0;
      font-weight: bold; position: sticky; top: 0; z-index: 1;
    }
    .header-actions { display: flex; align-items: center; gap: 4px; }
    .lock-btn {
      background: none; border: none; cursor: pointer;
      font-size: 14px; line-height: 1; padding: 0 2px; opacity: 0.6;
    }
    .lock-btn:hover { opacity: 1; }
    .lock-btn.locked { opacity: 1; }
    .close-btn {
      background: none; border: none; color: #ef6f59; cursor: pointer;
      font-size: 18px; line-height: 1; padding: 0 2px;
    }
    .close-btn:hover { color: #f59484; }
    .card-body { padding: 8px 10px; }

    /* 颜色状态控件组：将 tab 和受控项包裹在一起 */
    .state-group {
      border: 1px solid #0f2529; border-radius: 4px;
      background: #091618; margin-bottom: 10px; overflow: hidden;
    }
    .tab-bar {
      display: flex; border-bottom: 1px solid #0f2529;
      background: #0a1a21;
    }
    .tab-bar button {
      flex: 1; background: none; border: none; color: #888;
      padding: 5px 2px; cursor: pointer; font-size: 11px;
      border-bottom: 2px solid transparent;
    }
    .tab-bar button:hover { color: #ccc; }
    .tab-bar button.active { color: #17f1c6; border-bottom-color: #17f1c6; }
    .state-body { padding: 6px 8px; }
    .color-group { margin-bottom: 6px; }
    .color-group:last-child { margin-bottom: 0; }
    .info-group { margin-bottom: 4px; }
    label { display: block; font-size: 11px; color: #888; margin-bottom: 2px; }
    .color-row { display: flex; align-items: center; gap: 6px; margin: 2px 0; }
    .mesh-row { display: flex; align-items: center; gap: 6px; margin: 2px 0; }
    .mesh-row .clr-label { flex: 1; }
    .clr-label {
      width: 90px; font-size: 11px; cursor: pointer;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .clr-label.isolated { color: #ef6f59; font-weight: bold; }
    .hex-label { font-size: 10px; color: #666; font-family: monospace; }
    input[type="color"] { width: 28px; height: 22px; padding: 0; border: none; cursor: pointer; background: transparent; }
    .info-val { color: #aaa; font-size: 11px; }
    .input-row {
      display: flex; align-items: center; gap: 4px;
    }
    .input-row span {
      font-size: 10px; color: #888; width: 12px; text-align: right; flex-shrink: 0;
    }
    .input-row input[type="number"] {
      width: 0; flex: 1; background: #040a0b; color: #ccc;
      border: 1px solid #1b3f46; border-radius: 2px; padding: 2px 4px;
      font-size: 11px; font-family: inherit;
    }
    .input-row input[type="number"]:focus {
      border-color: #17f1c6; outline: none;
    }
    .slider-row {
      display: flex; align-items: center; gap: 6px;
    }
    .slider-row input[type="range"] {
      flex: 1; height: 14px; min-width: 0;
    }
    .slider-row input[type="number"] {
      width: 56px; flex-shrink: 0;
      background: #040a0b; color: #ccc;
      border: 1px solid #1b3f46; border-radius: 2px;
      padding: 2px 4px; font-size: 11px; font-family: inherit;
    }
    .slider-row input[type="number"]:focus { border-color: #17f1c6; outline: none; }
    .checkbox-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .checkbox-row label { display: flex; align-items: center; gap: 4px; color: #aaa; }
    input[type="checkbox"] { margin: 0; cursor: pointer; }
    input[type="text"] {
      width: 100%; box-sizing: border-box; background: #040a0b; color: #ccc;
      border: 1px solid #1b3f46; border-radius: 2px; padding: 2px 4px;
      font-size: 11px; font-family: inherit;
    }
    input[type="text"]:focus { border-color: #17f1c6; outline: none; }
  `],
})
export class InfoCardComponent implements OnInit, OnDestroy {
  state = inject(StateService);
  colorsService = inject(ColorsService);
  private modelService = inject(ModelService);
  private edgesService = inject(EdgesService);

  selectedEntry: ModelEntry | null = null;
  editInputs: EditInputs = { posX: 0, posY: 0, posZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1, rotH: 0, rotP: 0, rotB: 0 };
  activeColorState: ColorState = 'normal';
  currentModelState: ColorState = 'normal';
  readonly colorStates: ColorState[] = ['normal', 'hover', 'selected'];

  private subs = new Subscription();

  ngOnInit(): void {
    /* 选中模型变化 */
    this.subs.add(this.state.selectedModelId$.subscribe(id => {
      this.selectedEntry = id ? this.state.loadedModels.get(id) ?? null : null;
      if (this.selectedEntry) {
        this.syncFromWrapper();
        this.currentModelState = 'selected';
      }
    }));

    /* 鼠标悬停变化：更新当前模型状态 */
    this.subs.add(this.state.hoveredModelId$.subscribe(hoveredId => {
      if (!this.selectedEntry) return;
      if (hoveredId === this.selectedEntry.id) {
        this.currentModelState = 'hover';
      } else {
        this.currentModelState = 'selected';
      }
    }));

    this.subs.add(this.state.editInputs$.subscribe(inputs => {
      this.editInputs = { ...inputs };
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  stateLabel(st: ColorState): string {
    switch (st) {
      case 'normal': return 'Normal';
      case 'hover': return 'Hover';
      case 'selected': return 'Selected';
    }
  }

  setColorState(st: ColorState): void {
    this.activeColorState = st;
  }

  onMaterialColorChange(materialName: string, hex: string): void {
    if (!this.selectedEntry) return;
    this.colorsService.setMaterialColor(this.selectedEntry, materialName, this.activeColorState, hex);
    /* 若编辑的是当前模型的状态，立即应用变更 */
    if (this.activeColorState === this.currentModelState) {
      this.colorsService.applyMaterialState(this.selectedEntry, this.activeColorState);
    }
  }

  getMeshVisible(meshName: string): boolean {
    return this.selectedEntry ? this.colorsService.getMeshVisible(this.selectedEntry, meshName) : true;
  }

  setLabel(value: string): void {
    if (!this.selectedEntry) return;
    this.selectedEntry.label = value;
    this.modelService.updateLabel(this.selectedEntry);
  }

  /* Label 高度：优先用 per-model 值，否则用全局设置 */
  get labelHeight(): number {
    return this.selectedEntry?.labelPerHeight ?? this.state.settings.labelHeight ?? 0.6;
  }

  /* Label 文字大小：优先用 per-model 值，否则用全局设置 */
  get labelFontSize(): number {
    return this.selectedEntry?.labelFontSize ?? this.state.settings.labelFontSize ?? 25;
  }

  setLabelVisible(v: boolean): void {
    if (!this.selectedEntry) return;
    this.selectedEntry.labelVisible = v;
    if (this.selectedEntry.labelObject) {
      this.selectedEntry.labelObject.visible = v && this.state.settings.showLabels;
    } else if (v) {
      this.modelService.updateLabel(this.selectedEntry);
    }
  }

  setLabelHeight(v: number): void {
    if (!this.selectedEntry) return;
    this.selectedEntry.labelPerHeight = v;
    this.modelService.updateLabel(this.selectedEntry);
  }

  setLabelFontSize(v: number): void {
    if (!this.selectedEntry) return;
    this.selectedEntry.labelFontSize = v;
    this.modelService.updateLabel(this.selectedEntry);
  }

  toggleMeshVisible(meshName: string): void {
    if (!this.selectedEntry) return;
    this.colorsService.toggleMeshVisible(this.selectedEntry, meshName);
    this.edgesService.createHardEdgesForEntry(this.selectedEntry);
    this.edgesService.createDepthPrePass(this.selectedEntry);
    this.edgesService.applyRenderMode(this.selectedEntry, this.state.renderMode);
    /* 重建边缘后重新应用当前状态颜色 */
    this.colorsService.reapplyCurrentState(this.selectedEntry);
  }

  private syncFromWrapper(): void {
    const e = this.selectedEntry;
    if (!e) return;
    const p = e.wrapper.position;
    const s = e.wrapper.scale;
    const r = e.wrapper.rotation;
    this.editInputs = {
      posX: p.x, posY: p.y, posZ: p.z,
      scaleX: s.x, scaleY: s.y, scaleZ: s.z,
      rotH: THREE.MathUtils.radToDeg(r.x),
      rotP: THREE.MathUtils.radToDeg(r.y),
      rotB: THREE.MathUtils.radToDeg(r.z),
    };
  }

  setEditValue(field: string, value: number): void {
    const e = this.selectedEntry;
    if (!e) return;

    const map: Record<string, [string, number]> = {
      posX: ['position', 0], posY: ['position', 1], posZ: ['position', 2],
      scaleX: ['scale', 0], scaleY: ['scale', 1], scaleZ: ['scale', 2],
      rotH: ['rotation', 0], rotP: ['rotation', 1], rotB: ['rotation', 2],
    };

    const [vec, idx] = map[field] ?? [];
    if (!vec) return;

    if (vec === 'position') {
      const arr = [e.editPosition.x, e.editPosition.y, e.editPosition.z];
      arr[idx] = value;
      e.editPosition.set(arr[0], arr[1], arr[2]);
    } else if (vec === 'scale') {
      const arr = [e.editScale.x, e.editScale.y, e.editScale.z];
      arr[idx] = value;
      e.editScale.set(arr[0], arr[1], arr[2]);
    } else {
      const arr = [e.editRotation.x, e.editRotation.y, e.editRotation.z];
      arr[idx] = THREE.MathUtils.degToRad(value);
      e.editRotation.set(arr[0], arr[1], arr[2]);
    }

    this.modelService.applyTransform(e);
    this.modelService.updateBBox(e);

    this.state.updateEditInputs({ ...this.editInputs, [field]: value });
  }

  get modelSize(): { x: number; y: number; z: number } {
    if (!this.selectedEntry) return { x: 0, y: 0, z: 0 };
    const size = new THREE.Vector3();
    this.selectedEntry.bbox.getSize(size);
    const s = this.selectedEntry.wrapper.scale;
    return { x: size.x * Math.abs(s.x), y: size.y * Math.abs(s.y), z: size.z * Math.abs(s.z) };
  }

  get materialNames(): string[] {
    return this.selectedEntry
      ? this.colorsService.getMaterials(this.selectedEntry).map(m => m.name)
      : [];
  }

  get meshNames(): string[] {
    return this.selectedEntry ? this.colorsService.getMeshNames(this.selectedEntry) : [];
  }

  setEdgeColor(state: ColorState, hex: string): void {
    if (this.selectedEntry) {
      this.selectedEntry.colors[state].edge = hex;
      if (state === this.currentModelState) {
        this.colorsService.applyStateColors(this.selectedEntry, state);
      }
    }
  }

  setBackgroundColor(state: ColorState, hex: string): void {
    if (this.selectedEntry) {
      this.selectedEntry.colors[state].background = hex;
      if (state === this.currentModelState) {
        this.colorsService.applyStateColors(this.selectedEntry, state);
      }
    }
  }

  toggleLock(): void {
    if (!this.selectedEntry) return;
    this.selectedEntry.locked = !this.selectedEntry.locked;
    /* 触发 viewerModels 更新以同步到 ModelViewerComponent */
    this.state.loadedModels$.next(new Map(this.state.loadedModels));
  }

  deselect(): void {
    this.state.selectedModelId$.next(null);
  }
}
