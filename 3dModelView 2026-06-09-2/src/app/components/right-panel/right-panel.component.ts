import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { StateService } from '../../services/state.service';
import { EdgesService } from '../../services/edges.service';
import { ColorsService } from '../../services/colors.service';
import { SceneService } from '../../services/scene.service';
import { ViewService } from '../../services/view.service';
import { RenderMode, RenderSettings } from '../../models/types';

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="right-panel">
      <div class="tab-bar">
        <button [class.active]="activeTab === 'model'"
                (click)="activeTab = 'model'">模型渲染设置</button>
        <button [class.active]="activeTab === 'env'"
                (click)="activeTab = 'env'">环境渲染设置</button>
      </div>

      @if (activeTab === 'model') {
        <div class="section">
          <div class="section-body">
            <label>渲染模式</label>
            <select [ngModel]="state.renderMode" (ngModelChange)="setRenderMode($event)">
              <option value="solid">实体</option>
              <option value="edges">线框</option>
              <option value="overlay">叠加</option>
            </select>

            <label>硬边阈值: {{ state.thresholdAngle }}&deg;</label>
            <input type="range" min="0" max="90" step="1"
                   [ngModel]="state.thresholdAngle"
                   (ngModelChange)="setThresholdAngle($event)" />

            <label>边缘粗细: {{ state.edgeLineWidth }}px</label>
            <input type="range" min="0.5" max="5" step="0.5"
                   [ngModel]="state.edgeLineWidth"
                   (ngModelChange)="setEdgeLineWidth($event)" />

            @if (state.renderMode !== 'edges') {
              <label>实体透明度: {{ state.solidOpacity }}</label>
              <input type="range" min="0" max="1" step="0.01"
                     [ngModel]="state.solidOpacity"
                     (ngModelChange)="setSolidOpacity($event)" />
            }

            @if (state.renderMode !== 'solid') {
              <label>线框透明度: {{ state.wfOpacity }}</label>
              <input type="range" min="0" max="1" step="0.01"
                     [ngModel]="state.wfOpacity"
                     (ngModelChange)="setWfOpacity($event)" />
            }

            @if (state.renderMode === 'overlay') {
              <label>边缘穿透显示</label>
              <input type="checkbox" [ngModel]="state.settings.edgeSeeThrough"
                     (ngModelChange)="setEdgeSeeThrough($event)" />

              <label>实体穿透显示</label>
              <input type="checkbox" [ngModel]="state.settings.solidSeeThrough"
                     (ngModelChange)="setSolidSeeThrough($event)" />
            }

          </div>
        </div>
      }

      @if (activeTab === 'env') {
        <div class="section">
          <div class="section-body">
            <label>背景颜色</label>
            <input type="color" [ngModel]="state.settings.bgColor"
                   (ngModelChange)="updateSetting('bgColor', $event)" />

            <label>环境光: {{ state.settings.ambientIntensity }}</label>
            <input type="range" min="0" max="8" step="0.1"
                   [ngModel]="state.settings.ambientIntensity"
                   (ngModelChange)="updateSetting('ambientIntensity', $event)" />

            <label>主光源: {{ state.settings.keyIntensity }}</label>
            <input type="range" min="0" max="10" step="0.1"
                   [ngModel]="state.settings.keyIntensity"
                   (ngModelChange)="updateSetting('keyIntensity', $event)" />

            <label>补光: {{ state.settings.fillIntensity }}</label>
            <input type="range" min="0" max="8" step="0.1"
                   [ngModel]="state.settings.fillIntensity"
                   (ngModelChange)="updateSetting('fillIntensity', $event)" />

            <label>半球光: {{ state.settings.hemiIntensity }}</label>
            <input type="range" min="0" max="5" step="0.1"
                   [ngModel]="state.settings.hemiIntensity"
                   (ngModelChange)="updateSetting('hemiIntensity', $event)" />


            <label>后处理</label>
            <div class="checkbox-row">
              <label><input type="checkbox" [ngModel]="state.settings.bloom"
                      (ngModelChange)="setBloom($event)" /> Bloom</label>
              <label><input type="checkbox" [ngModel]="state.settings.sobel"
                      (ngModelChange)="updateSetting('sobel', $event)" /> Sobel</label>
              <label><input type="checkbox" [ngModel]="state.settings.fxaa"
                      (ngModelChange)="updateSetting('fxaa', $event)" /> FXAA</label>
            </div>

            @if (state.settings.bloom) {
              <label>泛光阈值: {{ state.settings.bloomThreshold }}</label>
              <input type="range" min="0" max="1" step="0.01"
                     [ngModel]="state.settings.bloomThreshold"
                     (ngModelChange)="updateSetting('bloomThreshold', $event)" />

              <label>泛光强度: {{ state.settings.bloomStrength }}</label>
              <input type="range" min="0" max="5" step="0.1"
                     [ngModel]="state.settings.bloomStrength"
                     (ngModelChange)="updateSetting('bloomStrength', $event)" />

              <label>泛光半径: {{ state.settings.bloomRadius }}</label>
              <input type="range" min="0" max="1" step="0.01"
                     [ngModel]="state.settings.bloomRadius"
                     (ngModelChange)="updateSetting('bloomRadius', $event)" />
            }

            <label>辅助显示</label>
            <div class="checkbox-row">
              <label><input type="checkbox" [ngModel]="state.settings.showGrid"
                      (ngModelChange)="toggleShow('showGrid', $event)" /> 网格</label>
              <label><input type="checkbox" [ngModel]="state.settings.showAxes"
                      (ngModelChange)="toggleShow('showAxes', $event)" /> 坐标轴</label>
            </div>
            <div class="checkbox-row">
              <label><input type="checkbox" [ngModel]="state.settings.showCenterDot"
                      (ngModelChange)="toggleShow('showCenterDot', $event)" /> 中心点</label>
              <label><input type="checkbox" [ngModel]="state.settings.showBBox"
                      (ngModelChange)="setShowBBox($event)" /> 包围盒</label>
            </div>
            <div class="checkbox-row">
              <label><input type="checkbox" [ngModel]="state.settings.autoRotate"
                      (ngModelChange)="updateSetting('autoRotate', $event)" /> 自动旋转</label>
            </div>
            <div class="checkbox-row">
              <label><input type="checkbox" [ngModel]="state.settings.showCameraHelpers"
                      (ngModelChange)="updateSetting('showCameraHelpers', $event)" /> 摄像机辅助线</label>
            </div>

            <label>相机近裁面: {{ state.settings.cameraNear }}</label>
            <input type="range" min="0.01" max="10" step="0.01"
                   [ngModel]="state.settings.cameraNear"
                   (ngModelChange)="updateSetting('cameraNear', $event)" />

            <label>相机远裁面: {{ state.settings.cameraFar }}</label>
            <input type="range" min="100" max="5000" step="100"
                   [ngModel]="state.settings.cameraFar"
                   (ngModelChange)="updateSetting('cameraFar', $event)" />

            <label>相机类型</label>
            <select [ngModel]="state.settings.cameraType"
                    (ngModelChange)="setCameraType($event)">
              <option value="perspective">透视</option>
              <option value="orthographic">正交</option>
            </select>

            <label>标准视图</label>
            <div class="view-grid">
              <button (click)="viewService.setStandardView('top')" title="顶视图">顶</button>
              <button (click)="viewService.setStandardView('front')" title="前视图">前</button>
              <button (click)="viewService.setStandardView('right')" title="右视图">右</button>
              <button (click)="viewService.setStandardView('bottom')" title="底视图">底</button>
              <button (click)="viewService.setStandardView('back')" title="后视图">后</button>
              <button (click)="viewService.setStandardView('left')" title="左视图">左</button>
            </div>

            <label>平面着色</label>
            <input type="checkbox" [ngModel]="state.settings.flatShading"
                   (ngModelChange)="setFlatShading($event)" />
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .right-panel {
      width: 280px; background: #071214; color: #ccc;
      border-left: 1px solid #173438; overflow-y: auto; flex-shrink: 0;
    }
    .tab-bar {
      display: flex; border-bottom: 1px solid #0f2529;
      position: sticky; top: 0; z-index: 1; background: #071214;
    }
    .tab-bar button {
      flex: 1; background: none; border: none; color: #888;
      padding: 8px 4px; cursor: pointer; font-size: 12px;
      border-bottom: 2px solid transparent;
    }
    .tab-bar button:hover { color: #ccc; background: #0a1a1d; }
    .tab-bar button.active { color: #17f1c6; border-bottom-color: #17f1c6; }
    .section { border-bottom: 1px solid #0f2529; }
    .section-header {
      padding: 6px 10px; background: #0a1a1d; font-size: 12px; font-weight: bold;
    }
    .section-body { padding: 6px 10px; }
    label {
      display: block; font-size: 11px; margin-top: 6px; color: #aaa;
    }
    select, input[type="range"], input[type="color"] {
      display: block; width: 100%; margin-top: 2px;
    }
    input[type="range"] { height: 16px; }
    input[type="color"] { height: 28px; padding: 0; border: none; cursor: pointer; background: #0a1a1d; }
    select {
      background: #0a1a1d; color: #ccc; border: 1px solid #1b3f46;
      padding: 3px; border-radius: 3px; font-size: 12px;
    }
    .checkbox-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .checkbox-row label { display: flex; align-items: center; gap: 4px; }
    input[type="checkbox"] { margin: 0; }
    .view-grid {
      display: grid; grid-template-columns: 1fr 1fr 1fr;
      gap: 4px; margin-top: 2px;
    }
    .view-grid button {
      background: #0f2529; color: #aaa; border: 1px solid #1b3f46;
      padding: 3px 0; border-radius: 3px; cursor: pointer; font-size: 11px;
    }
    .view-grid button:hover { background: #14353f; color: #ddd; }
  `],
})
export class RightPanelComponent {
  state = inject(StateService);
  private edgesService = inject(EdgesService);
  private colorsService = inject(ColorsService);
  private sceneService = inject(SceneService);
  viewService = inject(ViewService);

  activeTab: 'model' | 'env' = 'model';
  private rebuildTimer: ReturnType<typeof setTimeout> | null = null;

  setRenderMode(mode: string): void {
    this.state.updateSettings({ renderMode: mode as RenderMode });
    this.rebuildAllEdges();
  }

  setThresholdAngle(v: number): void {
    this.state.updateSettings({ thresholdAngle: v });
    this.scheduleRebuild();
  }

  setEdgeLineWidth(v: number): void {
    this.state.updateSettings({ edgeLineWidth: v });
    this.scheduleRebuild();
  }

  /* 防抖：滑块拖拽时仅更新显示值，停止操作 120ms 后才重建边缘 */
  private scheduleRebuild(): void {
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    this.rebuildTimer = setTimeout(() => this.rebuildAllEdges(), 120);
  }

  private rebuildAllEdges(): void {
    for (const [, entry] of this.state.loadedModels) {
      this.edgesService.createHardEdgesForEntry(entry);
      this.edgesService.applyRenderMode(entry, this.state.renderMode);
      /* 重建边缘后重新应用当前状态颜色，避免边缘颜色回退到 normal */
      this.colorsService.reapplyCurrentState(entry);
    }
  }

  setSolidOpacity(v: number): void {
    this.state.updateSettings({ solidOpacity: v });
    for (const [, entry] of this.state.loadedModels) {
      this.edgesService.applyRenderMode(entry, this.state.renderMode);
    }
  }

  setWfOpacity(v: number): void {
    this.state.updateSettings({ wfOpacity: v });
    for (const [, entry] of this.state.loadedModels) {
      this.edgesService.applyRenderMode(entry, this.state.renderMode);
    }
  }

  setEdgeSeeThrough(v: boolean): void {
    this.state.updateSettings({ edgeSeeThrough: v });
    for (const [, entry] of this.state.loadedModels) {
      this.edgesService.applyRenderMode(entry, this.state.renderMode);
    }
  }

  setSolidSeeThrough(v: boolean): void {
    this.state.updateSettings({ solidSeeThrough: v });
    for (const [, entry] of this.state.loadedModels) {
      this.edgesService.applyRenderMode(entry, this.state.renderMode);
    }
  }

  setBloom(v: boolean): void {
    this.updateSetting('bloom', v);
  }

  setCameraType(type: string): void {
    this.updateSetting('cameraType', type as 'perspective' | 'orthographic');
    this.sceneService.setCameraType(type as 'perspective' | 'orthographic');
  }

  setFlatShading(v: boolean): void {
    this.updateSetting('flatShading', v);
    for (const [, entry] of this.state.loadedModels) {
      entry.model.traverse(c => {
        const m = c as THREE.Mesh;
        if (m.isMesh && m.material) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          for (const mat of mats) {
            (mat as THREE.MeshStandardMaterial).flatShading = v;
            mat.needsUpdate = true;
          }
        }
      });
    }
  }

  toggleShow(key: 'showGrid' | 'showAxes' | 'showCenterDot', v: boolean): void {
    this.updateSetting(key, v);
  }

  setShowBBox(v: boolean): void {
    this.updateSetting('showBBox', v);
  }

  updateSetting<K extends keyof RenderSettings>(key: K, value: RenderSettings[K]): void {
    this.state.updateSettings({ [key]: value } as Partial<RenderSettings>);
    this.sceneService.applySettings(this.state.settings);
  }
}
