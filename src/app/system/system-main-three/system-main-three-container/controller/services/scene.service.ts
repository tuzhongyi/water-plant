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
import { RenderSettings } from '../models/types';

@Injectable({ providedIn: 'root' })
export class SceneService {
  private zone = inject(NgZone);
  private state = inject(StateService);

  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  composer!: EffectComposer;

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

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 2000);
    this.camera.position.set(5, 3, 7);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 0, 0);
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

    /* Sobel edge detection pass */
    const sobelEffect = new ShaderPass(SobelOperatorShader);
    sobelEffect.uniforms['resolution'].value = new THREE.Vector2(w, h);
    sobelEffect.enabled = false;
    this.sobelPass = sobelEffect;
    this.composer.addPass(this.sobelPass);

    /* FXAA pass */
    this.fxaaPass = new ShaderPass(FXAAShader);
    this.fxaaPass.uniforms['resolution'].value = new THREE.Vector2(1 / w, 1 / h);
    this.fxaaPass.enabled = false;
    this.composer.addPass(this.fxaaPass);

    this.composer.addPass(new OutputPass());
  }

  applySettings(s: RenderSettings): void {
    this.scene.background = new THREE.Color(s.bgColor);
    const fogNear = s.cameraFar * 0.3;
    const fogFar = s.cameraFar * 0.9;
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

    this.camera.near = s.cameraNear;
    this.camera.far = s.cameraFar;
    this.camera.updateProjectionMatrix();
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
    const divs = Math.max(10, Math.floor(sz / 5));
    this.gridHelper = new THREE.GridHelper(sz, divs, 0x444444, 0x222222);
    this.scene.add(this.gridHelper);
  }

  setAxes(show: boolean): void {
    if (show && !this.axesHelper) {
      this.axesHelper = new THREE.AxesHelper(5);
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
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    for (const cb of this.beforeRenderCallbacks) cb();
    this.controls.update();

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

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
  }
}
