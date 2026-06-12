import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { ModelService } from '../../services/model.service';
import { EdgesService } from '../../services/edges.service';
import { SceneService } from '../../services/scene.service';
import { ModelFile, ModelEntry, SceneCamera } from '../../models/types';

@Component({
  selector: 'app-left-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="left-panel">
      <div class="section">
        <div class="section-header">
          <span>模型文件</span>
          <button (click)="scanModels()" title="扫描模型目录">加载</button>
        </div>
        <div class="file-list">
          @for (f of modelFiles; track f.name) {
            <div class="file-item" [class.loaded]="isLoaded(f.name)" (click)="loadFile(f)">
              {{ f.name }}
            </div>
          }
          @if (modelFiles.length === 0) {
            <div class="empty-hint">暂无文件，点击"加载"扫描</div>
          }
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <span>已加载模型</span>
          <button class="clear-btn" (click)="clearAll()" title="清空所有模型">清空</button>
        </div>
        <div class="loaded-list">
          @for (entry of loadedEntries; track entry.id) {
            <div class="loaded-item" [class.selected]="selectedId === entry.id" (click)="selectModel(entry)">
              <span class="vis-toggle" [class.hidden]="!entry.visible"
                    (click)="$event.stopPropagation(); toggleVis(entry)">
                {{ entry.visible ? 'V' : 'H' }}
              </span>
              <span class="lock-icon" [class.locked]="entry.locked"
                    (click)="$event.stopPropagation(); toggleLock(entry)"
                    title="锁定后 3D 视图无法选中">
                {{ entry.locked ? '🔒' : '🔓' }}
              </span>
              <span class="model-name">{{ entry.fileName }}</span>
              <button class="remove-btn" (click)="$event.stopPropagation(); removeModel(entry)">×</button>
            </div>
          }
          @if (loadedEntries.length === 0) {
            <div class="empty-hint">无已加载模型</div>
          }
        </div>
      </div>

      <div class="section cam-section">
        <div class="section-header">
          <span>场景摄像机</span>
          <button (click)="addCamera()" title="将当前视角保存为摄像机">+</button>
        </div>
        <div class="cam-list">
          @for (cam of sceneCameras; track cam.id) {
            <div class="loaded-item cam-item"
                 [class.selected]="selectedCamId === cam.id"
                 (click)="selectCamera(cam)">
              <span class="cam-icon">🎥</span>
              <span class="model-name">{{ cam.name }}</span>
              <button class="switch-btn"
                      [class.active]="activeCamId === cam.id"
                      (click)="$event.stopPropagation(); toggleCameraView(cam)"
                      title="切换/切回视角">
                {{ activeCamId === cam.id ? '切回' : '切换' }}
              </button>
              <button class="remove-btn" (click)="$event.stopPropagation(); removeCamera(cam)">×</button>
            </div>
          }
          @if (sceneCameras.length === 0) {
            <div class="empty-hint">点击 + 添加当前视角</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .left-panel {
      width: 260px; background: #071214; color: #ccc;
      border-right: 1px solid #173438; display: flex; flex-direction: column;
      overflow: hidden; flex-shrink: 0;
    }
    .section {
      border-bottom: 1px solid #0f2529; overflow: hidden;
      display: flex; flex-direction: column;
    }
    .section:nth-child(1) { flex: 1; }
    .section:nth-child(2) { flex: 1; }
    .cam-section { flex: 0 0 auto; max-height: 200px; }
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 10px; background: #0a1a1d; font-size: 12px; font-weight: bold;
      flex-shrink: 0;
    }
    .section-header button {
      background: #07a990; color: #fff; border: none;
      padding: 2px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;
    }
    .section-header button:hover { background: #17f1c6; }
    .section-header button.clear-btn { background: #ef6f59; }
    .section-header button.clear-btn:hover { background: #f48b79; }
    .file-list, .loaded-list { overflow-y: auto; flex: 1; }
    .cam-list { overflow-y: auto; flex: 1; }
    .file-item {
      padding: 4px 10px; cursor: pointer; font-size: 12px;
      border-bottom: 1px solid #0a1a1d;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .file-item:hover { background: #0f252e; }
    .file-item.loaded { color: #17f1c6; }
    .loaded-item {
      display: flex; align-items: center; padding: 3px 10px;
      cursor: pointer; font-size: 12px; gap: 6px;
    }
    .loaded-item:hover { background: #0f252e; }
    .loaded-item.selected { background: #0f2a33; }
    .vis-toggle {
      cursor: pointer; font-size: 11px; width: 18px; text-align: center;
      color: #17f1c6; font-weight: bold;
    }
    .vis-toggle.hidden { color: #1f4a52; }
    .lock-icon {
      cursor: pointer; font-size: 12px; flex-shrink: 0; opacity: 0.5;
    }
    .lock-icon:hover { opacity: 1; }
    .lock-icon.locked { opacity: 1; }
    .model-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .remove-btn {
      background: none; border: none; color: #ef6f59; cursor: pointer;
      font-size: 16px; line-height: 1; padding: 0 2px;
    }
    .remove-btn:hover { color: #f59484; }
    .cam-item { cursor: pointer; }
    .cam-icon { font-size: 14px; flex-shrink: 0; }
    .switch-btn {
      background: #0f2529; color: #17f1c6; border: 1px solid #14353f;
      padding: 1px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;
    }
    .switch-btn:hover { background: #14353f; color: #c1fff5; }
    .switch-btn.active { background: #ef6f59; color: #fff; border-color: #ef6f59; }
    .empty-hint { padding: 10px; font-size: 11px; color: #666; text-align: center; }
  `],
})
export class LeftPanelComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  state = inject(StateService);
  private modelService = inject(ModelService);
  private edgesService = inject(EdgesService);
  private sceneService = inject(SceneService);

  modelFiles: ModelFile[] = [];
  loadedEntries: ModelEntry[] = [];
  selectedId: string | null = null;
  sceneCameras: SceneCamera[] = [];
  activeCamId: string | null = null;
  selectedCamId: string | null = null;

  private subs = new Subscription();
  private camIdCounter = 0;

  ngOnInit(): void {
    this.subs.add(this.state.modelFiles$.subscribe(f => this.modelFiles = f));
    this.subs.add(this.state.loadedModelList$.subscribe(entries => this.loadedEntries = entries));
    this.subs.add(this.state.selectedModelId$.subscribe(id => this.selectedId = id));
    this.subs.add(this.state.sceneCameras$.subscribe(cams => this.sceneCameras = cams));
    this.subs.add(this.state.activeSceneCameraId$.subscribe(id => this.activeCamId = id));
    this.subs.add(this.state.selectedSceneCameraId$.subscribe(id => this.selectedCamId = id));
    this.loadModelFiles();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private async loadModelFiles(): Promise<void> {
    try {
      const files = await firstValueFrom(this.api.getModels());
      this.state.modelFiles$.next(files);
    } catch { /* 服务器可能未启动 */ }
  }

  async scanModels(): Promise<void> {
    try {
      const files = await firstValueFrom(this.api.scanModels());
      this.state.modelFiles$.next(files);
      this.state.statusMessage$.next(`已扫描 ${files.length} 个文件`);
    } catch {
      this.state.statusMessage$.next('扫描失败');
    }
  }

  isLoaded(fileName: string): boolean {
    for (const [, e] of this.state.loadedModels) {
      if (e.fileName === fileName) return true;
    }
    return false;
  }

  async loadFile(file: ModelFile): Promise<void> {
    this.state.loading$.next(true);
    this.state.statusMessage$.next(`正在加载: ${file.name}...`);
    const entry = await this.modelService.loadModel(`/models/${file.name}`, file.name);
    this.state.loading$.next(false);
    if (entry) {
      this.state.statusMessage$.next(`已加载: ${file.name}`);
    } else {
      this.state.statusMessage$.next(`加载失败: ${file.name}`);
    }
  }

  selectModel(entry: ModelEntry): void {
    this.state.selectedModelId$.next(entry.id);
  }

  toggleVis(entry: ModelEntry): void {
    entry.visible = !entry.visible;
    entry.wrapper.visible = entry.visible;
    if (entry.edgesGroup) entry.edgesGroup.visible = entry.visible;
  }

  toggleLock(entry: ModelEntry): void {
    entry.locked = !entry.locked;
    /* 触发 viewerModels 更新以同步到 ModelViewerComponent */
    this.state.loadedModels$.next(new Map(this.state.loadedModels));
  }

  removeModel(entry: ModelEntry): void {
    this.modelService.removeModel(entry.id);
  }

  clearAll(): void {
    const ids = Array.from(this.state.loadedModels.keys());
    for (const id of ids) this.modelService.removeModel(id);
    this.state.statusMessage$.next('已清空所有模型');
  }

  /* ---- 场景摄像机 ---- */

  addCamera(): void {
    const { camera: cam, orthoCamera, helper, model, bodyMat, lensMat, vfMat } = this.sceneService.createCameraObject();
    this.sceneService.scene.add(helper);
    this.sceneService.scene.add(model);

    const id = 'cam_' + (++this.camIdCounter);
    const defaultColors = {
      normal: { body: '#07a990', lens: '#1a1a1a', viewfinder: '#1a1a1a' },
      hover: { body: '#17f1c6', lens: '#333333', viewfinder: '#333333' },
      selected: { body: '#0adba8', lens: '#2a2a2a', viewfinder: '#2a2a2a' },
    };
    const sceneCam: SceneCamera = {
      id, name: `Camera ${this.camIdCounter}`,
      camera: cam, perspCamera: cam, orthoCamera,
      isOrtho: false, helper, model,
      colors: defaultColors, bodyMat, lensMat, vfMat,
    };
    this.state.addSceneCamera(sceneCam);
    /* 选中新创建的摄像机，在右上角 info card 显示编辑面板 */
    this.state.selectedSceneCameraId$.next(id);
    this.state.statusMessage$.next(`已添加: ${sceneCam.name}`);
  }

  selectCamera(sceneCam: SceneCamera): void {
    this.state.selectedSceneCameraId$.next(sceneCam.id);
  }

  toggleCameraView(sceneCam: SceneCamera): void {
    const activated = this.sceneService.toggleCameraView(sceneCam.camera);
    this.state.statusMessage$.next(activated ? `已切换到: ${sceneCam.name}` : '已切回主摄像机');
  }

  removeCamera(sceneCam: SceneCamera): void {
    if (this.activeCamId === sceneCam.id) {
      this.sceneService.restoreMainCamView();
      this.state.activeSceneCameraId$.next(null);
    }
    this.sceneService.scene.remove(sceneCam.helper);
    sceneCam.helper.dispose();
    this.sceneService.scene.remove(sceneCam.model);
    sceneCam.model.traverse((c: any) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    });
    this.state.removeSceneCamera(sceneCam.id);
    if (this.state.selectedSceneCameraId$.value === sceneCam.id) {
      this.state.selectedSceneCameraId$.next(null);
    }
  }
}
