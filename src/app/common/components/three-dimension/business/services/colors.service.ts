import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { StateService } from './state.service';
import { ModelEntry, ModelColors, MaterialColorState, TypeColorPreset } from '../models/types';

export type ColorState = 'normal' | 'hover' | 'selected' | 'alarm';

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
    const cs = entry.colors[state];
    if (cs) cs.edge = hex;
    this.applyEdgeColor(entry, state);
  }

  updateBackgroundColor(entry: ModelEntry, state: ColorState, hex: string): void {
    const cs = entry.colors[state];
    if (cs) cs.background = hex;
    this.applyBackgroundColor(entry, state);
  }

  /** 颜色状态优先级：selected > alarm > hover > normal */
  getModelState(entry: ModelEntry): ColorState {
    if (entry.id === this.state.selectedModelId) return 'selected';
    if (entry.alarm) return 'alarm';
    if (entry.id === this.state.hoveredModelId) return 'hover';
    return 'normal';
  }

  /** 应用指定状态的完整外观（边缘 + 背景 + 材质颜色） */
  applyStateColors(entry: ModelEntry, state: ColorState): void {
    if (this.state.renderMode === 'solid') {
      this.applySolidColors(entry, state);
      return;
    }
    this.applyEdgeColor(entry, state);
    this.applyBackgroundColor(entry, state);
    this.applyMaterialState(entry, state);
  }

  /** solid 模式：去除 emissive 效果，按当前状态应用漫反射颜色 */
  private applySolidColors(entry: ModelEntry, state: ColorState): void {
    entry.model.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          const sm = mat as THREE.MeshStandardMaterial;
          if (sm.emissive) {
            sm.emissive.set(0x000000);
            sm.emissiveIntensity = 0;
            sm.needsUpdate = true;
          }
        }
      }
    });
    this.applyMaterialState(entry, state);
  }

  /** 根据模型当前 hover/selected 状态重新应用对应颜色 */
  reapplyCurrentState(entry: ModelEntry): void {
    this.applyStateColors(entry, this.getModelState(entry));
  }

  private applyEdgeColor(entry: ModelEntry, state: ColorState): void {
    /* alarm 未配置时 fallback → selected → normal */
    const colorState = state === 'alarm'
      ? (entry.colors.alarm ?? entry.colors.selected ?? entry.colors.normal)
      : entry.colors[state];
    const color = colorState.edge;
    if (!entry.edgesGroup) return;
    entry.edgesGroup.traverse(c => {
      if ((c as any).isLineSegments2 && (c as any).material?.color) {
        (c as any).material.color.set(color);
      }
    });
  }

  private applyBackgroundColor(entry: ModelEntry, state: ColorState): void {
    /* alarm 未配置时 fallback → selected → normal */
    const colorState = state === 'alarm'
      ? (entry.colors.alarm ?? entry.colors.selected ?? entry.colors.normal)
      : entry.colors[state];
    const hex = colorState.background;
    const color = new THREE.Color(hex);
    entry.model.traverse(c => {
      const m = c as THREE.Mesh;
      if (m.isMesh) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          const sm = mat as THREE.MeshStandardMaterial;
          if (sm.emissive) {
            sm.emissive.copy(color);
            sm.emissiveIntensity =
              state === 'normal' ? 0.15 : state === 'hover' ? 0.4 : state === 'alarm' ? 0.8 : 0.6;
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

  /** 加载模型后初始化材质颜色（从模型已有颜色读取，typeColorPresets 不可用时的回退） */
  initMaterialColors(entry: ModelEntry): void {
    const materials = this.getMaterials(entry);
    entry.materialColors.clear();
    for (const { name, material } of materials) {
      const hex = '#' + ((material as THREE.MeshStandardMaterial).color?.getHexString?.() ?? 'cccccc');
      entry.materialColors.set(name, {
        normal: hex,
        hover: hex,
        selected: hex,
        alarm: undefined,
      });
    }
  }

  /** 根据 config.json 的 typeColorPresets 为模型应用 edge/background/材质颜色 */
  applyTypeColorPresets(entry: ModelEntry, modelType: string): void {
    const presets = this.state.typeColorPresets;
    const preset: TypeColorPreset | undefined = presets[modelType];
    if (!preset) {
      /* 无对应预设时回退到模型原始颜色 */
      this.initMaterialColors(entry);
      return;
    }

    /* 应用 edge + background 颜色（含 alarm） */
    entry.colors = {
      normal: { edge: preset.normal.edge, background: preset.normal.background },
      hover: { edge: preset.hover.edge, background: preset.hover.background },
      selected: { edge: preset.selected.edge, background: preset.selected.background },
      alarm: preset.alarm
        ? { edge: preset.alarm.edge, background: preset.alarm.background }
        : undefined,
    };

    /* 应用材质颜色：按 mat name 小写匹配 preset.materials 中的 key，
     * 未匹配时 fallback: diffuse → materials['other'] → '#cccccc'
     * （diffuse 优先级高于 other，因为 diffuse 是用户显式配置的状态级颜色） */
    const materials = this.getMaterials(entry);
    entry.materialColors.clear();
    for (const { name } of materials) {
      const matKey = name.toLowerCase();
      const normalHex =
        preset.normal.materials[matKey] ??
        preset.normal.diffuse ??
        preset.normal.materials['other'] ??
        '#cccccc';
      const hoverHex =
        preset.hover.materials[matKey] ??
        preset.hover.diffuse ??
        preset.hover.materials['other'] ??
        normalHex;
      const selectedHex =
        preset.selected.materials[matKey] ??
        preset.selected.diffuse ??
        preset.selected.materials['other'] ??
        normalHex;
      const alarmHex = preset.alarm
        ? (preset.alarm.materials[matKey] ??
          preset.alarm.diffuse ??
          preset.alarm.materials['other'] ??
          undefined)
        : undefined;
      entry.materialColors.set(name, {
        normal: normalHex,
        hover: hoverHex,
        selected: selectedHex,
        alarm: alarmHex,
      });
    }
  }

  getMaterialColor(entry: ModelEntry, materialName: string, state: ColorState): string {
    const info = entry.materialColors.get(materialName);
    if (!info) return '#cccccc';
    /* alarm 优先用 alarm 色，fallback 到 selected → normal */
    if (state === 'alarm') return info.alarm ?? info.selected ?? info.normal;
    return info[state] ?? '#cccccc';
  }

  setMaterialColor(entry: ModelEntry, materialName: string, state: ColorState, hex: string): void {
    let info = entry.materialColors.get(materialName);
    if (!info) {
      info = { normal: hex, hover: hex, selected: hex, alarm: undefined };
      entry.materialColors.set(materialName, info);
    }
    if (state === 'alarm') {
      info.alarm = hex;
    } else {
      info[state] = hex;
    }
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

  /** 获取可控制可见性的节点名称列表（已命名的 Group 含 Mesh 子孙 + 不在命名 Group 内的具名 Mesh） */
  getMeshNames(entry: ModelEntry): string[] {
    const names: string[] = [];
    const namedGroupIds = new Set<number>();

    /* 先收集所有包含 mesh 子孙的命名 Group */
    entry.model.traverse(c => {
      if ((c as THREE.Group).isGroup && c.name && c.id !== entry.model.id && this.hasMeshDescendant(c)) {
        namedGroupIds.add(c.id);
        names.push(c.name);
      }
    });

    /* 再收集不在命名 Group 内的具名 Mesh */
    entry.model.traverse(c => {
      if (!(c as THREE.Mesh).isMesh || !c.name) return;
      let p = c.parent;
      while (p && p !== entry.model) {
        if (namedGroupIds.has(p.id)) return;
        p = p.parent;
      }
      names.push(c.name);
    });

    return names;
  }

  /** 获取节点可见性：Group 检查所有子孙 mesh 是否都可见，Mesh 直接取 visible */
  getMeshVisible(entry: ModelEntry, nodeName: string): boolean {
    const node = this.findNodeByName(entry, nodeName);
    if (!node) return true;
    if ((node as THREE.Group).isGroup) {
      const meshes = this.getDescendantMeshes(node);
      if (meshes.length === 0) return node.visible;
      return meshes.every(m => m.visible);
    }
    return node.visible;
  }

  /** 切换节点可见性：Group 切换所有子孙 mesh，Mesh 切换自身 */
  toggleMeshVisible(entry: ModelEntry, nodeName: string): void {
    const node = this.findNodeByName(entry, nodeName);
    if (!node) return;
    if ((node as THREE.Group).isGroup) {
      const meshes = this.getDescendantMeshes(node);
      const newVis = !meshes.every(m => m.visible);
      for (const m of meshes) m.visible = newVis;
    } else {
      node.visible = !node.visible;
    }
    /* 通知 EdgesService 重建边缘几何体 */
    this.state.visibilityChanged$.next(entry.id);
  }

  private findNodeByName(entry: ModelEntry, name: string): THREE.Object3D | null {
    let found: THREE.Object3D | null = null;
    entry.model.traverse(c => {
      if (c.name === name && !found) found = c;
    });
    return found;
  }

  private hasMeshDescendant(node: THREE.Object3D): boolean {
    let found = false;
    node.traverse(c => {
      if (c !== node && (c as THREE.Mesh).isMesh) found = true;
    });
    return found;
  }

  private getDescendantMeshes(node: THREE.Object3D): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    node.traverse(c => {
      if (c !== node && (c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh);
    });
    return meshes;
  }

  /** 对所有已加载模型应用平面着色 */
  setFlatShading(entry: ModelEntry, v: boolean): void {
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
