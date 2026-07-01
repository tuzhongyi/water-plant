import { Injectable, inject, NgZone } from '@angular/core';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { LuminosityShader } from 'three/examples/jsm/shaders/LuminosityShader.js';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { StateService } from './state.service';
import { RenderSettings, SceneCamera } from '../models/types';

@Injectable({ providedIn: 'root' })
export class SceneService {
  private zone = inject(NgZone);
  private state = inject(StateService);

  scene!: THREE.Scene;
  perspCamera!: THREE.PerspectiveCamera;
  orthoCamera!: THREE.OrthographicCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  composer!: EffectComposer;
  private cameraType: 'perspective' | 'orthographic' = 'perspective';

  get camera(): THREE.PerspectiveCamera | THREE.OrthographicCamera {
    return this.cameraType === 'perspective' ? this.perspCamera : this.orthoCamera;
  }

  bloomPass!: UnrealBloomPass;
  fxaaPass!: ShaderPass;
  sobelPass!: ShaderPass;

  ambientLight!: THREE.AmbientLight;
  keyLight!: THREE.DirectionalLight;
  fillLight!: THREE.DirectionalLight;
  hemiLight!: THREE.HemisphereLight;

  private gridHelper?: THREE.GridHelper;
  private gridSize = 100;
  private gridVisible = false;
  private axesHelper?: THREE.AxesHelper;
  private centerDot?: THREE.Mesh;

  private animationId = 0;
  private canvas!: HTMLCanvasElement;
  private containerEl!: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private beforeRenderCallbacks: Array<() => void> = [];
  overlayScene!: THREE.Scene;
  private labelSprites = new Map<THREE.Sprite, number>();
  /* 主摄像机状态暂存，用于从场景摄像机切回 */
  private savedMainCamPos?: THREE.Vector3;
  private savedMainCamTgt?: THREE.Vector3;
  wasdSpeed = 0.08;

  init(container: HTMLElement, canvas: HTMLCanvasElement): void {
    this.containerEl = container;
    this.canvas = canvas;
    const w = container.clientWidth;
    const h = container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.overlayScene = new THREE.Scene();

    this.perspCamera = new THREE.PerspectiveCamera(50, w / h, 0.1, 2000);
    this.perspCamera.position.set(5, 3, 7);
    this.perspCamera.lookAt(0, 0, 0);

    const frustumSize = 20;
    this.orthoCamera = new THREE.OrthographicCamera(
      frustumSize * w / h / -2, frustumSize * w / h / 2,
      frustumSize / 2, frustumSize / -2,
      0.1, 2000
    );
    this.orthoCamera.position.copy(this.perspCamera.position);
    this.orthoCamera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.perspCamera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 0, 0);
    /* 左键平移，右键旋转 */
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    this.controls.update();

