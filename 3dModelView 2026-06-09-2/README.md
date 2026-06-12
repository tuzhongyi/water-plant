# 3D Model Viewer

基于 Angular 19 + Three.js 的 3D 模型查看器，支持多格式模型加载、场景摄像机、颜色状态管理和配置持久化。

## 开发

```bash
ng serve          # 启动前端开发服务器 (localhost:4200)
python server.py  # 启动后端 API (localhost:8080)
ng build          # 生产构建
```

---

## 2026-06-08 更新

### 一、Per-Model Label 控制

将模型 Label 的控制从全局设置迁移到每个模型独立控制，提供更精细的调节能力。

#### UI 变更

- **info-card 新增 Label 控件**：选中模型后，在 info-card 中可设置：
  - **Label 文本** — 自定义显示的标签文字（默认使用文件名）
  - **显示 Label** — 复选框，控制该模型标签的显示/隐藏
  - **Label 高度** — 滑块 (0.1~10)，控制标签在模型上方的偏移高度
  - **Label 文字大小** — 滑块 (5~80)，控制标签文字的屏幕大小
- **移除 right-panel 全局 Label 控件**：环境渲染设置中不再显示 `showLabels`、`labelFontSize`、`labelHeight`，这些字段从 `config.json` 保存中剥离

#### 类型变更

- `types.ts`:
  - `ModelEntry` 新增 `labelFontSize?: number`
  - `ModelTransformConfig` 新增 `label?: string`、`labelFontSize?: number`

#### 持久化

- **models_config.json** 中每个模型的配置增加字段：`label`、`labelVisible`、`labelPerHeight`、`labelFontSize`
- 保存 (`saveConfig`) 和导出 (`exportConfig`) 均序列化上述字段
- 刷新页面后通过 `autoLoadModels()` 恢复，并调用 `updateLabel()` 重新渲染

#### 渲染变更

- `model.service.ts`:
  - `updateLabel()` — 将 `entry.labelFontSize` 存入 `sprite.userData['labelFontSize']`
  - `applyTransformConfig()` — 恢复 `label`、`labelVisible`、`labelPerHeight`、`labelFontSize`
- `scene.service.ts`:
  - animate 循环中每个 label sprite 独立读取 `userData['labelFontSize']`，未设置时回退到全局 `labelFontSize` 默认值
- `showLabels` 默认值从 `false` 改为 `true`（`constants.ts` 和 `server.py`），确保 per-model 控制正常生效

---

### 二、Per-Model 锁定功能

每个模型可以独立锁定，锁定后该模型在 3D 视图中不响应鼠标悬停和点击，只能从左侧已加载模型列表中选中。

#### UI 变更

- **info-card**：card-header 中增加 🔒/🔓 切换按钮，点击切换当前选中模型的锁定状态
- **left-panel**：已加载模型列表中每个模型名称前增加锁定图标（🔒/🔓），点击可切换锁定状态

#### 类型变更

- `types.ts`:
  - `ModelEntry` 新增 `locked: boolean`
  - `ModelViewerModel` 新增 `locked?: boolean`

#### 实现细节

- `model.service.ts`：初始化 `locked: false`
- `ModelViewerComponent` (`model-viewer.component.ts`):
  - `InternalModelState` 新增 `locked` 字段
  - `syncModels()` — 创建新模型时初始化 `locked`，更新已有模型时同步 `locked` 状态
  - `getAllMeshes()` — 跳过 `locked=true` 的模型，使其不被 raycaster 命中（hover/click/dblclick 均不触发）
- `ThreeViewerComponent` (`three-viewer.component.ts`):
  - `viewerModels` 映射中包含 `locked: e.locked`
  - `onModelClick()` — 双重保险，检查 `entry.locked`
  - `bindCanvasClick()` — 模型检测跳过 locked 模型，点击锁定模型视为空白区域
- `StateService` (`state.service.ts`):
  - 不需要额外的全局锁定状态（per-model lock 取代了全局 lock）

---

### 三、模型 ID 改为文件名

