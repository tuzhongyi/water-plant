
var WSPlayerMode = {
  live: "live",
  vod: "vod"
}
var WSPlayerState = {
  ready: 0,
  playing: 1,
  pause: 2,
  slow: 3,
  fast: 4,
  end: 5,
  opening: 6,
  closing: 7,
  closed: 255
}
function WSPlayerProxy (iframeId) {

  var iframe = function () {
    return document.getElementById(iframeId)
  }
  function postMessage (data) {
    let message = JSON.stringify(data);
    iframe().contentWindow.postMessage(message, '*')
  }

  this.stop = function () {
    postMessage({ command: 'stop' })
  }
  this.play = function () {
    postMessage({ command: 'play' })
  }
  this.seek = function (value) {
    postMessage({ command: 'seek', value: value })
  }
  this.fast = function () {
    postMessage({ command: 'fast' })
  }
  this.slow = function () {
    postMessage({ command: 'slow' })
  }
  this.capturePicture = function () {
    postMessage({ command: 'capturePicture' })
  }
  this.pause = function () {
    postMessage({ command: 'pause' })
  }
  this.speedResume = function () {
    postMessage({ command: 'speedResume' })
  }
  this.resume = function () {
    postMessage({ command: 'resume' })
  }
  this.frame = function () {
    postMessage({ command: 'frame' })
  }
  this.fullScreen = function () {
    postMessage({ command: 'fullScreen' })
  }
  this.resize = function (width, height) {
    postMessage({ command: 'resize', width: width, height: height })
  }
  this.fullExit = function () {
    postMessage({ command: 'fullExit' })
  }
  this.download = function (filename, type) {
    postMessage({ command: 'download', filename: filename, type: type })
  }
  this.openSound = function () {
    postMessage({ command: 'openSound' })
  }
  this.closeSound = function () {
    postMessage({ command: 'closeSound' })
  }
  this.getVolume = function () {
    postMessage({ command: 'getVolume' })
  }
  this.setVolume = function (value) {
    postMessage({ command: 'getVolume', value: value })
  }

  this.destory = function () {
    window.removeEventListener("message", registevent);
    if (that.tools) {
      that.tools.destory();
    }
  }

  this.changeRuleState = function (value) {
    postMessage({ command: "changeRuleState", value: value })
  }


  this.onStoping;
  this.getPosition;
  this.onPlaying;
  this.onButtonClicked;
  this.onViewerDoubleClicked;
  this.onViewerClicked;


  this.tools;

  var that = this;

  function registevent (e) {
    if (e && e.data) {
      let data = {}
      try {
        if (typeof (e.data) === "string") {
          data = JSON.parse(e.data)
        }
        else {
          data = e.data
        }
      } catch (error) {
        console.warn(error, e)
      }

      switch (data.command) {
        case "onStoping":
          console.log(e)
          if (that.onStoping) {
            that.onStoping(parseInt(parseInt(data.index)));
          }
          break;
        case "onPlaying":
          if (that.onPlaying) {
            that.onPlaying(parseInt(data.index));
          }
          break;
        case "getPosition":
          if (that.getPosition) {
            that.getPosition(parseInt(data.index), parseFloat(data.value));
          }
          if (that.tools) {
            (function (val) {
              setTimeout(function () {
                var valStr = parseFloat(val) * 100 + "% 100%";
                that.tools.control.position.style.backgroundSize = valStr;
              })
            })(data.value)
          }
          break;
        case "getTimer":
          if (that.getTimer) {
            that.getTimer(data.value);
          }
          if (that.tools) {
            (function (val) {
              setTimeout(function () {
                that.tools.control.position.min = val.min;
                that.tools.control.position.max = val.max;
                let end = new Date(val.max - val.min);
                end.setUTCHours(end.getUTCHours() - 8);
                that.tools.control.end_time.innerText = end.format("HH:mm:ss");
                that.tools.control.position.value = val.current;
                let current = new Date(val.current - val.min);
                current.setUTCHours(current.getUTCHours() - 8);
                that.tools.control.begin_time.innerText = current.format("HH:mm:ss");
              });
            })(data.value)
          }
          break;
        case "onButtonClicked":
          if (that.onButtonClicked) {
            that.onButtonClicked(parseInt(data.index), data.value);
          }
          break;
        case "onViewerDoubleClicked":
          if (that.onViewerDoubleClicked) {
            that.onViewerDoubleClicked(parseInt(data.index));
          }
          break;
        case "onViewerClicked":
          if (that.onViewerClicked) {
            that.onViewerClicked(parseInt(data.index));
          }
          break;
        case "onRuleStateChanged":
          if (that.onRuleStateChanged) {
            that.onRuleStateChanged(parseInt(data.index), data.value)
          }
        default:
          break;
      }
    }
  }


  window.addEventListener("message", registevent);

  this.toolsBinding = function (tools) {
    that.tools = tools;
  }
  function initTools () {
    if (that.tools.control.play) {
      that.tools.control.play.addEventListener("click", function () {
        switch (that.status) {
          case wsPlayerState.ready:
            that.play();
            break;
          case wsPlayerState.end:
            that.seek(0);
            that.resume();
            break;
          case wsPlayerState.fast:
          case wsPlayerState.slow:
            that.speedResume();
            break;
          case wsPlayerState.pause:
            that.resume();
            break;
          case wsPlayerState.playing:
            if (current_args.mode == wsPlayerMode.vod) {
              that.pause();
            }
            else {
              that.stop();
            }
            break;
          default:
            break;
        }

      });
    }
    if (that.tools.control.stop) {
      that.tools.control.stop.addEventListener("click", function () {
        if (that.status == wsPlayerState.ready)
          return;
        that.stop();
        buttonClick("stop");
      });
    }
    if (that.tools.control.fullscreen) {
      that.tools.control.fullscreen.addEventListener("click", function () {
        if (that.status == wsPlayerState.ready)
          return;
        buttonClick("fullscreen");
      });
    }

    if (that.tools.control.capturepicture) {
      that.tools.control.capturepicture.addEventListener("click", function () {
        if (that.status == wsPlayerState.ready)
          return;
        that.capturePicture();
        buttonClick("capturepicture");
      });
    }

    if (that.tools.control.slow) {
      that.tools.control.slow.addEventListener("click", function () {
        if (that.status == wsPlayerState.ready)
          return;
        that.slow();
        buttonClick("slow");
      });
    }
    if (that.tools.control.fast) {
      that.tools.control.fast.addEventListener("click", function () {
        if (that.status == wsPlayerState.ready)
          return;
        that.fast();
        buttonClick("fast");
      });
    }
    if (that.tools.control.forward) {
      that.tools.control.forward.addEventListener("click", function () {
        if (that.status == wsPlayerState.ready)
          return;
        that.frame();
        buttonClick("forward");
      });
    }
    if (that.tools.control.position) {
      that.tools.control.position.addEventListener("mousedown", function () {
        if (that.status == wsPlayerState.ready)
          return;
        that.pause();
        that.tools.control.isMoudseDown = true;
      });
      that.tools.control.position.addEventListener("mouseup", function () {
        if (that.status == wsPlayerState.ready)
          return;
        that.tools.control.isMoudseDown = false;
        var value = that.tools.control.position.value - that.tools.control.position.min;
        that.seek(value);
        that.resume();
      });
      that.tools.control.position.addEventListener("mousemove", function (evt) {
        if (that.status == wsPlayerState.ready)
          return;
        if (!evt) return;
        var width = evt.target.offsetWidth;
        var x = evt.offsetX;

        var p = x / width;

        var c = that.tools.control.position.max - that.tools.control.position.min;
        var current = c * p;
        if (current < 0)
          current = 0;
        var date = new Date(current);
        date.setUTCHours(date.getUTCHours() - 8);
        this.title = date.format("HH:mm:ss");
        if (that.tools.control.isMoudseDown)
          that.tools.control.begin_time.innerText = date.format("HH:mm:ss");
      });
    }

  }

}
window.WSPlayerProxy = WSPlayerProxy;


