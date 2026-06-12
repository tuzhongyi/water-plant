#!/usr/bin/env python3
"""HTTP server for 3D Model Viewer.

Usage: python3 server.py [port]

Serves viewer.html + model files from the project directory,
and provides /api/models endpoint listing files under models/.
"""

import json
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socket import SOL_SOCKET, SO_REUSEADDR

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(SCRIPT_DIR, "models")
DIST_DIR = os.path.join(SCRIPT_DIR, "dist", "browser")
CONFIG_PATH = os.path.join(SCRIPT_DIR, "config.json")
MODELS_CONFIG_PATH = os.path.join(SCRIPT_DIR, "models_config.json")
SCENE_CAMERAS_PATH = os.path.join(SCRIPT_DIR, "scene_cameras.json")
CONFIG_DOC_PATH = os.path.join(SCRIPT_DIR, "config.json.txt")
MODELS_CONFIG_DOC_PATH = os.path.join(SCRIPT_DIR, "models_config.json.txt")
SUPPORTED = {".glb", ".gltf", ".obj", ".fbx", ".stl", ".ply", ".dae"}

DEFAULT_SETTINGS = {
    "renderMode": "solid",
    "edgeLineWidth": 1.0,
    "thresholdAngle": 1,
    "solidOpacity": 1.0,
    "wfOpacity": 0.9,
    "bgColor": "#000000",
    "ambientIntensity": 2.5,
    "keyIntensity": 3.0,
    "fillIntensity": 1.0,
    "hemiIntensity": 1.2,
    "showGrid": False,
    "showAxes": False,
    "showCenterDot": False,
    "showBBox": False,
    "autoRotate": False,
    "flatShading": False,
    "sobel": False,
    "bloom": False,
    "fxaa": False,
    "edgeSeeThrough": False,
    "solidSeeThrough": False,
    "bloomThreshold": 0.6,
    "bloomStrength": 1.5,
    "bloomRadius": 0.4,
    "showCameraHelpers": True,
    "cameraNear": 0.1,
    "cameraFar": 2000,
    "cameraType": "perspective",
    "showLabels": True,
    "labelFontSize": 25,
    "labelHeight": 0.6,
    "viewPreset": "medium",
    "camPos": {"x": 5, "y": 3, "z": 7},
    "camTgt": {"x": 0, "y": 0, "z": 0},
}

CONFIG_DOC = """========================================
渲染环境设置 (config.json)
========================================

renderMode     - 渲染模式: solid / edges / overlay
edgeLineWidth  - 边缘粗细
thresholdAngle - 硬边阈值 (度)
solidOpacity   - 实体透明度 (0-1)
wfOpacity      - 线框透明度 (0-1)
bgColor        - 背景颜色 (hex)
ambientIntensity - 环境光强度
keyIntensity   - 主光源强度
fillIntensity  - 补光强度
hemiIntensity  - 半球光强度
showGrid       - 显示网格
showAxes       - 显示坐标轴
showCenterDot  - 显示中心点
showBBox       - 显示包围盒
autoRotate     - 自动旋转
flatShading    - 平面着色
sobel          - Sobel 边缘检测后处理
bloom          - 泛光效果
fxaa           - FXAA 抗锯齿
edgeSeeThrough - 边缘穿透显示
solidSeeThrough - 实体穿透显示
bloomThreshold - 泛光阈值
bloomStrength  - 泛光强度
bloomRadius    - 泛光半径
cameraNear     - 摄像机近裁面
cameraFar      - 摄像机远裁面
cameraType     - 相机类型: perspective / orthographic
showLabels     - 显示模型标签
labelFontSize  - 标签文字大小 (10-50)
labelHeight    - 标签高度偏移 (0.1-10)
viewPreset     - 视图大小: small / medium / large
camPos         - 相机位置 {x, y, z}
camTgt         - 相机目标 {x, y, z}
"""

MODELS_CONFIG_DOC = """========================================
模型配置 (models_config.json)
========================================

每个模型独立的变换参数和颜色，key 为模型文件名

name           - 模型文件名
position       - 位置 {x, y, z}
scale          - 缩放 {x, y, z}
rotation       - 旋转 {h, p, b} (度)
colors         - 颜色状态
  normal       - 默认状态
  hover        - 鼠标悬停状态
  selected     - 选中状态
  每个状态包含:
    .edge      - 边缘颜色 (hex)
    .background - 背景发光颜色 (hex)
materialColors - 每材质颜色 {材质名: {normal, hover, selected}} (hex)
meshVisibility - mesh 可见性 {mesh名: true/false}
"""