- `model.service.ts`：移除自增计数器 `idCounter` 和 `nextModelId()` 函数
- 模型 ID 直接使用文件名（如 `model.glb`），在 `loadedModels` Map 中天然去重，同一文件不会重复加载

---

### 四、文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/app/models/types.ts` | 修改 | `ModelEntry` 增加 `labelFontSize`、`locked`；`ModelTransformConfig` 增加 `label`、`labelFontSize`、`locked`；`ModelViewerModel` 增加 `locked` |
| `src/app/models/constants.ts` | 修改 | `showLabels` 默认值 `false` → `true` |
| `server.py` | 修改 | `showLabels` 默认值 `False` → `True` |
| `src/app/services/state.service.ts` | 修改 | 新增/移除全局 `modelSelectLocked$`（最终使用 per-model lock，不需要全局状态） |
| `src/app/services/model.service.ts` | 修改 | 初始化 `locked: false`；`updateLabel()` 存储 `labelFontSize`；`applyTransformConfig()` 恢复 label 设置 |
| `src/app/services/config.service.ts` | 修改 | `saveConfig`/`exportConfig` 序列化 `label`、`labelFontSize`；`autoLoadModels` 恢复 label 设置并重新渲染 |
| `src/app/services/scene.service.ts` | 修改 | animate 循环中 per-sprite 独立 `labelFontSize` |
| `src/app/components/info-card/info-card.component.ts` | 修改 | 新增 Label 文字大小滑块、Label 文本输入、锁定切换按钮 |
| `src/app/components/left-panel/left-panel.component.ts` | 修改 | 已加载模型列表增加锁定图标 |
| `src/app/components/model-viewer/model-viewer.component.ts` | 修改 | `InternalModelState` 增加 `locked`；`getAllMeshes()` 过滤 locked 模型 |
| `src/app/components/three-viewer/three-viewer.component.ts` | 修改 | viewerModels 同步 `locked`；点击/悬停双重检查锁定状态 |
| `README.md` | 修改 | 本文档 |

---

## 2026-06-09 更新

### 一、ThreeViewerComponent 与服务层完全解耦

将 `ThreeViewerComponent` 从 ~457 行精简到 ~57 行，作为一个最小化的 canvas shell。它不再注入 `StateService`、`NgZone` 等任何服务（仅保留 `SceneService`），所有数据和事件通过 `ModelViewerComponent` 的 signal inputs/outputs 传递。

#### ThreeViewerComponent 当前职责

- 注入 `SceneService`，提供 `<canvas>` 元素
- `ngAfterViewInit` 中调用 `sceneService.init(container, canvas)` 初始化渲染器
- `ngOnDestroy` 中调用 `sceneService.dispose()` 清理资源
- 嵌入 `<app-model-viewer #mv [shared]="true" />` 作为子组件
- 通过模板引用 `mv.activeCamId()` 读取子组件暴露的 `activeCamId` 信号，显示/隐藏摄像机操控提示卡片（WASD 移动、鼠标旋转/平移）

#### 移除的内容

从 `ThreeViewerComponent` 中移除以下全部代码：

| 移除内容 | 说明 |
|----------|------|
| `StateService` 注入 | 不再直接依赖状态服务 |
| `NgZone` 注入 | 不再需要 `runOutsideAngular` |
| `bindSubscriptions()` | 所有 RxJS 订阅（`selectedSceneCameraId$`、`activeSceneCameraId$`、`sceneCameras$`、`loadedModelList$`、`settings$`）全部迁移到 `ModelViewerComponent.bindSharedSubscriptions()` |
| `bindCanvasClick()` | canvas 点击/右键菜单/悬停事件绑定迁移到 `ModelViewerComponent.bindEvents()` |
| `applyCameraColor()` | 摄像机颜色状态切换迁移到 `ModelViewerComponent` |
| `showCameraBBox()` / `hideCameraBBox()` | 摄像机包围盒管理迁移到 `ModelViewerComponent` |
| `camBBoxUpdate` | 包围盒每帧更新回调迁移到 `ModelViewerComponent` |
| `subCamSync` | 子摄像机视角同步 + WASD 移动迁移到 `ModelViewerComponent` |
| `initCameraTransformControls()` | 摄像机 TransformControls 初始化迁移到 `ModelViewerComponent` |
| `enterCameraEditMode()` / `exitCameraEditMode()` | 摄像机编辑模式进入/退出迁移到 `ModelViewerComponent` |
| `detachCameraTransform()` | TransformControls detach 清理迁移到 `ModelViewerComponent.ngOnDestroy()` |
| `@HostListener` keydown/keyup | 键盘快捷键处理迁移到 `ModelViewerComponent.onKeyDown/onKeyUp` |
| `viewerModels` / `viewerDisplayParams` | 数据桥接变量移除，`ModelViewerComponent` 现在直接从 `loadedModelList$` 同步模型 |
| `activeCamId` 字段 | 改为 `ModelViewerComponent` 的 public signal，父组件通过模板引用读取 |
| `pressedKeys` / `hoveredCamId` / `subCamSyncAdded` | 所有摄像机相关状态迁移到 `ModelViewerComponent` |