function PlayerTools (element, mode) {


  this.control = {
    content: null,
    play: null,
    stop: null,
    pause: null,
    forward: null,
    fast: null,
    slow: null,

    begin_time: null,
    end_time: null,
    position: null,
    fullscreen: null,
    capturepicture: null,

  }


  var tools = document.createElement("div");
  tools.className = "tools";
  //tools.style.display = "none";
  element.appendChild(tools);

  this.control.content = document.createElement("div");
  this.control.content.className = "tools-content"
  tools.appendChild(this.control.content);

  // element.addEventListener("mouseover", function(){
  //     tools.style.display = ""
  // });

  // element.addEventListener("mouseout", function(){
  //     tools.style.display = "none"
  // });
  display = false;


  var that_tools = this;

  this.destory = function () {
    element.parentElement.removeChild(element);
  }

  function createElement (ul, type, li_styles, ctr_params, ctr_styles) {
    var li = document.createElement("li");
    if (li_styles) {
      for (const key in li_styles) {
        li.style[key] = li_styles[key];
      }
    }
    ul.appendChild(li);


    var ctr = document.createElement(type);
    if (ctr_params) {
      for (const key in ctr_params) {
        ctr[key] = ctr_params[key]
      }
    }
    if (ctr_styles) {
      for (const key in ctr_styles) {
        ctr.style[key] = ctr_styles[key];
      }
    }
    li.appendChild(ctr);
    return ctr;
  }





  this.createElements = function () {
    var ul = document.createElement("ul");
    that_tools.control.content.appendChild(ul);


    that_tools.control.play = createElement(ul, "a", { width: "40px" }, { className: "play glyphicon glyphicon-play", title: "播放" });

    //that_tools.control.stop = createElement(ul, "a", {}, { className: "stop glyphicon glyphicon-stop", title: "停止" });
    //that_tools.control.pause = createElement(ul, "a", {}, { className: "pause glyphicon glyphicon-pause", title: "暂停" });
    that_tools.control.slow = createElement(ul, "a", {}, { className: "slow glyphicon glyphicon-backward", title: "慢放" });
    that_tools.control.fast = createElement(ul, "a", {}, { className: "fast glyphicon glyphicon-forward", title: "快进" });
    //that_tools.control.forward = createElement(ul, "a", {}, { className: "glyphicon glyphicon glyphicon-eject", title: "单帧进" });


    that_tools.control.begin_time = createElement(ul, "label", { width: "60px" }, {
      className: "begin_time",
      innerText: "00:00:00",
      title: "当前时间"
    });
    that_tools.control.position = createElement(ul, "input", { width: "calc(100% - 371px)" }, {
      className: "position",
      title: "00:00:00",
      type: "range"
    });
    that_tools.control.end_time = createElement(ul, "label", { width: "60px" }, { className: "end_time", title: "结束时间", innerText: "00:00:00", });




    that_tools.control.fullscreen = createElement(ul, "a", { float: "right" }, { className: "fullscreen glyphicon glyphicon-fullscreen", title: "全屏" });
    that_tools.control.capturepicture = createElement(ul, "a", { float: "right" }, { className: "capturepicture glyphicon glyphicon-picture", title: "截图" });


    if (mode == WSPlayerMode.live) {
      //that_tools.control.stop.style.display = "none";
      that_tools.control.slow.style.display = "none";
      that_tools.control.fast.style.display = "none";
      //that_tools.control.forward.style.display = "none";



      that_tools.control.begin_time.style.display = "none";
      that_tools.control.position.style.display = "none";
      that_tools.control.end_time.style.display = "none";

    }


    that_tools.control.position.addEventListener("input", function () {
      var value = (this.value - this.min) / (this.max - this.min);

      var valStr = value * 100 + "% 100%";
      this.style.backgroundSize = valStr;
    });

  };

  this.binding = function (player) {

    player.getPosition = function (val) {
      console.log(val);
      //that_tools.control.position.value = val;
      var valStr = parseFloat(val) * 100 + "% 100%";
      that_tools.control.position.style.backgroundSize = valStr;
    }
    player.getTimer = function (val) {
      console.log(val);
      that_tools.control.position.min = val.min;
      that_tools.control.position.max = val.max;
      that_tools.control.end_time.innerText = new Date(val.max - val.min).format("HH:mm:ss");
      that_tools.control.position.value = val.current;
      that_tools.control.begin_time.innerText = new Date(val.current - val.min).format("HH:mm:ss");
    }
  }

}