    this.setupLights();
    this.setupComposer(w, h);

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);

    this.applySettings(this.state.settings);

    this.state.settings$.subscribe(s => this.applySettings(s));

    this.zone.runOutsideAngular(() => this.animate());
  }

  private setupLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    this.keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
    this.keyLight.position.set(10, 20, 10);
    this.fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.fillLight.position.set(-10, 0, -5);
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    this.hemiLight.position.set(0, 10, 0);

    this.scene.add(this.ambientLight);
    this.scene.add(this.keyLight);
    this.scene.add(this.fillLight);
    this.scene.add(this.hemiLight);
  }

  private setupComposer(w: number, h: number): void {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.6);
    this.bloomPass.enabled = false;
    this.composer.addPass(this.bloomPass);

    /* Sobel 边缘检测 */
    const sobelEffect = new ShaderPass(SobelOperatorShader);
    sobelEffect.uniforms['resolution'].value = new THREE.Vector2(w, h);
    sobelEffect.enabled = false;
    this.sobelPass = sobelEffect;
    this.composer.addPass(this.sobelPass);

    /* FXAA 抗锯齿 */
    this.fxaaPass = new ShaderPass(FXAAShader);
    this.fxaaPass.uniforms['resolution'].value = new THREE.Vector2(1 / w, 1 / h);
    this.fxaaPass.enabled = false;
    this.composer.addPass(this.fxaaPass);

    this.composer.addPass(new OutputPass());
  }

  setCameraType(type: 'perspective' | 'orthographic'): void {
    if (this.cameraType === type) return;
    const oldCam = this.camera;
    this.cameraType = type;
    const newCam = this.camera;

    /* 同步位置和目标 */
    newCam.position.copy(oldCam.position);
    this.controls.object = newCam;
    this.controls.update();

    /* 更新 composer 中 RenderPass 的相机引用 */
    const renderPass = this.composer.passes[0] as RenderPass;
    renderPass.camera = newCam;
  }

  applySettings(s: RenderSettings): void {
    this.scene.background = new THREE.Color(s.bgColor);
    /* 雾距离与 OrbitControls 最大距离匹配，拉远时逐渐淡出 */
    const maxD = this.controls.maxDistance || s.cameraFar;
    const fogNear = maxD * 0.7;
    const fogFar = maxD;
    if (this.scene.fog) {
      (this.scene.fog as THREE.Fog).near = fogNear;
      (this.scene.fog as THREE.Fog).far = fogFar;
      this.scene.fog.color.set(s.bgColor);
    } else {
      this.scene.fog = new THREE.Fog(s.bgColor, fogNear, fogFar);
    }

    this.ambientLight.intensity = s.ambientIntensity;
    this.keyLight.intensity = s.keyIntensity;
    this.fillLight.intensity = s.fillIntensity;
    this.hemiLight.intensity = s.hemiIntensity;

    this.controls.autoRotate = s.autoRotate;

    this.setGrid(s.showGrid);
    this.setAxes(s.showAxes);
    this.setCenterDot(s.showCenterDot);

    this.bloomPass.enabled = s.bloom;
    this.bloomPass.threshold = s.bloomThreshold;
    this.bloomPass.strength = s.bloomStrength;
    this.bloomPass.radius = s.bloomRadius;

    this.sobelPass.enabled = s.sobel;
    this.fxaaPass.enabled = s.fxaa;

    this.perspCamera.near = s.cameraNear;
    this.perspCamera.far = s.cameraFar;
    this.orthoCamera.near = s.cameraNear;
    this.orthoCamera.far = s.cameraFar;
    this.perspCamera.updateProjectionMatrix();
    this.orthoCamera.updateProjectionMatrix();

    if (s.cameraType && s.cameraType !== this.cameraType) {
      this.setCameraType(s.cameraType);
    }

    for (const [, entry] of this.state.loadedModels) {
      if (entry.labelObject) {
        entry.labelObject.visible = s.showLabels && (
          entry.labelMode === 'always' ||
          (entry.labelMode === 'hover' && entry.id === this.state.hoveredModelId)
        );
      }
    }

    for (const cam of this.state.sceneCameras) {
      const isActive = this.state.activeSceneCameraId$.value === cam.id;
      cam.helper.visible = !isActive && s.showCameraHelpers;
    }
  }

  setGrid(show: boolean): void {
    this.gridVisible = show;
    this.rebuildGrid();
  }

  setGridSize(size: number): void {
    this.gridSize = size;
    this.rebuildGrid();
  }

  private rebuildGrid(): void {
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      this.gridHelper.dispose();
      this.gridHelper = undefined;
    }
    if (!this.gridVisible) return;
    const sz = this.gridSize;
    /* 固定 20 个分割，大网格线间距自动变大 */
    const divs = 20;
    this.gridHelper = new THREE.GridHelper(sz, divs, 0x444444, 0x222222);
    this.scene.add(this.gridHelper);
  }

  private axesSize = 5

  setAxesSize(size: number): void {
    this.axesSize = size
    if (this.axesHelper) {
      /* 重建坐标轴以应用新尺寸 */
      this.scene.remove(this.axesHelper)
      this.axesHelper.dispose()
      this.axesHelper = new THREE.AxesHelper(size)
      this.scene.add(this.axesHelper)
    }
  }

  setAxes(show: boolean): void {
    if (show && !this.axesHelper) {
      this.axesHelper = new THREE.AxesHelper(this.axesSize);
      this.scene.add(this.axesHelper);
    } else if (!show && this.axesHelper) {
      this.scene.remove(this.axesHelper);
      this.axesHelper.dispose();
      this.axesHelper = undefined;
    }
  }

  setCenterDot(show: boolean): void {
    if (show && !this.centerDot) {
      const geo = new THREE.SphereGeometry(0.05, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      this.centerDot = new THREE.Mesh(geo, mat);
      this.scene.add(this.centerDot);
    } else if (!show && this.centerDot) {
      this.scene.remove(this.centerDot);
      this.centerDot.geometry.dispose();
      (this.centerDot.material as THREE.Material).dispose();
      this.centerDot = undefined;
    }
  }

  private onResize(): void {
    const w = this.containerEl.clientWidth;
    const h = this.containerEl.clientHeight;

    this.perspCamera.aspect = w / h;
    this.perspCamera.updateProjectionMatrix();

    const frustumSize = 20;
    this.orthoCamera.left = frustumSize * w / h / -2;
    this.orthoCamera.right = frustumSize * w / h / 2;
    this.orthoCamera.top = frustumSize / 2;
    this.orthoCamera.bottom = frustumSize / -2;
    this.orthoCamera.updateProjectionMatrix();

    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    for (const cb of this.beforeRenderCallbacks) cb();
    this.controls.update();

    /* label 恒定屏幕大小 */
    const cam = this.camera;
    const globalFontSize = this.state.settings.labelFontSize || 25;
    if (cam instanceof THREE.PerspectiveCamera) {
      const halfFovTan = Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5));
      for (const [sprite, aspect] of this.labelSprites) {
        const fs = sprite.userData['labelFontSize'] ?? globalFontSize;
        const screenRatio = fs / 1000;
        const dist = cam.position.distanceTo(sprite.position);
        const h = dist * halfFovTan * 2 * screenRatio;
        sprite.scale.set(h * aspect, h, 1);
      }
    } else {
      const baseFrustum = 20;
      for (const [sprite, aspect] of this.labelSprites) {
        const fs = sprite.userData['labelFontSize'] ?? globalFontSize;
        const screenRatio = fs / 1000;
        const h = baseFrustum / (cam as THREE.OrthographicCamera).zoom * screenRatio;
        sprite.scale.set(h * aspect, h, 1);
      }
    }

    this.composer.render();

    /* 叠加渲染 overlayScene（TC gizmo），覆盖在 composer 输出之上 */
    this.renderer.autoClear = false;
    this.renderer.clearDepth();
    this.renderer.render(this.overlayScene, this.camera);
    this.renderer.autoClear = true;
  }

  addBeforeRender(cb: () => void): void {
    this.beforeRenderCallbacks.push(cb);
  }

  removeBeforeRender(cb: () => void): void {
    const idx = this.beforeRenderCallbacks.indexOf(cb);
    if (idx >= 0) this.beforeRenderCallbacks.splice(idx, 1);
  }

  registerLabel(sprite: THREE.Sprite, aspect: number): void {
    this.labelSprites.set(sprite, aspect);
  }

  unregisterLabel(sprite: THREE.Sprite): void {
    this.labelSprites.delete(sprite);
  }

  createCameraObject(): { camera: THREE.PerspectiveCamera; orthoCamera: THREE.OrthographicCamera; helper: THREE.CameraHelper; model: THREE.Group; bodyMat: THREE.MeshStandardMaterial; lensMat: THREE.MeshStandardMaterial; vfMat: THREE.MeshStandardMaterial } {
    const mainCam = this.camera;
    const w = this.renderer.domElement.clientWidth;
    const h = this.renderer.domElement.clientHeight;
    const perspCam = new THREE.PerspectiveCamera(
      mainCam instanceof THREE.PerspectiveCamera ? mainCam.fov : 50,
      w / h,
      mainCam.near,
      mainCam.far
    );
    perspCam.position.copy(mainCam.position);
    const dir = new THREE.Vector3();
    mainCam.getWorldDirection(dir);
    const tgt = mainCam.position.clone().add(dir);
    perspCam.lookAt(tgt);

    const frustumSize = 20;
    const aspect = w / h;
    const orthoCam = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, frustumSize * aspect / 2,
      frustumSize / 2, frustumSize / -2,
      mainCam.near, mainCam.far
    );
    orthoCam.position.copy(mainCam.position);
    orthoCam.lookAt(tgt);

    const helper = new THREE.CameraHelper(perspCam);
    helper.name = 'scene_camera_helper';

    /* 摄像机3D模型：长方形机身 + 圆柱形镜头（-Z 为前方） */
    const model = new THREE.Group();
    model.name = 'scene_camera_model';

    /* 机身 — 扁长方形盒子 */
    const bodyGeo = new THREE.BoxGeometry(0.55, 0.32, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x07a990, roughness: 0.3, metalness: 0.4,
      emissive: 0x07a990, emissiveIntensity: 0.4,
    });
    model.add(new THREE.Mesh(bodyGeo, bodyMat));

    /* 镜头 — 圆柱体，从机身前面伸出，方向对齐摄像机视线（白色视锥线 = -Z） */
    const lensGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.22, 12);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, roughness: 0.15, metalness: 0.7,
      emissive: 0x111111, emissiveIntensity: 0.2,
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    /* 圆柱体默认沿 +Y，setFromUnitVectors 将顶部对齐到局部 -Z（摄像机视线方向） */
    lens.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1));
    lens.position.set(0, -0.02, -0.32);
    model.add(lens);

    /* 取景器 — 顶部小方块 */
    const vfGeo = new THREE.BoxGeometry(0.15, 0.1, 0.18);
    const vfMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, roughness: 0.2, metalness: 0.5,
      emissive: 0x111111, emissiveIntensity: 0.2,
    });
    const vf = new THREE.Mesh(vfGeo, vfMat);
    vf.position.set(0, 0.21, 0.04);
    model.add(vf);

    /* 同步 model 的位置和朝向（跟随当前激活的摄像机） */
    let activeCam: THREE.PerspectiveCamera | THREE.OrthographicCamera = perspCam;
    (model as any).getActiveCamera = () => activeCam;
    const updateModelTransform = () => {
      model.position.copy(activeCam.position);
      model.quaternion.copy(activeCam.quaternion);
    };
    updateModelTransform();
    (model as any).updateTransform = updateModelTransform;
    (model as any).setActiveCamera = (c: THREE.PerspectiveCamera | THREE.OrthographicCamera) => {
      activeCam = c;
      helper.camera = c;
      updateModelTransform();
    };

    return { camera: perspCam, orthoCamera: orthoCam, helper, model, bodyMat, lensMat, vfMat };
  }

  /** 切换视角到场景摄像机，或从场景摄像机切回主视角 */
  toggleCameraView(targetCam: THREE.PerspectiveCamera | THREE.OrthographicCamera): boolean {
    const activeId = this.state.activeSceneCameraId$.value;
    const camId = this.findSceneCamId(targetCam);

    if (activeId && activeId === camId) {
      /* 已在该摄像机视角，切回主视角 */
      this.showCameraModel(activeId, true);
      this.restoreMainCamView();
      this.state.activeSceneCameraId$.next(null);
      return false;
    } else {
      /* 先显示之前激活的摄像机模型 */
      if (activeId) this.showCameraModel(activeId, true);
      /* 切换到目标摄像机 */
      this.switchToCamera(targetCam);
      this.state.activeSceneCameraId$.next(camId);
      /* 隐藏目标摄像机模型 */
      if (camId) this.showCameraModel(camId, false);
      return true;
    }
  }

  /** 强制恢复到主摄像机视角 */
  restoreMainCamView(): void {
    /* 显示当前激活的摄像机模型 */
    const activeId = this.state.activeSceneCameraId$.value;
    if (activeId) this.showCameraModel(activeId, true);

    if (!this.savedMainCamPos || !this.savedMainCamTgt) return;
    this.animateCamera(
      this.camera.position.clone(),
      this.controls.target.clone(),
      this.savedMainCamPos,
      this.savedMainCamTgt
    );
    this.savedMainCamPos = undefined;
    this.savedMainCamTgt = undefined;

    /* 恢复主摄像机 FOV */
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.fov = 50;
      this.camera.updateProjectionMatrix();
    }

    /* 恢复 OrbitControls */
    this.controls.enabled = true;
  }

  /** 切换视角到目标摄像机（带动画） */
  switchToCamera(targetCam: THREE.PerspectiveCamera | THREE.OrthographicCamera): void {
    /* 保存当前主视角 */
    this.savedMainCamPos = this.camera.position.clone();
    this.savedMainCamTgt = this.controls.target.clone();

    const cam = this.camera;
    const startPos = cam.position.clone();
    const startTgt = this.controls.target.clone();
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(targetCam.quaternion);
    const endPos = targetCam.position.clone();
    const endTgt = endPos.clone().add(dir);

    this.animateCamera(startPos, startTgt, endPos, endTgt);

    /* 同步 FOV（仅透视摄像机） */
    if (cam instanceof THREE.PerspectiveCamera && targetCam instanceof THREE.PerspectiveCamera) {
      cam.fov = targetCam.fov;
      cam.updateProjectionMatrix();
    }
  }

  private animateCamera(
    startPos: THREE.Vector3, startTgt: THREE.Vector3,
    endPos: THREE.Vector3, endTgt: THREE.Vector3,
    onComplete?: () => void
  ): void {
    const cam = this.camera;
    const ctrl = this.controls;
    const startTime = performance.now();
    const duration = 500;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1.0);
      const ease = 1 - Math.pow(1 - t, 3);
      cam.position.lerpVectors(startPos, endPos, ease);
      ctrl.target.lerpVectors(startTgt, endTgt, ease);
      ctrl.update();
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        onComplete?.();
      }
    };
    requestAnimationFrame(step);
  }

  private findSceneCamId(cam: THREE.PerspectiveCamera | THREE.OrthographicCamera): string | null {
    for (const c of this.state.sceneCameras) {
      if (c.perspCamera === cam || c.orthoCamera === cam || c.camera === cam) return c.id;
    }
    return null;
  }

  private showCameraModel(camId: string, visible: boolean): void {
    const cam = this.state.sceneCameras.find(c => c.id === camId);
    if (cam) {
      cam.model.visible = visible;
      cam.helper.visible = visible && this.state.settings.showCameraHelpers;
    }
  }

  /** 切换场景摄像机的正交/透视模式 */
  setSceneCameraOrtho(sceneCam: SceneCamera, isOrtho: boolean): void {
    if (sceneCam.isOrtho === isOrtho) return;
    sceneCam.isOrtho = isOrtho;

    /* 同步位置和朝向 */
    if (isOrtho) {
      sceneCam.orthoCamera.position.copy(sceneCam.perspCamera.position);
      sceneCam.orthoCamera.quaternion.copy(sceneCam.perspCamera.quaternion);
      sceneCam.camera = sceneCam.orthoCamera;
    } else {
      sceneCam.perspCamera.position.copy(sceneCam.orthoCamera.position);
      sceneCam.perspCamera.quaternion.copy(sceneCam.orthoCamera.quaternion);
      sceneCam.camera = sceneCam.perspCamera;
    }

    /* 更新 helper 和 model 引用 */
    (sceneCam.model as any).setActiveCamera(sceneCam.camera);
    sceneCam.helper.update();

    /* 如果当前正在使用该摄像机视角，更新主摄像机 */
    if (this.state.activeSceneCameraId$.value === sceneCam.id) {
      if (isOrtho && this.camera instanceof THREE.PerspectiveCamera) {
        this.setCameraType('orthographic');
      } else if (!isOrtho && this.camera instanceof THREE.OrthographicCamera) {
        this.setCameraType('perspective');
      }
      this.camera.position.copy(sceneCam.camera.position);
      this.camera.quaternion.copy(sceneCam.camera.quaternion);
      this.controls.object = this.camera;
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
  }
}
