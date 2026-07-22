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
import { LabelMode, RenderSettings } from '../models/types';

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
          entry.labelMode === LabelMode.always ||
          (entry.labelMode === LabelMode.hover && entry.id === this.state.hoveredModelId)
        );
      }
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

    /* composer.setSize 内部会调用 renderer.setSize(w,h) 设置内联 CSS 样式，
     * 覆盖了 CSS 文件中的 width:100%; height:100%，导致全屏切换后画布尺寸异常。
     * 因此先调用 composer.setSize 更新渲染目标，再用 setSize(w,h,false) 重置
     * 绘制缓冲区（不触碰 CSS），最后清除内联样式让 CSS 文件的百分比规则生效。 */
    this.composer.setSize(w, h);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '';
    this.renderer.domElement.style.height = '';
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    for (const cb of this.beforeRenderCallbacks) cb();
    this.controls.update();

    /* label 恒定屏幕大小（与 marker label 一致，labelFontSize = 目标像素高度） */
    const cam = this.camera;
    const globalFontSize = this.state.settings.labelFontSize || 32;
    const rendererH = this.renderer.domElement.clientHeight || 600;
    if (cam instanceof THREE.PerspectiveCamera) {
      const halfFovTan = Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5));
      for (const [sprite, aspect] of this.labelSprites) {
        const fs = sprite.userData['labelFontSize'] ?? globalFontSize;
        const dist = cam.position.distanceTo(sprite.position);
        const viewH = dist * halfFovTan * 2;
        const h = fs * viewH / rendererH;
        sprite.scale.set(h * aspect, h, 1);
      }
    } else {
      const baseFrustum = 20;
      for (const [sprite, aspect] of this.labelSprites) {
        const fs = sprite.userData['labelFontSize'] ?? globalFontSize;
        const viewH = baseFrustum / (cam as THREE.OrthographicCamera).zoom;
        const h = fs * viewH / rendererH;
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

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
  }
}