### 二、ModelViewerComponent 成为完整编排层

`ModelViewerComponent`（~1208 行）现在承载了全部 3D 场景交互逻辑，作为 `ThreeViewerComponent` 和 `StateService` 之间的唯一桥梁。

#### 组件架构

```
ThreeViewerComponent (thin shell, ~57 行)
├── <canvas> — SceneService.init()
└── <app-model-viewer #mv [shared]="true" />
    ├── 模型加载/同步 (syncModels)
    ├── 模型包围盒 (showBBox/hideBBox/showAllBBox/hideAllBBox)
    ├── 摄像机包围盒 (showCameraBBox/hideCameraBBox/camBBoxUpdate)
    ├── Raycaster 交互
    │   ├── 模型 hover/click/double-click 检测
    │   └── 摄像机 hover/click 检测
    ├── TransformControls (两套)
    │   ├── 模型编辑 (平移/旋转/缩放) + toolbar UI
    │   └── 摄像机编辑 (仅平移)
    ├── 键盘快捷键 (@HostListener)
    │   ├── 摄像机: G(编辑), Escape(退出)
    │   ├── 模型: G/W/E/R/Esc/Delete/F
    │   └── 子摄像机视角: WASD 移动
    ├── 子摄像机视角同步 (subCamSync)
    ├── 颜色状态管理 (applyCameraColor/applyHighlight)
    ├── 聚焦 (focusOnEntry)
    └── 所有 StateService 订阅 (bindSharedSubscriptions)
```

#### shared 模式

`ModelViewerComponent` 支持两种工作模式：

| 模式 | `[shared]` | 场景来源 | 相机来源 | 渲染循环 |
|------|-----------|----------|----------|----------|
| **独立模式** | `false` | 自建 `THREE.Scene` | 自建 `PerspectiveCamera` | 自有 `animate()` 循环 |
| **共享模式** | `true` | `SceneService.scene` | `SceneService.camera` | 由 `SceneService` 驱动 |

在共享模式下（当前 `ThreeViewerComponent` 使用的模式），`ModelViewerComponent`：
- 复用 `SceneService` 的场景、渲染器、相机、OrbitControls
- 绑定到 `sceneService.renderer.domElement` 上处理鼠标事件
- `syncModels` effect 跳过（模型由 `loadedModelList$` 订阅驱动）
- 模型清理时不 dispose geometry/material（由 SceneService 统一管理）

#### 新增 Public API

