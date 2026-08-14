import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { ModelEntry } from '../models/types';
import { ColorsService } from './colors.service';
import { SceneService } from './scene.service';
import { StateService } from './state.service';

/**
 * 报警建筑动画：建筑处于 alarm 状态时，按正弦脉冲做「勾边扩散」的警示效果。
 *
 * 三种渲染模式下的表现：
 * - overlay / edges：勾边线宽/透明度呼吸 + 红色自发光强度波动 + 漫反射颜色脉冲；
 * - solid：勾边与自发光被隐藏，主要靠漫反射颜色在「报警红 ↔ 暗红」间脉冲，形成明显色差。
 *
 * 依赖渲染循环（SceneService.addBeforeRender），每帧更新 uniform 值。
 * 注意：LineMaterial 的 linewidth/opacity、MeshStandardMaterial 的
 * color/emissiveIntensity 都是每帧刷新的 uniform，直接赋值即可，不能设置
 * needsUpdate，否则每帧触发 shader 重编译。
 */
@Injectable({ providedIn: 'root' })
export class AlarmEffectService {
  private scene = inject(SceneService);
  private state = inject(StateService);
  private colors = inject(ColorsService);

  /** 动画起始时间基准（毫秒） */
  private startTime = performance.now();
  /** 处于报警动画中的模型 id，用于离开报警状态时恢复勾边默认值 */
  private animating = new Set<string>();

  constructor() {
    this.scene.addBeforeRender(() => this.update());
  }

  private update(): void {
    const elapsed = (performance.now() - this.startTime) / 1000;

    for (const entry of this.state.loadedModels.values()) {
      if (!entry.alarm) {
        /* 离开报警状态：恢复勾边默认线宽/透明度（emissive/漫反射由 reapplyCurrentState 恢复） */
        if (this.animating.delete(entry.id)) {
          this.resetEdges(entry);
        }
        continue;
      }

      this.animating.add(entry.id);

      /* 0~1 正弦脉冲，约 1.2s 一个周期，各建筑相位错开避免同频闪烁 */
      const pulse =
        (Math.sin(elapsed * ((Math.PI * 2) / 1.2) + this.phaseOf(entry.id)) + 1) / 2;

      this.animateEdges(entry, pulse);
      this.animateEmissive(entry, pulse);
      this.animateDiffuse(entry, pulse);
    }
  }

  /** 勾边扩散：线宽与透明度随脉冲呼吸（仅 overlay/edges 模式可见） */
  private animateEdges(entry: ModelEntry, pulse: number): void {
    if (!entry.edgesGroup || !entry.edgesGroup.visible) return;
    const baseWidth = this.state.edgeLineWidth;
    entry.edgesGroup.traverse((c) => {
      const ls = c as any;
      if (ls.isLineSegments2 && ls.material) {
        const mat = ls.material as LineMaterial;
        mat.linewidth = baseWidth + pulse * 4;
        mat.opacity = 0.2 + pulse * 0.8;
      }
    });
  }

  /** 红色自发光呼吸（overlay/edges 模式下可见，solid 模式 emissive 为黑无效果） */
  private animateEmissive(entry: ModelEntry, pulse: number): void {
    entry.model.traverse((c) => {
      const m = c as any;
      if (m.isMesh) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          if (mat.emissive) {
            mat.emissiveIntensity = 0.2 + pulse * 0.8;
          }
        }
      }
    });
  }

  /** 漫反射颜色脉冲：报警红 ↔ 暗红，solid 模式主要靠它形成色差 */
  private animateDiffuse(entry: ModelEntry, pulse: number): void {
    for (const { name, material } of this.colors.getMaterials(entry)) {
      const sm = material as THREE.MeshStandardMaterial;
      if (!sm.color) continue;
      const peak = this.colors.getAlarmMaterialColor(entry, name);
      sm.color.copy(peak).multiplyScalar(0.3 + pulse * 0.7);
    }
  }

  /** 恢复勾边默认线宽/透明度 */
  private resetEdges(entry: ModelEntry): void {
    if (!entry.edgesGroup) return;
    const baseWidth = this.state.edgeLineWidth;
    const wfOpacity = this.state.wfOpacity;
    entry.edgesGroup.traverse((c) => {
      const ls = c as any;
      if (ls.isLineSegments2 && ls.material) {
        ls.material.linewidth = baseWidth;
        ls.material.opacity = wfOpacity;
      }
    });
  }

  /** 由模型 id 计算稳定相位（0~2π），避免所有报警建筑同频闪烁 */
  private phaseOf(id: string): number {
    let h = 0;
    for (let i = 0; i < id.length; i++) {
      h = (h * 31 + id.charCodeAt(i)) | 0;
    }
    return ((h >>> 0) % 360) * (Math.PI / 180);
  }
}
