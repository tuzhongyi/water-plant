/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 73:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerState = void 0;
var PlayerState;
(function (PlayerState) {
    PlayerState[PlayerState["ready"] = 0] = "ready";
    PlayerState[PlayerState["playing"] = 1] = "playing";
    PlayerState[PlayerState["pause"] = 2] = "pause";
    PlayerState[PlayerState["slow"] = 3] = "slow";
    PlayerState[PlayerState["fast"] = 4] = "fast";
    PlayerState[PlayerState["end"] = 5] = "end";
    PlayerState[PlayerState["opening"] = 6] = "opening";
    PlayerState[PlayerState["closing"] = 7] = "closing";
    PlayerState[PlayerState["frame"] = 8] = "frame";
    PlayerState[PlayerState["closed"] = 255] = "closed";
})(PlayerState = exports.PlayerState || (exports.PlayerState = {}));


/***/ }),

/***/ 91:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerCommand = void 0;
var PlayerCommand;
(function (PlayerCommand) {
    PlayerCommand["stop"] = "stop";
    PlayerCommand["play"] = "play";
    PlayerCommand["seek"] = "seek";
    PlayerCommand["fast"] = "fast";
    PlayerCommand["slow"] = "slow";
    PlayerCommand["pause"] = "pause";
    PlayerCommand["resume"] = "resume";
    PlayerCommand["frame"] = "frame";
    PlayerCommand["resize"] = "resize";
    PlayerCommand["fullscreen"] = "fullScreen";
    PlayerCommand["fullexit"] = "fullExit";
    PlayerCommand["download"] = "download";
    PlayerCommand["speed_resume"] = "speedResume";
    PlayerCommand["capture_picture"] = "capturePicture";
    PlayerCommand["subtitle_text"] = "subtitleText";
    PlayerCommand["subtitle_enabled"] = "subtitleEnabled";
    PlayerCommand["open_sound"] = "openSound";
    PlayerCommand["close_sound"] = "closeSound";
    PlayerCommand["change_rule_state"] = "changeRuleState";
    PlayerCommand["button_click"] = "buttonClick";
    PlayerCommand["get_capture_picture_data"] = "getCapturePictureData";
    PlayerCommand["get_position"] = "getPosition";
    PlayerCommand["get_timer"] = "getTimer";
    PlayerCommand["get_volume"] = "getVolume";
    PlayerCommand["set_volume"] = "setVolume";
    PlayerCommand["on_stoping"] = "onStoping";
    PlayerCommand["on_playing"] = "onPlaying";
    PlayerCommand["on_button_clicked"] = "onButtonClicked";
    PlayerCommand["on_viewer_doubleclicked"] = "onViewerDoubleClicked";
    PlayerCommand["on_viewer_clicked"] = "onViewerClicked";
    PlayerCommand["on_status_changed"] = "onStatusChanged";
    PlayerCommand["on_capture_picture"] = "onCapturePicture";
    PlayerCommand["on_rule_state_changed"] = "onRuleStateChanged";
    PlayerCommand["on_subtitle_enabled_changed"] = "onSubtitleEnableChanged";
    PlayerCommand["get_osd_time"] = "getOsdTime";
    PlayerCommand["on_osd_time"] = "onOsdTime";
})(PlayerCommand = exports.PlayerCommand || (exports.PlayerCommand = {}));


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
__webpack_unused_export__ = void 0;
const player_state_enum_1 = __webpack_require__(73);
const player_command_1 = __webpack_require__(91);
class WSPlayerProxy {
    constructor(iframeId) {
        this.iframeId = iframeId;
        this.status = player_state_enum_1.PlayerState.ready;
        this.messagehandle = this.registevent.bind(this);
        window.addEventListener('message', this.messagehandle);
    }
    iframe() {
        if (typeof this.iframeId === 'string') {
            return document.getElementById(this.iframeId);
        }
        else {
            return this.iframeId;
        }
    }
    postMessage(data) {
        let message = JSON.stringify(data);
        let iframe = this.iframe();
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(message, '*');
        }
        else {
            throw new Error('iframe.contentWindow is null');
        }
    }
    stop() {
        this.postMessage({ command: player_command_1.PlayerCommand.stop });
    }
    play() {
        this.postMessage({ command: player_command_1.PlayerCommand.play });
    }
    seek(value) {
        this.postMessage({ command: player_command_1.PlayerCommand.seek, value: value });
    }
    fast() {
        this.postMessage({ command: player_command_1.PlayerCommand.fast });
    }
    slow() {
        this.postMessage({ command: player_command_1.PlayerCommand.slow });
    }
    capturePicture() {
        this.postMessage({ command: player_command_1.PlayerCommand.capture_picture });
    }
    pause() {
        this.postMessage({ command: player_command_1.PlayerCommand.pause });
    }
    speedResume() {
        this.postMessage({ command: player_command_1.PlayerCommand.speed_resume });
    }
    resume() {
        this.postMessage({ command: player_command_1.PlayerCommand.resume });
    }
    frame() {
        this.postMessage({ command: player_command_1.PlayerCommand.frame });
    }
    fullScreen() {
        this.postMessage({ command: player_command_1.PlayerCommand.fullscreen });
    }
    resize(width, height) {
        this.postMessage({
            command: player_command_1.PlayerCommand.resize,
            width: width,
            height: height,
        });
    }
    fullExit() {
        this.postMessage({ command: player_command_1.PlayerCommand.fullexit });
    }
    download(filename, type) {
        this.postMessage({
            command: player_command_1.PlayerCommand.download,
            filename: filename,
            type: type,
        });
    }
    openSound() {
        this.postMessage({ command: player_command_1.PlayerCommand.open_sound });
    }
    closeSound() {
        this.postMessage({ command: player_command_1.PlayerCommand.close_sound });
    }
    getVolume() {
        this.postMessage({ command: player_command_1.PlayerCommand.get_volume });
    }
    setVolume(value) {
        this.postMessage({ command: player_command_1.PlayerCommand.set_volume, value: value });
    }
    subtitleEnabled(value) {
        this.postMessage({ command: player_command_1.PlayerCommand.subtitle_enabled, value: value });
    }
    setSubtitle(value) {
        this.postMessage({ command: player_command_1.PlayerCommand.subtitle_text, value: value });
    }
    getOSDTime() {
        this.postMessage({ command: player_command_1.PlayerCommand.get_osd_time });
    }
    destroy() {
        window.removeEventListener('message', this.messagehandle);
        if (this.tools) {
            this.tools.destroy();
        }
    }
    destory() {
        this.destroy();
    }
    changeRuleState(value) {
        this.postMessage({ command: player_command_1.PlayerCommand.change_rule_state, value: value });
    }
    registevent(e) {
        if (e && e.data) {
            let data = { command: '', index: '0' };
            try {
                if (typeof e.data === 'string') {
                    data = JSON.parse(e.data);
                }
                else {
                    data = e.data;
                }
            }
            catch (error) {
                console.warn(error, e);
            }
            switch (data.command) {
                case player_command_1.PlayerCommand.on_stoping:
                    console.log(e);
                    if (this.onStoping) {
                        this.onStoping(parseInt(data.index));
                    }
                    break;
                case player_command_1.PlayerCommand.on_playing:
                    if (this.onPlaying) {
                        this.onPlaying(parseInt(data.index));
                    }
                    break;
                case player_command_1.PlayerCommand.get_position:
                    if (this.getPosition) {
                        this.getPosition(parseInt(data.index), parseFloat(data.value));
                    }
                    if (this.tools) {
                        new Promise(() => {
                            var _a;
                            var valStr = parseFloat((_a = data.value) !== null && _a !== void 0 ? _a : '') * 100 + '% 100%';
                            if (this.tools) {
                                this.tools.control.position.style.backgroundSize = valStr;
                            }
                        });
                    }
                    break;
                case player_command_1.PlayerCommand.get_timer:
                    if (this.getTimer) {
                        this.getTimer(parseInt(data.index), data.value);
                    }
                    new Promise(() => {
                        if (this.tools) {
                            this.tools.control.position.min = data.value.min;
                            this.tools.control.position.max = data.value.max;
                            let end = new Date(data.value.max - data.value.min);
                            end.setUTCHours(end.getUTCHours() - 8);
                            this.tools.control.end_time.innerText = end.format('HH:mm:ss');
                            this.tools.control.position.value = data.value.current;
                            let current = new Date(data.value.current - data.value.min);
                            current.setUTCHours(current.getUTCHours() - 8);
                            this.tools.control.begin_time.innerText =
                                current.format('HH:mm:ss');
                        }
                    });
                    break;
                case player_command_1.PlayerCommand.on_button_clicked:
                    if (this.onButtonClicked) {
                        this.onButtonClicked(parseInt(data.index), data.value);
                    }
                    break;
                case player_command_1.PlayerCommand.on_viewer_doubleclicked:
                    if (this.onViewerDoubleClicked) {
                        this.onViewerDoubleClicked(parseInt(data.index));
                    }
                    break;
                case player_command_1.PlayerCommand.on_viewer_clicked:
                    if (this.onViewerClicked) {
                        this.onViewerClicked(parseInt(data.index));
                    }
                    break;
                case player_command_1.PlayerCommand.on_rule_state_changed:
                    if (this.onRuleStateChanged) {
                        this.onRuleStateChanged(parseInt(data.index), data.value);
                    }
                case player_command_1.PlayerCommand.on_status_changed:
                    if (this.onStatusChanged) {
                        this.onStatusChanged(parseInt(data.index), data.value);
                    }
                    break;
                case player_command_1.PlayerCommand.on_subtitle_enabled_changed:
                    if (this.onSubtitleEnableChanged) {
                        this.onSubtitleEnableChanged(parseInt(data.index), data.value);
                    }
                    break;
                case player_command_1.PlayerCommand.on_osd_time:
                    if (this.onOsdTime) {
                        this.onOsdTime(parseInt(data.index), parseInt(data.value));
                    }
                    break;
                default:
                    break;
            }
        }
    }
    toolsBinding(tools) {
        this.tools = tools;
    }
}
__webpack_unused_export__ = WSPlayerProxy;
window.WSPlayerProxy = WSPlayerProxy;

})();

/******/ })()
;
//# sourceMappingURL=WSPlayerProxy.js.map