const modulesmgr = require("../basic/modulesmgr");
const cssmgr = modulesmgr.get("video/cssmgr");
const mpginfo = require("../basic/pginfo");

const customCtrlID = "customCtrlWidget";
const nextBtnID = "nextBtnWidget";
const prevBtnID = "prevBtnWidget";
const videoListID = "videoListWidget";
const playerID = "player";
const VIDEOS_HISTORY_KEY = "_jxvidhist";

var IRThreshold_ = 0.1;

/**
 * @param {*} e element
 * @param {*} event event name
 * @param {*} h callback function
 */
function addListener(e, event, h) {
  if (e.addEventListener) {
    e.addEventListener(event, h, false);
  } else if (e.attachEvent) {
    e.attachEvent("on" + event, h);
  } else {
    e["on" + event] = h;
  }
}

/**
 * @param {*} p parent element to
 * @param {*} t tag name of the element e.g div, p, span etc
 * @param {*} h the html string to be passed as innerHTML
 * @param {*} c class name of the created element
 * @param {*} id id of the created element
 * @returns
 */
function newDiv(p, t, h, c, id) {
  var nd = document.createElement(t);
  if (h && h != "") nd.innerHTML = h;
  if (c && c != "") nd.className = c;
  if (id) nd.id = id;
  p.appendChild(nd);
  return nd;
}

let MakeOneFloatingWidget_ = function (parentContainer, container, options, playerInstance, styleObj) {
  var _playerContainer = null;
  var _player = null;
  var _closeBtn = null;
  var _floatClosed = false;
  var _observer = null;
  var styles = null;
  var _firstViewed = false;

  options.start = options.start || 'viewed';

  /**
   * Callback function that will be passed to the Intersection Observer API
   * this will make the video in floating mode if the widget is out of viewport
   * and go back to in-article mode when the widget is on viewport
   * @param {*} e
   */
   function _listenScroll(e) {
    e.forEach(function (x) {
      if (x.intersectionRatio >= IRThreshold_) {
        if (!_firstViewed) _firstViewed = true;
        _stopFloat();
      } else {
        if (!_firstViewed) {
          if (['init', 'always'].indexOf(options.start) > -1)
          _startFloat();
        } else {
          _startFloat();
        }
      }
    });
  }

  /**
   * Start the floating mode
   */
  function _startFloat() {
    if (!_floatClosed) {
      if (_closeBtn) _closeBtn.classList.remove(styles.hide);
      _playerContainer.classList.add(styles.float);
      _setupFloat();
      
    }
  }

  /**
   * Stop the floating mode
   */
  function _stopFloat() {
    if (_closeBtn) _closeBtn.classList.add(styles.hide);
    let s = _playerContainer.style;
    _playerContainer.classList.remove(styles.float);
    s.removeProperty("width");
    s.removeProperty("right");
    s.removeProperty("bottom");
    s.removeProperty("top");
    s.removeProperty("left");
    s.removeProperty("margin");
    s.height = _getVideoHeight() + "px";
  }

  function _setupFloat() {
    let pos = options.position
    let s = _playerContainer.style;
    s.width = options.width.toString() + "px";
    s.height = _getVideoHeight(options.width) + "px";
    if (["bottom-right","bottom-left","bottom"].includes(pos)) {
      s.top = "auto";
      s.bottom = options.marginY + "px";
    }
    else {
      s.top = options.marginY + "px";
      s.bottom = "auto"; 
    }
    if (["bottom-right","top-right"].includes(pos)) s.left = "auto"; 
    if (["bottom-left","top-left"].includes(pos)) s.left = options.marginX + "px"; 
    if (["bottom-left", "top-left"].includes(pos)) s.right = "auto"; 
    if (["bottom-right","bottom","top-right"].includes(pos)) s.right = options.marginX + "px";
    if (["bottom","top"].includes(pos)) {
      s.right = "0px";
      s.left = "0px";
      s.margin = "auto";
    } else s.margin  = "0px 10px 10px";
  }

  /**
   * Get the video aspect ratio by calling an API exposed by video SDK
   * the API will returns the correct aspect ratio
   * and we will do some calculation to get the height of the video based on the aspect ratio
   * @param {*} _forceWidth
   * @returns the video height
   */
  function _getVideoHeight(_forceWidth = null) {
    let videoAR = 16 / 9;
    // if (_player && _player.getRatio) {
    //   videoAR = _player.getRatio();
    // }
    if (!_forceWidth) {
      return _playerContainer.offsetWidth / videoAR;
    } else {
      return _forceWidth / videoAR;
    }
  }

  /**
   * Function to be called when users clicked on the close button to stop and close the floating mode
   */
  function _onCloseBtnClick() {
    if (options.start !== 'always') {
      _floatClosed = true;
      if (_observer) _observer.disconnect();
    }
    _stopFloat();
  }

  function FactoryOneFloatingWidget(parentContainer, container, options, playerInstance, styleObj) {
    if (!container) {
      console.error("Error: No container found for starting float widget");
      return;
    }
    _playerContainer = container;
    _player = playerInstance;
    styles = styleObj;

    options.width = options.width || 400;
    options.position = options.position || 'bottom-right';
    options.marginX = options.hasOwnProperty('marginX') ? options.marginX : 10;
    options.marginY = options.marginY || 0;

    _observer = new IntersectionObserver(_listenScroll, {
      threshold: IRThreshold_,
    });
    _observer.observe(parentContainer);

    _closeBtn = newDiv(
      _playerContainer,
      "button",
      "<span></span>",
      `${styles.closeBtn} ${styles.hide}`
    );
    addListener(_closeBtn, "click", _onCloseBtnClick);
  }
  let ret = new FactoryOneFloatingWidget(parentContainer, container, options, playerInstance, styleObj);
  return ret;
}