class ReuseHTTPServer(HTTPServer):
    allow_reuse_address = True

    def server_bind(self):
        self.socket.setsockopt(SOL_SOCKET, SO_REUSEADDR, 1)
        super().server_bind()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        serve_dir = DIST_DIR if os.path.isdir(DIST_DIR) else SCRIPT_DIR
        kwargs.setdefault("directory", serve_dir)
        super().__init__(*args, **kwargs)

    def do_GET(self):
        if self.path == "/api/models":
            self._api_models()
        elif self.path == "/api/config":
            self._api_get_config()
        elif self.path == "/":
            self.send_response(302)
            self.send_header("Location", "/index.html")
            self.end_headers()
        elif self.path.startswith("/models/") or self.path.startswith("/draco/"):
            self._serve_static_from_root()
        else:
            super().do_GET()

    def _serve_static_from_root(self):
        filepath = os.path.join(SCRIPT_DIR, self.path.lstrip("/"))
        if os.path.isfile(filepath):
            with open(filepath, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Length", len(data))
            self.end_headers()
            self.wfile.write(data)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/api/config":
            self._api_save_config()
        elif self.path == "/api/models/scan":
            self._api_models_scan()
        else:
            self.send_response(404)
            self.end_headers()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def _api_models(self):
        json_path = os.path.join(MODELS_DIR, "models.json")
        files = []
        if os.path.isfile(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    files = json.load(f)
            except (json.JSONDecodeError, OSError):
                pass
        self._send_json(files)

    def _api_models_scan(self):
        files = []
        if os.path.isdir(MODELS_DIR):
            for name in os.listdir(MODELS_DIR):
                ext = os.path.splitext(name)[1].lower()
                if ext in SUPPORTED and os.path.isfile(os.path.join(MODELS_DIR, name)):
                    files.append({
                        "name": name,
                        "size": os.path.getsize(os.path.join(MODELS_DIR, name)),
                        "ext": ext,
                    })
        files.sort(key=lambda f: f["name"].lower())

        json_path = os.path.join(MODELS_DIR, "models.json")
        try:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(files, f, ensure_ascii=False, indent=2)
        except OSError:
            pass

        self._send_json(files)

    def _send_json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    # ---- JSON 文件读写 ----

    @staticmethod
    def _load_json(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def _dump_json(data, f):
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    @staticmethod
    def _ensure_file(path, default_data):
        if not os.path.isfile(path):
            try:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(default_data, f, ensure_ascii=False, indent=2)
                    f.write("\n")
            except OSError:
                pass

    @staticmethod
    def _ensure_doc(path, content):
        if not os.path.isfile(path):
            try:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
            except OSError:
                pass

    # ---- /api/config GET ----

    def _api_get_config(self):
        self._ensure_file(CONFIG_PATH, DEFAULT_SETTINGS)
        self._ensure_file(MODELS_CONFIG_PATH, {})
        self._ensure_file(SCENE_CAMERAS_PATH, [])
        self._ensure_doc(CONFIG_DOC_PATH, CONFIG_DOC)
        self._ensure_doc(MODELS_CONFIG_DOC_PATH, MODELS_CONFIG_DOC)

        try:
            settings = {**DEFAULT_SETTINGS, **self._load_json(CONFIG_PATH)}
        except (json.JSONDecodeError, OSError):
            settings = dict(DEFAULT_SETTINGS)

        try:
            models = self._load_json(MODELS_CONFIG_PATH)
        except (json.JSONDecodeError, OSError):
            models = {}

        try:
            scene_cameras = self._load_json(SCENE_CAMERAS_PATH)
        except (json.JSONDecodeError, OSError):
            scene_cameras = []

        data = {"settings": settings, "models": models, "sceneCameras": scene_cameras}
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    # ---- /api/config POST ----

    def _api_save_config(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            return
        ok = True
        if "settings" in data:
            try:
                with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                    self._dump_json(data["settings"], f)
                self._ensure_doc(CONFIG_DOC_PATH, CONFIG_DOC)
            except OSError:
                ok = False
        if "models" in data:
            try:
                with open(MODELS_CONFIG_PATH, "w", encoding="utf-8") as f:
                    self._dump_json(data["models"], f)
                self._ensure_doc(MODELS_CONFIG_DOC_PATH, MODELS_CONFIG_DOC)
            except OSError:
                ok = False
        if "sceneCameras" in data:
            try:
                with open(SCENE_CAMERAS_PATH, "w", encoding="utf-8") as f:
                    self._dump_json(data["sceneCameras"], f)
            except OSError:
                ok = False
        if not ok:
            self.send_response(500)
            self.end_headers()
            return
        body = json.dumps({"ok": True}, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        msg = fmt % args
        sys.stdout.write("[%s] %s\n" % (self.log_date_time_string(), msg))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    os.makedirs(MODELS_DIR, exist_ok=True)

    server = ReuseHTTPServer(("0.0.0.0", port), Handler)
    print(f"http://localhost:{port}/index.html")
    print(f"Models dir: {MODELS_DIR}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDone.")
        server.server_close()


if __name__ == "__main__":
    main()
