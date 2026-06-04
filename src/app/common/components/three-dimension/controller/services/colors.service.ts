import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { StateService } from './state.service';
import { ModelEntry, ModelColors, MaterialColorState } from '../models/types';

export type ColorState = 'normal' | 'hover' | 'selected';

interface MaterialInfo {
  name: string;
  material: THREE.Material;
}

@Injectable({ providedIn: 'root' })
export class ColorsService {
  private state = inject(StateService);

  getEntryColors(entry: ModelEntry): ModelColors {
    return entry.colors;
  }

  updateEdgeColor(entry: ModelEntry, state: ColorState, hex: string): void {
    entry.colors[state].edge = hex;
    this.applyEdgeColor(entry, state);
  }

  updateBackgroundColor(entry: ModelEntry, state: ColorState, hex: string): void {
    entry.colors[state].background = hex;
    this.applyBackgroundColor(entry, state);
  }

  /** 应用指定状态的完整外观（边缘 + 背景 + 材质颜色） */
  applyStateColors(entry: ModelEntry, state: ColorState): void {
    this.applyEdgeColor(entry, state);
    this.applyBackgroundColor(entry, state);
    this.applyMaterialState(entry, state);
  }

  private applyEdgeColor(entry: ModelEntry, state: ColorState): void {
    const color = entry.colors[state].edge;
    if (!entry.edgesGroup) return;
    entry.edgesGroup.traverse(c => {
      if ((c as any).isLineSegments2 && (c as any).material?.color) {
        (c as any).material.color.set(color);
      }
    });
  }

  private applyBackgroundColor(entry: ModelEntry, state: ColorState): void {
    const hex = entry.colors[state].background;
    const color = new THREE.Color(hex);
    entry.model.traverse(c => {
      const m = c as THREE.Mesh;
      if (m.isMesh) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          const sm = mat as THREE.MeshStandardMaterial;
          if (sm.emissive) {
            sm.emissive.copy(color);
            sm.emissiveIntensity = state === 'normal' ? 0.15 : state === 'hover' ? 0.4 : 0.6;
            sm.needsUpdate = true;
          }
        }
      }
    });
  }

  /** 收集模型中的唯一材质列表，名称优先用 mat.name，否则用序号 */
  getMaterials(entry: ModelEntry): MaterialInfo[] {
    const seen = new Set<THREE.Material>();
    const result: MaterialInfo[] = [];
    let idx = 0;
    entry.model.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        if (seen.has(mat)) continue;
        seen.add(mat);
        idx++;
        const name = (mat as THREE.MeshStandardMaterial).name || `材质 ${idx}`;
        result.push({ name, material: mat });
      }
    });
    return result;
  }

  /** 加载模型后初始化材质颜色（从模型已有颜色读取） */
  initMaterialColors(entry: ModelEntry): void {
    const materials = this.getMaterials(entry);
    entry.materialColors.clear();
    for (const { name, material } of materials) {
      const hex = '#' + ((material as THREE.MeshStandardMaterial).color?.getHexString?.() ?? 'cccccc');
      entry.materialColors.set(name, {
        normal: hex,
        hover: hex,
        selected: hex,
      });
    }
  }

  getMaterialColor(entry: ModelEntry, materialName: string, state: ColorState): string {
    const info = entry.materialColors.get(materialName);
    return info?.[state] ?? '#cccccc';
  }

  setMaterialColor(entry: ModelEntry, materialName: string, state: ColorState, hex: string): void {
    let info = entry.materialColors.get(materialName);
    if (!info) {
      info = { normal: hex, hover: hex, selected: hex };
      entry.materialColors.set(materialName, info);
    }
    info[state] = hex;
  }

  /** 根据当前激活的颜色状态，将材质颜色应用到模型中 */
  applyMaterialState(entry: ModelEntry, state: ColorState): void {
    const materials = this.getMaterials(entry);
    for (const { name, material } of materials) {
      const m = material as THREE.MeshStandardMaterial;
      const hex = this.getMaterialColor(entry, name, state);
      if (m.color) {
        m.color.set(hex);
        m.needsUpdate = true;
      }
    }
  }

  /** 获取 mesh 名称列表（用于可见性控制） */
  getMeshNames(entry: ModelEntry): string[] {
    const names: string[] = [];
    entry.model.traverse(c => {
      if ((c as THREE.Mesh).isMesh && c.name) {
        names.push(c.name);
      }
    });
    return names;
  }

  /** 获取 mesh 可见性 */
  getMeshVisible(entry: ModelEntry, meshName: string): boolean {
    let visible = true;
    entry.model.traverse(c => {
      if ((c as THREE.Mesh).isMesh && c.name === meshName) {
        visible = c.visible;
      }
    });
    return visible;
  }

  /** 切换 mesh 可见性 */
  toggleMeshVisible(entry: ModelEntry, meshName: string): void {
    entry.model.traverse(c => {
      if ((c as THREE.Mesh).isMesh && c.name === meshName) {
        c.visible = !c.visible;
      }
    });
  }
}