let MakeOneWidget_ = function (options) {
  const rand = Math.floor(Math.random() * 1000);
  var styles = null;
  var _videoIds = [];

  var _container = null;
  var _carouselWrapper = null;
  var _playerWrapper = null;
  var _playerContainer = null;
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

  var _options = null;
  var recHelperObj = null;

  var _playlistAPIBase = "https://apidam.jixie.io/api/public/list?page=1&parts=metadata,thumbnails";
    
  var _publicStreamAPIBase= "https://apidam.jixie.media/api/public/stream?metadata=full"

  const _playlistResponse = {
    response: "data",
    id: "id",
    title: "title",
    duration: "duration",
    date: "createdon",
    image: "thumbnails",
  };
  const _playlistRecoResponse = {
    response: "items",
    id: "id",
    title: "title",
    duration: "duration",
    date: "created_on",
    image: "thumbnail",
  };

  var _baseResponse =
    options.source === "reco" ? _playlistRecoResponse : _playlistResponse;

  /**
   * 
   * @param {*} target 
   * @param {*} source 
   * @returns
   */
  const mergeConfig = (target, source) => {
    // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object)
        Object.assign(source[key], mergeConfig(target[key], source[key]));
    }

    // Join `target` and modified `source`
    Object.assign(target || {}, source);
    return target;
  };
  

  /**
   * Fucntion to play specified video ID
   * @param {*} videoId
   */
  function _playOneVideoFcn(videoId) {
    _player.play(videoId);
  }

  /**
   * Callback function that will be called when the video has been changed
   * this will be called on the videochange event
   * @param {*} evtname
   * @param {*} videoId
   */
  function cbOnVideoChanged(evtname, videoId) {
    const idx = _videoIds.findIndex(x => x.toString() === videoId.toString());
    if (recHelperObj && idx > -1) {
      recHelperObj.clicked(idx);
    }
    _setActiveItem(videoId);
  }

  /**
   * Get the video aspect ratio by calling an API exposed by video SDK
   * the API will returns the correct aspect ratio
   * and we will do some calculation to get the height of the video based on the aspect ratio
   * @param {*} _forceWidth
   * @returns the video height
   */
   function _getVideoHeight(_forceWidth = null) {
    let videoAR = 16 / 9;
    if (_player && _player.getRatio) {
      videoAR = _player.getRatio();
    }
    if (!_forceWidth) {
      return _playerContainer.offsetWidth / videoAR;
    } else {
      return _forceWidth / videoAR;
    }
  }

  /**
   * Initialize the Jixie Player
   */
  function initPlayer(playerCfg) {
    if (!_player) {
      _player = JX.player(playerCfg);
    }
    _player.addListener("ready", function () {
      // if (_getVideoHeight())
      //   _playerContainer.style.height = _getVideoHeight() + "px";
    });
    _player.addListener("videochange", cbOnVideoChanged);

    _player.addListener("ad_started", function () {
      _closeBtn.classList.add(styles.hide);
      _setDisableWidget(true);
    });
    _player.addListener("ad_ended", function () {
      _closeBtn.classList.remove(styles.hide);
      _setDisableWidget(false);
    });
  }

  /**
   * Create the script and link tag to load the tiny slider JS and CSS file from CDN
   * @param {*} resolve
   * @returns
   */
  function loadSliderScriptP(resolve) {
    if (window.tns) {
      resolve();
      return;
    }
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(link);
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.4/tiny-slider.css";
    
    var tag = document.createElement("script");
    var fst = document.getElementsByTagName("script")[0];
    fst.parentNode.insertBefore(tag, fst);
    tag.onload = function () {
      resolve();
    };
    tag.src =
      "https://cdnjs.cloudflare.com/ajax/libs/tiny-slider/2.9.2/min/tiny-slider.js";
  }

  /**
   * Create the script tag to load the recommendation SDK script
   * @returns
   */
  function loadRecSDKScriptP() {
    if (window.jxRecMgr) {
      return Promise.resolve();
    }
    return new Promise(function(resolve, reject) {
      var tag = document.createElement("script");
      var fst = document.getElementsByTagName("script")[0];
      fst.parentNode.insertBefore(tag, fst);
      tag.onload = function() {
        resolve();
      };
      tag.src = "https://scripts.jixie.media/jxrecsdk.1.0.min.js";
    });
  }

  /**
   * Create the script tag to load the video SDK script
   * @param {*} resolve
   * @returns
   */
   function loadPlayerScriptP(resolve) {
    if (window.JX) {
      resolve();
      return;
    }
    var tag = document.createElement("script");
    var fst = document.getElementsByTagName("script")[0];
    fst.parentNode.insertBefore(tag, fst);
    tag.onload = function () {
      resolve();
    };
    tag.src = "https://scripts.jixie.media/jxvideo.3.1.min.js";
    //tag.src = "https://jixie-creative-debug.s3.ap-southeast-1.amazonaws.com/universal-component/jxvideo.3.1.min.js"; // test script
  }

  /**
   * Initialize the tiny slider by sending the needed config object
   */
  function initSliderObj() {
    _sliderObj = tns({
      container: `#${videoListID}-${rand}`,
      items: 3,
      slideBy: 1,
      nav: false,
      controlsContainer: `#${customCtrlID}-${rand}`,
      lazyload: true,
    });
  }

  /**
   * Go to the previous slide by calling the goTo API from tiny slider
   * @param {*} e
   */
  function _prevSlide(e) {
    e.preventDefault();
    _sliderObj.goTo("prev");
    e.stopPropagation();
  }

  /**
   * Go to the next slide by calling the goTo API from tiny slider
   * @param {*} e
   */
  function _nextSlide(e) {
    e.preventDefault();
    _sliderObj.goTo("next");
    e.stopPropagation();
  }

  /**
   * Disabling the widget by adding or removing the class from slider's wrapper
   * @param {*} isDisabled
   */
  function _setDisableWidget(isDisabled) {
    if (isDisabled) {
      _carouselWrapper.classList.add(styles.carouselDisabled);
    } else {
      _carouselWrapper.classList.remove(styles.carouselDisabled);
    }
  }

  /**
   * Set the active widget item when video has been changed
   * by adding the active class to the widget item and moving the slider to the specified index
   * @param {*} videoID
   */
  function _setActiveItem(videoID) {
    document.querySelectorAll(`.${styles.vItem}`).forEach(function (e) {
      e.classList.remove("active");
    });
    const elt = document.getElementById(`vItem-${videoID}`);
    if (elt) elt.classList.add("active");

    let idx = elt.getAttribute("data-index");
    _sliderObj.goTo(idx);
  }

  /**
   * Create the HTML element for the widget items
   * this function will create the slider
   * by adding the CSS classes and adding the click listener on each widget item
   * @param {*} items
   */
  function _setVideoItems(items, resultObj) {
    let version = '', recoID = null;
    if (resultObj && resultObj.options) {
      if (resultObj.options.version) {
        version = resultObj.options.version;
      }
      if (resultObj.options.reco_id) {
        recoID = resultObj.options.reco_id
      }
    }
    var vList = "";
    let widgetItemArr = [];
    items.forEach(function (item, index) {
      _videoIds.push(item[_baseResponse.id]);
      let divid = `vItem-${item[_baseResponse.id]}`;
      widgetItemArr.push({
        divid: divid,
        id: item.id,
        pos: index, //starts from 0
        type: item.type || 'video',
        trackers: item.trackers,
        algo: item.a,
      });
      vList += `<div id=${divid} class="${
        styles.vItem
      }" data-index="${index}">
              <div class="${styles.vImg}">
                  <span class="${styles.vDuration}">${_timeFormat(
        item[_baseResponse.duration]
      )}</span>
                  <img data-src="${_getThumbnail(
                    item[_baseResponse.image]
                  )}" alt="" class="tns-lazy-img">
              </div>
              <div class="${styles.vBoxBot}">
                  <h4 class="${styles.vTitle}">${item[_baseResponse.title]}</h4>
                  <span class="${styles.vDate}">${_dateFormat(
        item[_baseResponse.date]
      )}</span>
              </div>
        </div>`;
    });
    document.querySelector(`#${videoListID}-${rand}`).innerHTML = vList;

    if (_playOneVideoFcn) {
      _videoIds.map(function (id) {
        document.getElementById(`vItem-${id}`).onclick = function () {
          _playOneVideoFcn(id);
        };
      });
    }
    addListener(_prevBtn, "click", _prevSlide);
    addListener(_nextBtn, "click", _nextSlide);

    recHelperObj.items(widgetItemArr);
    recHelperObj.ready(version, recoID);

    _playlistReadyResolve();
  }

  function _promiseCall(urlToCall) {
    return new Promise(function(resolve, reject) {
      var fetchOneVideo = new XMLHttpRequest();
      fetchOneVideo.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          let response = JSON.parse(fetchOneVideo.responseText);
          if (response.success) {
            resolve({
              id: response.data.video_id,
              title: response.data.metadata.title,
              thumbnails: response.data.metadata.thumbnail,
              duration: response.data.metadata.duration,
              createdon: response.data.metadata.uploadedon
            });
          } else {
            reject(false);
          }
        }
      };
      fetchOneVideo.onerror = function() {
        resolve(null);
      }
      fetchOneVideo.open("GET", urlToCall, true);
      fetchOneVideo.send();
    })
  }

  /**
   * Call the API to get the video list
   * by checking the options object from the config object
   * to determine what is the URL to be called to get the video list
   * and append the needed value as query parameters e.g collection_ids, video_ids, title, widgetid, etc
   */
  function _getVideoList() {
    let method = "GET";
    let body = null;
    var retrievalURL = _playlistAPIBase;
    let _videoHistory = localStorage.getItem(VIDEOS_HISTORY_KEY);
    _videoHistory = _videoHistory ? JSON.parse(_videoHistory) : [];

    if (_options.source === "list" && _options.videos) {
      if (Array.isArray(options.videos) && _options.videos.length > 0) {
        let promises = [];
        _options.videos.map(function(videoID) {
          promises.push(_promiseCall(_publicStreamAPIBase + "&video_id=" + videoID));
        })
        if (promises.length) {
          Promise.all(promises).then(function(values){
            _setVideoItems(values, null);
          })
        }
        return;
      }
    }
    if (_options.source === "collection" && _options.collection) {
      retrievalURL += "&collection_ids=" + _options.collection + "&accountid=" + _options.accountid;
      retrievalURL += "&limit=" + _options.count;
    }
    if (_options.source === "reco" && _options.title && _options.endpoint) {
      retrievalURL =
        _options.endpoint + 
        "/v1/recommendation?type=videos";
      [
        "count",
        "adpositions",
        "accountid",
        "pageurl",
        "widget_id",
        "title",
      ].forEach(function (pname) {
        if (_options[pname]) {
          retrievalURL +=
            "&" + pname + "=" + encodeURIComponent(_options[pname]);
        }
      });
    }

    /** Temporarily commented until the API fixed */
    if (Array.isArray(_videoHistory) && _videoHistory.length > 0) {
        if (_videoHistory.length > 10) {
            _videoHistory.length = 10;
        }
       method = "POST";
       body = {
         v_history: _videoHistory
       };
       body = JSON.stringify(body);
    }

    var fetchVideo = new XMLHttpRequest();
    fetchVideo.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let response = JSON.parse(fetchVideo.responseText);
        if (response[_baseResponse.response].length > 0) {
          _setVideoItems(response[_baseResponse.response], response);
        }
      }
    };
    fetchVideo.open(method, retrievalURL, true);
    fetchVideo.setRequestHeader('Content-Type', 'application/json');
    fetchVideo.send(body);
  }

  /**
   * Generate a formatted date
   * @param {*} value
   * @returns formatted date in Indonesian format DD MM YYYY
   */
  function _dateFormat(value) {
    const monthText = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    if (value) {
      const dateStr = new Date(value);
      return (
        dateStr.getDate() +
        " " +
        monthText[dateStr.getMonth()] +
        " " +
        dateStr.getFullYear()
      );
    } else {
      return "";
    }
  }

  /**
   * Generate a formatted time
   * @param {*} value
   * @returns formatted time in hh:mm:ss
   */
  function _timeFormat(value) {
    if (value) {
      if (value.toString().indexOf(":") > -1) {
        const timeStr = value.split(":");
        if (timeStr[0] == "00") {
          return timeStr[1] + ":" + timeStr[2];
        } else {
          return value;
        }
      } else {
        var seconds = parseInt(value, 10);
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds - hours * 3600) / 60);
        seconds = seconds - hours * 3600 - minutes * 60;

        if (hours < 10) {
          hours = "0" + hours;
        }
        if (minutes < 10) {
          minutes = "0" + minutes;
        }
        if (seconds < 10) {
          seconds = "0" + seconds;
        }

        if (hours == "00") return minutes + ":" + seconds;
        else return hours + ":" + minutes + ":" + seconds;
      }
    } else {
      return "";
    }
  }

  /**
   * Get the thumbnail URL from the object based on the source
   * @param {*} thumbnails
   * @returns the string of thumbnail URL
   */
  function _getThumbnail(thumbnails) {
    if (_options.source === "reco") {
      return thumbnails.domain_name + thumbnails.prefix;
    } else {
      if (typeof thumbnails === "string") {
        return thumbnails;
      } else if (typeof thumbnails === "object") {
        let tmpA = thumbnails
          .map((e, idx) => ({ idx: idx, w: e.width }))
          .sort((a, b) => a.w - b.w);
        let found = tmpA.find((e) => e.w >= 426);
        let idx = found ? found.idx : tmpA[tmpA.length - 1].idx;
        return thumbnails[idx].url;
      }
    }
  }

  /**
   * 
   * @param {*} configObj 
   * @returns the collected config object
   */
  function _collectBasicInfo(configObj) {
    try {
      const pginfo = mpginfo.get();
      const defaultPlayerCfg = {
        autoplay: "wifi",
        accountid: configObj.accountid,
        //"ads": {
        //"unit": "1000114-qEgXGqRpBy" //<--- need to be from outside
        //},
        restrictions: {
          maxheight: 480,
        },
        controls: {
          color: "#FFFFFF",
          backgroundcolor: "#1B63D4",
          bigplaybutton: "simple",
          font: "Roboto",
        },
        soundindicator: {
          style: "timer",
          duration: 0,
          position: "bottom-left",
          text: "Tap to unmute",
        },
      };
      let newObj = {};

      if (configObj.title) newObj.title = configObj.title;
      else if (pginfo.pagetitle) newObj.title = pginfo.pagetitle;

      if (configObj.pageurl) newObj.pageurl = configObj.pageurl;
      else if (pginfo.pageurl) newObj.pageurl = pginfo.pageurl;

      newObj.system = configObj.system || "jx";
      if (configObj.collection) newObj.collection = configObj.collection;
      if (configObj.videos) newObj.videos = configObj.videos;
      if (configObj.accountid) newObj.accountid = configObj.accountid;
      if (configObj.widgetid) newObj.widget_id = configObj.widgetid;
      if (configObj.customid) newObj.customid = configObj.customid;
      if (configObj.adpositions) newObj.adpositions = configObj.adpositions;
      newObj.container = configObj.container;
      newObj.count = configObj.count || 6;
      newObj.source = configObj.source || "reco";
      newObj.endpoint = configObj.endpoint || "https://recommendation.jixie.media";

      newObj.player = defaultPlayerCfg;
      newObj.player.container = `${playerID}-${rand}`;
      if (configObj.player) {
        newObj.player = mergeConfig(defaultPlayerCfg, configObj.player);
      }
      if (configObj.floating) {
        newObj.floating = configObj.floating;
      }

      let merged = Object.assign({}, newObj);
      return merged;
    } catch (error) {
      console.log("#### Error: error while extracting the options object");
    }
  }

  function FactoryOneWidget(options) {
    if (!options.accountid) {
      console.error('Developer Alert: No accountid found in options object. Aborting');
      return;
    }
    if (!options.container) {
      console.error('Developer Alert: No container found in options object. Aborting');
      return;
    }

    _sliderReadyProm = new Promise(function (resolve) {
      _sliderReadyResolve = resolve;
    });
    _playlistReadyProm = new Promise(function (resolve) {
      _playlistReadyResolve = resolve;
    });
    _playerReadyProm = new Promise(function (resolve) {
      _playerReadyResolve = resolve;
    })

    _options = _collectBasicInfo(options);
    
    loadRecSDKScriptP().then(function() {
      recHelperObj = jxRecMgr.createJxRecHelper(_options);

      _getVideoList(); //fire this out asap so that this can start to get the play list
      loadSliderScriptP(_sliderReadyResolve);
      loadPlayerScriptP(_playerReadyResolve);

      styles = cssmgr.getRealCls(_options.container);
      _container = document.getElementById(_options.container);

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

      _playerWrapper = document.createElement("div");
      _playerWrapper.className = styles.playerW;
      _playerWrapper.id = `${playerID}-${rand}`;

      _playerContainer = newDiv(
        _container,
        "div",
        null,
        styles.playerCtr,
        null
      );
      _playerContainer.style.height =
        _playerContainer.offsetWidth / (16 / 9) + "px"; // default height
      _playerContainer.appendChild(_playerWrapper);

    
      if (_options.floating) {
        MakeOneFloatingWidget_(_container, _playerContainer, _options.floating, _player, styles);
      }

      _carouselWrapper = newDiv(
        _container,
        "div",
        _customControl,
        styles.carouselW
      );
      _nextBtn = document.getElementById(`${nextBtnID}-${rand}`);
      _prevBtn = document.getElementById(`${prevBtnID}-${rand}`);

      _playerReadyProm
        .then(function () {
          initPlayer(_options.player);
          return Promise.all([_playlistReadyProm, _sliderReadyProm]);
        })
        .then(function () {
          initSliderObj(); // move the init slider function here, coz we need to execute the tns function when the element is already appended to the DOM
          if (_videoIds.length) {
            _player.loadPlaylistById(_videoIds);
          }
        });
    })
  }

  let ret = new FactoryOneWidget(options);
  return ret;
};
module.exports = MakeOneWidget_;