| 成员 | 类型 | 说明 |
|------|------|------|
| `activeCamId` | `signal<string \| null>` | 当前活跃的子摄像机 ID，供父组件通过模板引用 `mv.activeCamId()` 读取 |
| `editMode` | `boolean` | 模型编辑模式是否激活 |
| `transformMode` | `'translate' \| 'rotate' \| 'scale'` | 当前变换模式 |
| `setTransformMode()` | method | 切换变换模式 |
| `selectEntry()` | method | 选中模型（应用颜色 + 包围盒） |
| `deselectAll()` | method | 取消所有选中 |
| `focusOnEntry()` | method | 聚焦到指定模型 |
| `showBBox()` | method | 为单个 ModelEntry 显示包围盒 |
| `showAllBBox()` | method | 显示所有模型和摄像机的包围盒 |
| `hideAllBBox()` | method | 隐藏所有包围盒 |
| `addBeforeRender()` | method | 注册每帧回调 |
| `removeBeforeRender()` | method | 移除每帧回调 |
| `getModelGroup()` | method | 获取模型的 THREE.Group |
| `camera` | getter | 获取 PerspectiveCamera |
| `rendererDomElement` | getter | 获取 canvas DOM 元素 |
| `controls` | getter | 获取 OrbitControls |
| `threeScene` | getter | 获取 THREE.Scene |

#### 状态订阅详情 (`bindSharedSubscriptions`)

| 订阅源 | 处理逻辑 |
|--------|----------|
| `editMode$` | 同步编辑模式标志到 `this.editMode` |
| `selectedModelId$` | 自动进入/退出模型编辑模式 |
| `editInputs$` | 响应外部变换输入（来自 info-card），调用 `modelService.applyTransform()` |
| `settings$` | 包围盒总开关切换 (`showAllBBox`/`hideAllBBox`)；更新两个 TransformControls 的 camera 引用 |
| `selectedSceneCameraId$` | 应用摄像机颜色 (selected/normal)；自动进入/退出摄像机编辑模式 |
| `activeSceneCameraId$` | 设置 `activeCamId` signal；添加/移除 `subCamSync` 每帧回调 |
| `sceneCameras$` | 新摄像机自动显示包围盒（如果 `showBBox` 开启） |
| `loadedModelList$` | 转换为 `ModelViewerModel[]` 并调用 `syncModels()`；新模型自动显示包围盒 |

#### 模型点击/悬停流程

```
canvas click
  → raycaster.intersectObjects(所有非锁定模型的 mesh)
    → 命中: selectEntry() + emit modelClick + 取消摄像机选中
    → 未命中: 检测摄像机 model
      → 命中摄像机: deselectAll() + emit selectedSceneCameraId
      → 空白区域: deselectAll() + 取消摄像机选中

canvas pointermove
  → 模型 hover 检测 → applyHighlight / colorsService.applyStateColors
  → 摄像机 hover 检测 → applyCameraColor
```

#### 键盘快捷键处理流程

```
document:keydown
  → 子摄像机视角激活 + WASD → pressedKeys.add(key)
  → 无模型选中:
    ├── G → 进入摄像机编辑模式
    └── Escape → 退出摄像机编辑模式
  → 模型选中:
    ├── G → 进入模型编辑模式
    ├── W/E/R → 切换变换模式 (仅编辑模式下)
    ├── Escape → 退出编辑模式
    ├── Delete/Backspace → 删除模型
    └── F → 聚焦模型
```

### 三、文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/app/components/model-viewer/model-viewer.component.ts` | 重构 | 吸收全部摄像机逻辑、键盘快捷键、TransformControls、状态订阅；暴露 `activeCamId` signal 和 public API；新增 shared 模式和 `bindSharedSubscriptions()` |
| `src/app/components/three-viewer/three-viewer.component.ts` | 重构 | 从 ~457 行精简到 ~57 行；仅注入 `SceneService`；通过模板引用 `mv.activeCamId()` 读取子组件信号 |
| `README.md` | 修改 | 本文档 |

---

## 2026-06-09 更新（二）

### 架构重构：纯 Input/Output 组件 + 智能容器

将组件架构严格对齐 Angular 组件开发规范：**数据 Input 流入、事件 Output 流出、业务逻辑收敛到容器、禁止 ViewChild 跨组件调用**。

#### 新增 ViewerContainerComponent

智能容器组件（~350 行），作为 ModelViewerComponent 和 ControlComponent 的编排层：

```
AppComponent
  └── ViewerContainerComponent (smart orchestrator，注入全部 service)
        ├── ModelViewerComponent (pure, 仅渲染+交互)
        └── ControlComponent (pure, 仅 TransformControls)
```

