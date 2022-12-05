const modulesmgr = require('../basic/modulesmgr');
const cssmgr = modulesmgr.get('video/cssmgr');

const customCtrlID = "customCtrlWidget";
const nextBtnID = "nextBtnWidget";
const prevBtnID = "prevBtnWidget";
const videoListID = "videoListWidget";
const playerID = "player"
const rand = Math.floor(Math.random() * 1000);

function addListener(e, event, h) {
  if(e.addEventListener) {
      e.addEventListener(event, h, false);
  } else if(e.attachEvent) {
      e.attachEvent('on' + event, h);
  } else {
      e['on' + event] = h;
  }
};
function newDiv(p, t, h, c, id) {
  var nd = document.createElement(t);
  if(h && h != "") nd.innerHTML = h;
  if(c && c != "") nd.className = c;
  if(id) nd.id = id;
  p.appendChild(nd);
  return nd;
};

let MakeOneWidget_ = function(options) {
  var styles = null;
  var _videoIds = [];

  var _container = null;
  var _carouselWrapper = null;
  var _playerWrapper = null;
  var _playerContainer = null;
  var _closeBtn = null;
  var _sliderObj = null;
  
  var _nextBtn = null;
  var _prevBtn = null;
  var _playlistReadyResolve = null;
  var _playerReadyResolve = null;
  var _playlistReadyProm = null;
  var _playerReadyProm = null; 
  var _sliderReadyResolve = null;
  var _sliderReadyProm = null; 
  var _player = null;

  var _observer = null;
  var IRThreshold_ = 0.1;
  var _floatClosed = false;
  var _floatWidth = 400;
  var _floatVMargin = 10;
  var _floatHMargin = 10;
  var _pDiv = null;

  const _playlistAPI = "https://jx-dam-api-express.azurewebsites.net/api/public/list?page=1&limit=15&parts=metadata,thumbnails&collection_ids=1002";
  const _playlistResponse = {
    response: "data",
    id: "id",
    title: "title",
    duration: "duration",
    date: "createdon",
    image: "thumbnails"
  }
    
  function _playOneVideoFcn(videoId) {
    _player.play(videoId)
  }     
  var jxPlayerCfg1 = {
    "autoplay" : "wifi",
    //"ads": {
      //"unit": "1000114-qEgXGqRpBy" //<--- need to be from outside
    //},
    "restrictions": {
      "maxheight": 480
    },
    "controls": {
      "color": "#FFFFFF",
      "backgroundcolor": "#1B63D4",
      "bigplaybutton": "simple",
      "font": "Roboto"
    },
    "soundindicator": {
      "style":"timer",
      "duration":0,
      "position": "bottom-left",
      "text":"Tap to unmute"
    }
  };
  const merge = (target, source) => {
    // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object) Object.assign(source[key], merge(target[key], source[key]))
    }
  
    // Join `target` and modified `source`
    Object.assign(target || {}, source)
    return target
  }
  merge(jxPlayerCfg1, options);
  jxPlayerCfg1.container = `${playerID}-${rand}`;

  function cbOnVideoChanged(evtname, videoId) {
    _setActiveItem(videoId);
  }

  function initPlayer() {
    _player = JX.player(jxPlayerCfg1);
    _player.addListener("ready", function() {
      if (_getVideoHeight()) _playerContainer.style.height = _getVideoHeight() + "px";
    });
    _player.addListener("videochange", cbOnVideoChanged);

    _player.addListener("ad_started", function(){
      _closeBtn.classList.add(styles.hide);
      _setDisableWidget(true);

    });
    _player.addListener("ad_ended", function(){
      _closeBtn.classList.remove(styles.hide);
      _setDisableWidget(false);
    });
  }

  function _listenScroll(e) {
    e.forEach(function(x) {
      if (x.intersectionRatio >= IRThreshold_) {
        _stopFloat();
      } else {
        _setFloat();
      }
    });
  }

  function _setFloat() {
    if (!_floatClosed) {
      _pDiv.classList.remove(styles.hide);
      _closeBtn.classList.remove(styles.hide);
      _playerContainer.classList.add(styles.float);
      _playerContainer.style.width = _floatWidth + "px";
      _playerContainer.style.right = _floatHMargin + "px";
      _playerContainer.style.bottom = _floatVMargin + "px";
      _playerContainer.style.height = _getVideoHeight(_floatWidth) + "px";
    }
  }

  function _stopFloat() {
    _pDiv.classList.add(styles.hide);
    _closeBtn.classList.add(styles.hide);
    _playerContainer.classList.remove(styles.float);
    _playerContainer.style.removeProperty("width");
    _playerContainer.style.removeProperty("right");
    _playerContainer.style.removeProperty("bottom");
    _playerContainer.style.height = _getVideoHeight() + "px";
  }

  function _getVideoHeight(_forceWidth = null) {
    if (_player.getRatio) {
      videoAR = _player.getRatio();
      if (!videoAR) videoAR = 16/9;
    }
    if (!_forceWidth) {
      return _playerContainer.offsetWidth / videoAR;
    } else {
      return _forceWidth / videoAR;
    }
  }

  function _onCloseBtnClick() {
    _floatClosed = true;
    _stopFloat();
    if (_observer) _observer.disconnect();
  }

  function loadSliderScriptP(resolve) {
    if (window.tns) { resolve(); return; }
      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      document.getElementsByTagName('head')[0].appendChild(link);
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.4/tiny-slider.css';
  
      var tag = document.createElement("script");
      var fst = document.getElementsByTagName("script")[0];
      fst.parentNode.insertBefore(tag, fst);
      tag.onload = function() {
        resolve();
      };
      tag.src = "https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.2/min/tiny-slider.js";
  }
  function loadPlayerScriptP(resolve) {
    if (window.JX) { resolve(); return; }
      var tag = document.createElement("script");
      var fst = document.getElementsByTagName("script")[0];
      fst.parentNode.insertBefore(tag, fst);
      tag.onload = function() {
        resolve();
      };
      tag.src = "https://scripts.jixie.media/jxvideo.3.1.min.js";
      //tag.src = "https://jixie-creative-debug.s3.ap-southeast-1.amazonaws.com/universal-component/jxvideo.3.1.min.js"; // test script
  }
  function initSliderObj() {
    _sliderObj = tns({
      container: `#${videoListID}-${rand}`,
      items: 3,
      slideBy: 1,
      nav: false,
      controlsContainer: `#${customCtrlID}-${rand}`,
      lazyload: true
    });
  }
  function FactoryOneWidget(options) {
    _getVideoList(); //fire this out asap so that this can start to get the play list
    _sliderReadyProm = new Promise(function(resolve) { _sliderReadyResolve = resolve; });
    loadSliderScriptP(_sliderReadyResolve);
    _playlistReadyProm = new Promise(function(resolve) { _playlistReadyResolve = resolve; });
    _playerReadyProm = new Promise(function(resolve) { _playerReadyResolve = resolve; });
    loadPlayerScriptP(_playerReadyResolve);

    if (options.container) {
      styles = cssmgr.getRealCls(options.container)
      _container = document.getElementById(options.container);

      if (options.floating) {
        _observer = new IntersectionObserver(_listenScroll, {threshold: IRThreshold_});
        _observer.observe(_container);

        _pDiv = newDiv(_container, 'div', null, styles.hide, null);
        _pDiv.style.width = "100%";
        // ?? I thought you use the ratio and not hardcode?!
        _pDiv.style.height = _container.offsetWidth / (16/9) + "px"; // default height
      }

      var _customControl = `
        <div id="${customCtrlID}-${rand}">
          <a class="${styles.carouselBtn} left" href="#" id="${prevBtnID}-${rand}">
            <span class="${styles.arrowIcn} left"></span>
          </a>
          <a class="${styles.carouselBtn} right" href="#" id="${nextBtnID}-${rand}">
            <span class="${styles.arrowIcn} right"></span>
          </a>
        </div>
        <div id="${videoListID}-${rand}" class="${styles.vList}"></div>
      `;

      _playerWrapper = document.createElement('div');
      _playerWrapper.className = styles.playerW;
      _playerWrapper.id = `${playerID}-${rand}`;
  
      _playerContainer = newDiv(_container, 'div', null, styles.playerCtr, null);
      _playerContainer.style.height = _playerContainer.offsetWidth / (16/9) + "px"; // default height
      _playerContainer.appendChild(_playerWrapper);

      _carouselWrapper = newDiv(_container, 'div', _customControl, styles.carouselW);
      _nextBtn = document.getElementById(`${nextBtnID}-${rand}`);
      _prevBtn = document.getElementById(`${prevBtnID}-${rand}`);

      _closeBtn = newDiv(_playerContainer, 'button', '<span></span>', `${styles.closeBtn} ${styles.hide}`);
      addListener(_closeBtn, 'click', _onCloseBtnClick);

      _playerReadyProm
        .then(function() {
          initPlayer();
          return Promise.all([_playlistReadyProm, _sliderReadyProm])
        })
        .then(function(){
          initSliderObj(); // move the init slider function here, coz we need to execute the tns function when the element is already appended to the DOM
          if (_videoIds.length) {
            _player.loadPlaylistById(_videoIds);
          }
        });
    } else {
      console.log("Error: container not found in options object");
      return;
    }
  }

  function _prevSlide(e) {
    e.preventDefault();
    _sliderObj.goTo('prev');
    e.stopPropagation();
  }

  function _nextSlide(e) {
    e.preventDefault();
    _sliderObj.goTo('next');
    e.stopPropagation();
  }

  function _setDisableWidget(isDisabled) {
    if (isDisabled) {
      _carouselWrapper.classList.add(styles.carouselDisabled);
    } else {
      _carouselWrapper.classList.remove(styles.carouselDisabled);
    }
  }

  function _setActiveItem(videoID) {
    document.querySelectorAll(`.${styles.vItem}`).forEach(function(e) {
      e.classList.remove('active');
    })
    const elt = document.getElementById(`vItem-${videoID}`);
    if (elt) elt.classList.add('active');

    let idx = elt.getAttribute('data-index');
    _sliderObj.goTo(idx);
  }


  function _setVideoItems(items) {
    var vList = '';
    items.forEach(function(item, index) { 
        _videoIds.push(item[_playlistResponse.id]);
        vList += `<div id="vItem-${item[_playlistResponse.id]}" class="${styles.vItem}" data-index="${index}">
              <div class="${styles.vImg}">
                  <span class="${styles.vDuration}">${_timeFormat(item[_playlistResponse.duration])}</span>
                  <img data-src="${_getThumbnail(item[_playlistResponse.image])}" alt="" class="tns-lazy-img">
              </div>
              <div class="${styles.vBoxBot}">
                  <h4 class="${styles.vTitle}">${item[_playlistResponse.title]}</h4>
                  <span class="${styles.vDate}">${_dateFormat(item[_playlistResponse.date])}</span>
              </div>
        </div>`;
    })
    document.querySelector(`#${videoListID}-${rand}`).innerHTML = vList;

    if (_playOneVideoFcn) {
      _videoIds.map(function(id) {
        document.getElementById(`vItem-${id}`).onclick = function() {
          _playOneVideoFcn(id);
        }
      });
    }
    addListener(_prevBtn, 'click', _prevSlide);
    addListener(_nextBtn, 'click', _nextSlide);
    _playlistReadyResolve(); 
  }
  function _getVideoList() {
    var fetchVideo = new XMLHttpRequest();
    fetchVideo.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let response = JSON.parse(fetchVideo.responseText);
        if (response[_playlistResponse.response].length > 0) {
          _setVideoItems(response[_playlistResponse.response]);
        }
      } 
    }
    fetchVideo.open("GET", _playlistAPI, true);
    fetchVideo.send();
  }

  function _dateFormat(value) {
    const monthText = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    if (value) {
      const dateStr = new Date(value);
      return dateStr.getDate() + ' ' + monthText[dateStr.getMonth()] + ' ' + dateStr.getFullYear();
    } else {
      return "";
    }
  }

  function _timeFormat(value) {
    if (value) {
      if (value.indexOf(':') > -1) {
        const timeStr = value.split(':');
        if (timeStr[0] == '00') {
          return timeStr[1] + ':' + timeStr[2];
        } else {
          return value;
        }
      } else {
        var seconds = parseInt(value, 10);
        var hours   = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds - (hours * 3600)) / 60);
        seconds = seconds - (hours * 3600) - (minutes * 60);

        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}

        if (hours == "00") return minutes+':'+seconds;
        else return hours+':'+minutes+':'+seconds;
      }
    } else {
      return "";
    }
  }

  function _getThumbnail(thumbnails) {
    if (typeof thumbnails === 'string') {
      return thumbnails
    } else if (typeof thumbnails === 'object') {
      let tmpA = thumbnails.map((e, idx)=> ({idx: idx, w: e.width})).sort((a, b) => a.w-b.w);
      let found = tmpA.find((e) => e.w >= 426);
      let idx = found ? found.idx : tmpA[tmpA.length-1].idx;
      return thumbnails[idx].url;
    }
  }
  let ret = new FactoryOneWidget(options);
  return ret;
}
module.exports = MakeOneWidget_;