**ViewerContainerComponent 职责**：
- 注入 `StateService` / `ColorsService` / `ModelService` / `SceneService`
- 订阅全部 BehaviorSubject，转换为 signal 向下传递
- 处理全部业务逻辑：模型选择/颜色状态机/编辑模式/聚焦/键盘动作/摄像机编辑
- 管理两套 TransformControls：模型编辑（委托 ControlComponent）+ 摄像机编辑（直接管理）

#### ModelViewerComponent 纯化

从 833 行精简到 ~330 行，移除全部业务逻辑：

| 移除 | 替代方案 |
|------|----------|
| `StateService` / `ColorsService` / `ModelService` 注入 | 数据通过 `input()` 传入，事件通过 `output()` 派发 |
| `bindSubscriptions()`（8 个 RxJS 订阅） | 移至 ViewerContainerComponent |
| `selectEntry()` / `deselectAll()` | 移至 ViewerContainerComponent |
| `focusOnEntry()` | 移至 ViewerContainerComponent（通过 SceneService 直接操作相机） |
| `doEnterEditMode()` / `doExitEditMode()` | 移至 ViewerContainerComponent |
| `applyCameraColor()` | 移至 ViewerContainerComponent |
| `enterCameraEditMode()` / `exitCameraEditMode()` | 移至 ViewerContainerComponent |
| 模型加载器（GLTFLoader 等 6 个） | 移除（ModelService 已提供） |
| `editMode` / `transformMode` / `editEntryGroup` 信号 | 改为 `input()` 从父组件接收 |

**保留**：SceneService 注入（canvas/scene 初始化）+ NgZone + raycaster 交互 + WASD 移动 + 子摄像机视角同步 + 包围盒管理

#### ControlComponent 纯化

从 ~130 行缩减到 ~110 行，模板清空：

| 移除 | 替代方案 |
|------|----------|
| `@ViewChild(ModelViewerComponent)` | 全部通过 `input()` 接收 |
| 帮助卡片 + 变换工具栏 UI | 移至 ViewerContainerComponent |
| 直接调用 `mv.setTransformMode()` 等 | `modeChange` output 派发到容器 |

**新的 Input/Output 接口**：

| Input | 类型 | 说明 |
|-------|------|------|
| `camera` | `THREE.PerspectiveCamera` | 渲染相机 |
| `rendererDomElement` | `HTMLCanvasElement` | canvas 元素 |
| `controls` | `OrbitControls` | 轨道控制器 |
| `overlayScene` | `THREE.Scene` | 叠加场景（TC gizmo） |
| `editEntryGroup` | `THREE.Group \| null` | 编辑目标 |
| `transformMode` | `'translate' \| 'rotate' \| 'scale'` | 变换模式 |

| Output | 类型 | 说明 |
|--------|------|------|
| `modeChange` | 变换模式 | 工具栏按钮点击 |
| `transformChange` | `{pos, scl, rot}` | 拖拽 gizmo 实时回调 |

#### 全局 Config 兜底机制

新增 `src/app/config/app.config.ts`：

- `AppConfig` 接口：聚合 `RenderSettings` + `ViewPresetConfig` + `ModelColors`
- `APP_CONFIG` InjectionToken：供组件通过依赖注入读取全局默认配置
- `DEFAULT_APP_CONFIG` 常量：全部默认值，来源于 `constants.ts`

**优先级**：`@Input` 传入值 > `APP_CONFIG` InjectionToken 兜底

#### 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/app/config/app.config.ts` | **新增** | 全局配置 InjectionToken + 默认值 |
| `src/app/components/viewer-container/viewer-container.component.ts` | **新增** | 智能容器组件，注入全部服务，编排业务逻辑 |
| `src/app/components/model-viewer/model-viewer.component.ts` | 重构 | 833→330 行，移除 3 个服务注入，改为 `input()`/`output()` |
| `src/app/components/control/control.component.ts` | 重构 | 移除 `@ViewChild`，模板清空，纯逻辑组件 |
| `src/app/app.component.ts` | 修改 | `<app-control />` → `<app-viewer-container />` |
| `README.md` | 修改 | 本文档 |
