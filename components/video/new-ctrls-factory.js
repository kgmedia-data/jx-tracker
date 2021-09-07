/**
 * Makes a Control Object for PLAYER. In the end we decided not to...
 * So we are really using mostly the HTML5 <video>'s controls
 * THis object only do the big play button
 */

const modulesmgr = require("../basic/modulesmgr");
const common = modulesmgr.get("basic/common");

const cssmgr = modulesmgr.get("video/cssmgr");
const thumbnailCls = cssmgr.getRealCls("thumbnailCls");
const hideCls = cssmgr.getRealCls("hideCls");
const hideOpacityCls = cssmgr.getRealCls("hideOpacityCls");
const playbackAnimationCls = cssmgr.getRealCls("playbackAnimationCls");
const overlayBigPlayBtnCls = cssmgr.getRealCls("overlayBigPlayBtnCls");
const overlayBigPauseBtnCls = cssmgr.getRealCls("overlayBigPauseBtnCls");

const overlayControlCls = cssmgr.getRealCls("overlayControlCls");
const overlayTitleCls = cssmgr.getRealCls("overlayTitleCls");
const leftControlCls = cssmgr.getRealCls("leftControlsCls");
const rightControlCls = cssmgr.getRealCls("rightControlsCls");
const bottomControlCls = cssmgr.getRealCls("bottomControlCls");
const volumeControlCls = cssmgr.getRealCls("volumeControlCls");
const playbackRoundedCls = cssmgr.getRealCls("playbackRoundedCls");

const pauseBtnCls = cssmgr.getRealCls("pauseBtnCls");
const playBtnCls = cssmgr.getRealCls("playBtnCls");
const volumeLowCls = cssmgr.getRealCls("volumeLowCls");
const volumeMidCls = cssmgr.getRealCls("volumeMidCls");
const volumeHighCls = cssmgr.getRealCls("volumeHighCls");
const volumePanelCls = cssmgr.getRealCls("volumePanelCls");
const muteBtnCls = cssmgr.getRealCls("muteBtnCls");
const fullscreenBtnCls = cssmgr.getRealCls("fullscreenBtnCls");
const fullscreenExitBtnCls = cssmgr.getRealCls("fullscreenExitBtnCls");
const speedContainerCls = cssmgr.getRealCls("speedContainerCls");
const qualityContainerCls = cssmgr.getRealCls("qualityContainerCls");
const fullScreenBtnContainer = cssmgr.getRealCls("fullScreenBtnContainer");
const speedValueCls = cssmgr.getRealCls("speedValueCls");
const speedSelectionCls = cssmgr.getRealCls("speedSelectionCls");
const subtitleContainerCls = cssmgr.getRealCls("subtitleContainerCls");
const subtitleSelectionCls = cssmgr.getRealCls("subtitleSelectionCls");
const subtitleValueCls = cssmgr.getRealCls("subtitleValueCls");
const settingBtnCls = cssmgr.getRealCls("settingBtnCls");
const qualitySelectionCls = cssmgr.getRealCls("qualitySelectionCls");
const qualityItemsCls = cssmgr.getRealCls("qualityItemsCls");
const videoProgressCls = cssmgr.getRealCls("videoProgressCls");
const videoProgressContainerCls = cssmgr.getRealCls("videoProgressContainerCls");
const videoProgressInputCls = cssmgr.getRealCls("videoProgressInputCls");
const videoProgressTooltipCls = cssmgr.getRealCls("videoProgressTooltipCls");

const playBtnId = "playBtn";
const volumeBtnId = "volumeBtn"
const volumePanelId = "volumePanel"
const muteBtnId = "muteBtn";
const vLowId = "volumeLow";
const vMidId = "volumeMid";
const vHighId = "volumeHigh";
const fullScreenBtnId = "fullScreenBtn";
const speedBtnId = "speedBtn";
const subtitleBtnId = "subtitleBtn";
const qualityBtnId = "qualityBtn";
// const speedValueId = "speedValue";

const timeElapsedId = "time-elapsed";
const durationId = "duration";

const primaryColor = "#1B63D4";
const buttonsColor = "#FFF";
const randNumb = Math.floor(Math.random() * 1000);
const playbackRateArr = [0.25, 0.5, 1, 1.5, 2];
const qualityArr = [1080, 720, 480, 360];
const subtitleArr = [{value: "ID", label: "Indonesia"}, {value: "EN", label: "English"}]

function MakeOneNewPlayerControlsObj(container, vectorFcn) {
  function FactoryOneNewPlayerControls() {}
  var _vectorFcn = null;
  var _container = null;
  var _thumbnailImg = null;
  var _bigPlayBtn = null;
  var _boundClickedCB = null;
  var _boundImgLoadedFcn = null;

  var _initialized = false;
  var resizeObserver = null;

  var _videoControls = null;
  var _bottomControls = null;
  var _rightControls = null;
  var _leftControls = null;
  var _videoTitle = null;

  var _overlayPlayBtn = null;
  var _overlayVolumeBtn = null;
  var _overlayVolumeRange = null;
  var _overlayFScreenBtn = null;
  var _overlaySpeedBtn = null;
  var _overlayQualityBtn = null;
  var _overlaySubtitleBtn = null;

  var _progressBar = null;
  var _progressBarInput = null;
  var _progressBarTooltip = null;

  var _speedItems = [];
  var _qualityItems = [];
  var _subtitleItems = [];

  var _bigPlayBtnCls = playbackAnimationCls;

  //all the callback functions (these are promise resolvers) we record so
  //that we call them at one go when there is a click
  //to avoid dangling promise chains.
  //Coz while we are still "in" one promise chain (setV) to get ready one video
  //user could very well (inpatient) click on another thumbnail in the widget
  //to launch yet another video in the playlist.
  var _knownClickCBs = [];
  function FactoryOneNewPlayerControls(container, vectorFcn) {
    _vectorFcn = vectorFcn;
    _container = container;

    // rounded big play button
    // if (true) _bigPlayBtnCls = playbackRoundedCls;

    cssmgr.inject('newControls', { buttonsColor: buttonsColor, primaryColor: primaryColor });

    resizeObserver = new ResizeObserver(_onVideoResized);
    resizeObserver.observe(_container);

    _videoControls = common.newDiv(_container, "div", null, overlayControlCls+' '+hideOpacityCls);
    _videoTitle = common.newDiv(_container, "div", `<div>${'This is the title of video'}</div>`, overlayTitleCls +' '+ hideOpacityCls);

    _bottomControls = common.newDiv(_videoControls, "div", null, bottomControlCls);
    _leftControls = _createLeftControls();
    _rightControls = _createRightControls();
    _createProgressBar();

    common.addListener(window, "click", _onWindowClick);
  }

  FactoryOneNewPlayerControls.prototype.reset = function () {
    if (_thumbnailImg) {
      _container.removeChild(_thumbnailImg);
      _thumbnailImg = null;
    }

    _initialized = false;

    const speedContainer = document.querySelector(`.${speedContainerCls}`);
    const qualityContainer = document.querySelector(`.${qualityContainerCls}`);
    const subtitleContainer = document.querySelector(`.${subtitleContainerCls}`);
    if (speedContainer) _rightControls.removeChild(speedContainer);
    if (qualityContainer) _rightControls.removeChild(qualityContainer);
    if (subtitleContainer) _rightControls.removeChild(subtitleContainer);
    

    // if (_videoTitle) {
    //   _container.removeChild(_videoTitle);
    //   _videoTitle = null;
    // }
  };

  //this can be called in 2 situations:
  //1. real user click - the evtObject object there should be an object ,if it had come
  //   from a real user click.
  //2. In the onPlaying callback (listening of the video element, onplaying),
  //   this will also be triggered (COZ, if, for some reason, the play managed to start
  //   without a user-click (quite possible if e.g. the SDK's play api is called.)
  //   then videoVisualsHide (which calls this function) got called so that we tear down
  //   the big play button.
  //Note: if it is not a real click, then evtObject will be null
  //      And we also dun report the click to start
  function _clickedCB(evtObject) {
    //this can come from hideBigPlayBtn
    //yes we report before we really do the resolve.
    if (evtObject && _vectorFcn.reportClickToStart) {
      _vectorFcn.reportClickToStart();
    }

    if (_thumbnailImg) _thumbnailImg.classList.add(hideCls);
    if (_boundClickedCB) {
      common.removeListener(_bigPlayBtn, "click", _boundClickedCB);
      _boundClickedCB = null;

      common.addListener(_bigPlayBtn, "click", _togglePlay);
    }
    for (var i = 0; i < _knownClickCBs.length; i++) {
      _knownClickCBs[i]();
    }
    _knownClickCBs.length = 0;
  }
  function _showSpinner() {
    if (_vectorFcn.showSpinner) vectorFcn.showSpinner();
  }
  function _hideSpinner() {
    if (_vectorFcn.hideSpinner) vectorFcn.hideSpinner();
  }
  function _showOpacityElement(elm) {
    elm.classList.remove(hideOpacityCls);
  }
  function _hideOpacityElement(elm) {
    elm.classList.add(hideOpacityCls);
  }
  function _showAll() {
    [_videoControls, _videoTitle, _bigPlayBtn].forEach(function(x) {
      _showOpacityElement(x);
    });
  }
  function _hideAll() {
    [_videoControls, _videoTitle, _bigPlayBtn].forEach(function(x) {
      _hideOpacityElement(x);
    });
  }

  function _createLeftControls() {
    var iHTML = `<button data-title="Play" id="${playBtnId}-${randNumb}">
                  <span class="${playBtnCls}"></span>
                  <span class="${pauseBtnCls} ${hideCls}"></span>
                </button>
                <div class="${volumeControlCls}">
                  <button data-title="Mute" id="${volumeBtnId}-${randNumb}">
                    <span class="${muteBtnCls} ${hideCls}" id="${muteBtnId}-${randNumb}"></span>
                    <span class="${volumeLowCls} ${hideCls}" id="${vLowId}-${randNumb}"></span>
                    <span class="${volumeMidCls} ${hideCls}" id="${vMidId}-${randNumb}"></span>
                    <span class="${volumeHighCls}" id="${vHighId}-${randNumb}"></span>
                  </button>
                  <input type="range" class="${volumePanelCls}" id="${volumePanelId}-${randNumb}" type="range" max="1" min="0" step="0.01" />
                </div>
                <div>
                  <span id="${timeElapsedId}-${randNumb}">00:00</span>
                  <span>&nbsp;/&nbsp;</span>
                  <span id="${durationId}-${randNumb}">00:00</span>
                </div>`;
    var ctrl = common.newDiv(_bottomControls, "div", iHTML, leftControlCls);

    _overlayPlayBtn = document.getElementById(`${playBtnId}-${randNumb}`);
    common.addListener(_overlayPlayBtn, "click", _togglePlay);

    _overlayVolumeBtn = document.getElementById(`${volumeBtnId}-${randNumb}`);
    common.addListener(_overlayVolumeBtn, "click", _toggleMute);

    _overlayVolumeRange = document.getElementById(`${volumePanelId}-${randNumb}`);
    common.addListener(_overlayVolumeRange, "input", _updateVolume);

    return ctrl;
  }

  function _createRightControls() {
    var iHTML = `<button data-title="Full screen" id="${fullScreenBtnId}-${randNumb}" class="${fullScreenBtnContainer}">
                  <span class="${fullscreenBtnCls}"></span>
                  <span class="${fullscreenExitBtnCls} ${hideCls}"></span>
                </button>`;
    var ctrl = common.newDiv(_bottomControls, "div", iHTML, rightControlCls);

    _overlayFScreenBtn = document.getElementById(`${fullScreenBtnId}-${randNumb}`);
    common.addListener(_overlayFScreenBtn, "click", _toggleFullScreen);

    return ctrl;
  }

  function _createOverlaySpeedMenu() {
    var speedContainer = common.newDiv(_rightControls, "div", null, speedContainerCls);
    _overlaySpeedBtn = common.newDiv(speedContainer, "button", `<span class="${speedValueCls}">1x</span>`, null, `${speedBtnId}-${randNumb}`)
    _overlaySpeedBtn.dataset.title = "Speed";
    var speedSelection = common.newDiv(speedContainer, "div", null, speedSelectionCls+' '+hideCls);

    playbackRateArr.forEach(function(x) {
      var elm = common.newDiv(speedSelection, "div", x);
      elm.dataset.title = x;
      elm.dataset.playback = x;
      common.addListener(elm, 'click', _selectSpeed);
      _speedItems.push(elm);
    });

    common.addListener(_overlaySpeedBtn, "click", function() {
      _toggleMenuSelection(speedSelectionCls);
    });
  }

  function _createOverlayQualityMenu() {
    var qualityContainer = common.newDiv(_rightControls, "div", null, qualityContainerCls);
    _overlayQualityBtn = common.newDiv(qualityContainer, "button", `<span class="${settingBtnCls}"></span>`, null, `${qualityBtnId}-${randNumb}`)
    _overlayQualityBtn.dataset.title = "Quality";
    var qualitySelection = common.newDiv(qualityContainer, "div", "<div>Quality</div>", qualitySelectionCls+' '+hideCls);

    qualityArr.forEach(function(x) {
      var elm = common.newDiv(qualitySelection, "div", x+"p", qualityItemsCls);
      elm.dataset.title = x+"p";
      elm.dataset.quality = x;
      common.addListener(elm, 'click', _selectQuality);
      _qualityItems.push(elm);
    });

    common.addListener(_overlayQualityBtn, "click", function() {
      _toggleMenuSelection(qualitySelectionCls);
    });
  }

  function _createOverlaySubtitleMenu() {
    var subtitleContainer = common.newDiv(_rightControls, "div", null, subtitleContainerCls);
    _overlaySubtitleBtn = common.newDiv(subtitleContainer, "button", `<span class="${subtitleValueCls}">CC</span>`, null, `${subtitleBtnId}-${randNumb}`)
    _overlaySubtitleBtn.dataset.title = "Subtitle";
    var subtitleSelection = common.newDiv(subtitleContainer, "div", null, subtitleSelectionCls+' '+hideCls);

    subtitleArr.forEach(function(x) {
      var elm = common.newDiv(subtitleSelection, "div", x.label, qualityItemsCls);
      elm.dataset.title = x.label;
      elm.dataset.subtitle = x.value;
      common.addListener(elm, 'click', _selectSubtitle);
      _subtitleItems.push(elm);
    });

    common.addListener(_overlaySubtitleBtn, "click", function() {
      _toggleMenuSelection(subtitleSelectionCls);
    });
  }

  function _createProgressBar() {
    const _progressBarWrapper = common.newDiv(_videoControls, "div", null, videoProgressContainerCls);
    _progressBar = document.createElement("progress");
    _progressBar.className = videoProgressCls;
    _progressBar.value = 0;
    _progressBar.min = 0;
    _progressBarWrapper.appendChild(_progressBar);

    _progressBarInput = document.createElement("input");
    _progressBarInput.className = videoProgressInputCls;
    _progressBarInput.type = "range";
    _progressBarInput.value = 0;
    _progressBarInput.min = 0;
    _progressBarInput.step = 1;
    _progressBarWrapper.appendChild(_progressBarInput);

    _progressBarTooltip = common.newDiv(_progressBarWrapper, "div", "00:00", videoProgressTooltipCls);
    common.addListener(_progressBarInput, "mousemove", _updateProgressBarTooltip);
    common.addListener(_progressBarInput, "input", _skipAhead);
  }

  function _formatTime(timeInSeconds) {
    const result = new Date(timeInSeconds * 1000).toISOString().substr(11, 8);
  
    return {
      minutes: result.substr(3, 2),
      seconds: result.substr(6, 2),
    };
  }

  function _onVideoResized() {
    if (_container.offsetWidth <= 480) {
      _rightControls.style.display = "none";
    } else {
      _rightControls.style.display = "flex";
    }
  }

  function _onWindowClick(e) {
    if (_overlayQualityBtn && !_overlayQualityBtn.contains(e.target)) {
      const qualitySelection = document.querySelector(`.${qualitySelectionCls}`)
      qualitySelection.classList.add(hideCls);
    }
    if (_overlaySpeedBtn && !_overlaySpeedBtn.contains(e.target)) {
      const speedSelection = document.querySelector(`.${speedSelectionCls}`)
      speedSelection.classList.add(hideCls);
    }
    if (_overlaySubtitleBtn && !_overlaySubtitleBtn.contains(e.target)) {
      const subtitleSelection = document.querySelector(`.${subtitleSelectionCls}`)
      subtitleSelection.classList.add(hideCls);
    }
  }

  function _onVideoAreaClicked(e) {
    // WIP

    // _showAll();
    // setTimeout(function() {
    //   _hideAll();
    // }, 3000);
  }

  function _onMouseOutVideo(e) {
    if (e !== undefined && e.type === "mouseleave") {
      [subtitleSelectionCls, speedSelectionCls, qualitySelectionCls].forEach(function(x) {
        const elm = document.querySelector(`.${x}`);
        if (elm) elm.classList.add(hideCls);
      });
      _hideAll();
    }
  }

  function _initVideoInfo(videoObj) {
    if (!_initialized) {
      _initialized = true;

      // optional controls i.e playback rate, quality, subtitle. we show them based on what we got from video e.g subtitle, quality
      // e.g if there is no subtitle then we don't show the CC button
      if (true) _createOverlaySpeedMenu();
      if (true) _createOverlayQualityMenu();
      if (true) _createOverlaySubtitleMenu();

      const videoDuration = Math.round(videoObj.duration);
      const time = _formatTime(videoDuration);
      const volume = _vectorFcn.getVolume();
      const speed = videoObj.playbackRate;
      
      const durationText = document.getElementById(durationId + '-' + randNumb);
      const speedValue = document.querySelector(`.${speedValueCls}`);
      const selectedPlaybackValue = document.querySelectorAll(`.${speedSelectionCls} div[data-playback~="${speed}"]`);
  
      durationText.innerText = `${time.minutes}:${time.seconds}`;

      _progressBarInput.setAttribute('max', videoDuration);
      _progressBar.setAttribute('max', videoDuration);
  
      _overlayVolumeRange.value = volume;
      _updateVolume(true);
      _updateVolumeIcon(volume);

      if (_speedItems.length > 0) _speedItems.forEach((x) => x.classList.remove('active'));
      if (selectedPlaybackValue.length > 0) {
        selectedPlaybackValue[0].classList.add('active');
        speedValue.innerText = speed + 'x';
      }

      common.addListener(_container, "mouseenter", _showAll);
      common.addListener(_container, "mouseleave", _onMouseOutVideo);
      common.addListener(_container, "click", _onVideoAreaClicked);
    }
  }

  function _updateTimeElapsed(currentTime) {
    const timeElapsedText = document.getElementById(timeElapsedId + '-' + randNumb);
    const time = _formatTime(currentTime);
    timeElapsedText.innerText = `${time.minutes}:${time.seconds}`;
  }

  function _updatePlayBtn() {
    const playBtn = document.getElementById(`${playBtnId}-${randNumb}`);

    if (!_vectorFcn.isPaused()) {
      document.querySelector(`.${playBtnCls}`).classList.add(hideCls);
      document.querySelector(`.${overlayBigPlayBtnCls}`).classList.add(hideCls);
      document.querySelector(`.${pauseBtnCls}`).classList.remove(hideCls);
      document.querySelector(`.${overlayBigPauseBtnCls}`).classList.remove(hideCls);
      playBtn.setAttribute('data-title', 'Pause');
    } else {
      document.querySelector(`.${playBtnCls}`).classList.remove(hideCls);
      document.querySelector(`.${overlayBigPlayBtnCls}`).classList.remove(hideCls);
      document.querySelector(`.${pauseBtnCls}`).classList.add(hideCls);
      document.querySelector(`.${overlayBigPauseBtnCls}`).classList.add(hideCls);
      playBtn.setAttribute('data-title', 'Play');
    }
  }

  function _togglePlay() {
    if (_vectorFcn.isPaused()) {
      _vectorFcn.play();
    } else {
      _vectorFcn.pause();
    }
  }

  function _toggleMute() {
    if (_vectorFcn.isMuted()) {
      _vectorFcn.unMute();
      _overlayVolumeRange.value = _overlayVolumeRange.dataset.volume;
    } else {
      _vectorFcn.mute();
      _overlayVolumeRange.setAttribute('data-volume', _overlayVolumeRange.value);
      _overlayVolumeRange.value = 0;
      _overlayVolumeRange.style.display = 'none';
    }
  }

  function _updateVolume(isInit) {
    const min = _overlayVolumeRange.min;
    const max = _overlayVolumeRange.max;
    const val = _overlayVolumeRange.value;
    
    if (_vectorFcn.isMuted() && !isInit) {
      _vectorFcn.unMute();
    }
    _overlayVolumeRange.style.backgroundSize = (val - min) * 100 / (max - min) + '% 100%';
    _vectorFcn.setVolume(_overlayVolumeRange.value);
  }

  function _updateVolumeIcon(volume) {
    const volumeIcons = document.querySelectorAll(`#${volumeBtnId}-${randNumb} span`);
    const muteIcon = document.getElementById(`${muteBtnId}-${randNumb}`);
    const lowIcon = document.getElementById(`${vLowId}-${randNumb}`);
    const midIcon = document.getElementById(`${vMidId}-${randNumb}`);
    const highIcon = document.getElementById(`${vHighId}-${randNumb}`);

    volumeIcons.forEach((x) => x.classList.add(hideCls));

    _overlayVolumeBtn.setAttribute('data-title', 'Mute');
    
    if (_vectorFcn.isMuted() || volume === 0) {
      muteIcon.classList.remove(hideCls);
      _overlayVolumeBtn.setAttribute('data-title', 'Unmute');
      _overlayVolumeRange.style.display = 'none';
      _vectorFcn.mute();
    } else {
      if (volume > 0 && volume < 0.3) {
        lowIcon.classList.remove(hideCls);
      } else if (volume > 0 && volume >= 0.3 && volume <= 0.5) {
        midIcon.classList.remove(hideCls);
      } else {
        highIcon.classList.remove(hideCls);
      }
      _overlayVolumeRange.style.display = 'inline-block';
    }
  }

  function _toggleFullScreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.webkitFullscreenElement) {
      // Need this to support Safari
      document.webkitExitFullscreen();
    } else if (_container.webkitRequestFullscreen) {
      // Need this to support Safari
      _container.webkitRequestFullscreen();
    } else {
      _container.requestFullscreen();
    }
  }

  function _updateFullscreenButton() {
    const fullscreenIcons = document.querySelectorAll(`#${fullScreenBtnId}-${randNumb} span`);
    fullscreenIcons.forEach((icon) => icon.classList.toggle(hideCls));
  
    if (document.fullscreenElement) {
      _overlayFScreenBtn.setAttribute('data-title', 'Exit full screen');
    } else {
      _overlayFScreenBtn.setAttribute('data-title', 'Full screen');
    }
  }

  function _selectSubtitle(e) {
    const target = e.target;
    const dataset = target.dataset;
    const subtitleValue = document.querySelector(`.${subtitleValueCls}`);

    _subtitleItems.forEach((x) => x.classList.remove('active'));
    target.classList.add('active');
    subtitleValue.innerText = dataset.subtitle;

    console.log('subtitle selected is --->', dataset.subtitle)
  }

  function _selectSpeed(e) {
    const target = e.target;
    const dataset = target.dataset;
    const speedValue = document.querySelector(`.${speedValueCls}`);

    _speedItems.forEach((x) => x.classList.remove('active'));
    target.classList.add('active');
    speedValue.innerText = dataset.playback + 'x';

    _vectorFcn.setPlaybackRate(Number(dataset.playback));
  }

  function _selectQuality(e) {
    const target = e.target;
    const dataset = target.dataset;

    _qualityItems.forEach((x) => x.classList.remove('active'));
    target.classList.add('active');

    console.log('Selected Quality is -->', dataset.quality) ;
  }

  function _toggleMenuSelection(className) {
    const menuSelection = document.querySelector(`.${className}`);
    menuSelection.classList.toggle(hideCls);
  }

  function _updateProgressBar(currentTime) {
    _progressBarInput.value = Math.floor(currentTime);
    _progressBar.value = Math.floor(currentTime);
  }

  function _updateProgressBarTooltip(event) {
    const skipTo = Math.round(
      (event.offsetX / event.target.clientWidth) *
        parseInt(event.target.getAttribute('max'), 10)
    );
    _progressBarInput.setAttribute('data-seek', skipTo);
    const t = _formatTime(skipTo);
    _progressBarTooltip.textContent = `${t.minutes}:${t.seconds}`;
    const rect = _container.getBoundingClientRect();
    _progressBarTooltip.style.left = `${event.pageX - rect.left}px`;
  }

  function _skipAhead(event) {
    const skipTo = event.target.dataset.seek
      ? event.target.dataset.seek
      : event.target.value;

    if (_vectorFcn.setVideoPlayhead) _vectorFcn.setVideoPlayhead(skipTo);
    _progressBar.value = skipTo;
    _progressBarInput.value = skipTo;
  }

  /**
   * If somehow somehow the play started then this should be called.
   * (play can start thru various channels ... See comment for _clickedCB function above.
   * actually I am thinking, once the play starts, we can just remove the thumbnail??
   */
  FactoryOneNewPlayerControls.prototype.videoVisualsHide = function () {
    _hideSpinner();
    if (_bigPlayBtn && _boundClickedCB) {
      _boundClickedCB();
    } else {
      if (_thumbnailImg) {
        _thumbnailImg.classList.add(hideCls);
        _thumbnailImg = null; //aiyo can we just get rid of it .
        //we are not going to show this again, right?
      }
    }
  };
  /**
   * If there is a need (e.g. autoplay attempt failed or configuration is click to play)
   * Then this will be called.
   * @param {*} cb
   */
  FactoryOneNewPlayerControls.prototype.showBigPlayBtn = function (cb) {
    if (!_bigPlayBtn) {
      //for now should be spinner
      /**/
      _bigPlayBtn = document.createElement("div");
      _bigPlayBtn.className = _bigPlayBtnCls;
      _bigPlayBtn.innerHTML = `<span class="${overlayBigPlayBtnCls}"></span>
                              <span class="${overlayBigPauseBtnCls} ${hideCls}"></span>`;

      _container.appendChild(_bigPlayBtn);
    }
    if (_bigPlayBtn) {
      if (cb) {
        _knownClickCBs.push(cb);
        //note: may be no need to bind already...
        _boundClickedCB = _clickedCB.bind({ cb: cb });
        common.addListener(_bigPlayBtn, "click", _boundClickedCB); //not sure about touch
      }

      [_videoTitle, _bigPlayBtn].forEach(function(x) {
        _showOpacityElement(x);
      });
    }
  };

  //a function to be bound
  function imgLoadedFcn() {
    try {
      this.img.removeEventListener("load", _boundImgLoadedFcn);
    } catch (ee) {}
    _boundImgLoadedFcn = null;
    if (this.cb) {
      this.cb();
    }
  }
  /**
   * every video starts like this:
   * stick the thumbnail there on top first
   * then put the loading spinner
   * When do we even put in the spinner then?
   * Thumbnail we put down very early.
   * Then
   * @param {*} thumbnailURL
   */
  FactoryOneNewPlayerControls.prototype.videoVisualsInit = function (thumbnailURL,imgLoadedCB) {
    _showSpinner();
    if (!_thumbnailImg) {
      let r = Math.floor(Math.random() * 2000 + 1);
      let thumbnailID = thumbnailCls + "-" + r; //want ID for wat?
      _thumbnailImg = common.newDiv(
        _container,
        "img",
        null,
        thumbnailCls,
        thumbnailID
      );
    }
    if (thumbnailURL && thumbnailURL != _thumbnailImg.src) {
      _boundImgLoadedFcn = imgLoadedFcn.bind({
        img: _thumbnailImg,
        cb: imgLoadedCB,
      });
      common.addListener(_thumbnailImg, "load", _boundImgLoadedFcn);
      _thumbnailImg.src = thumbnailURL;
      if (_thumbnailImg.complete) {
        _boundImgLoadedFcn();
      }
    }
  };
  /**
   * every video : second stage. reached a canplay stage. so we remove the spinner.
   * So now can remove the loading spinner then
   * @param {*} thumbnailURL
   */
  FactoryOneNewPlayerControls.prototype.videoVisualsRemoveSpinner = function () {
    _hideSpinner();
  };
  FactoryOneNewPlayerControls.prototype.showControls = function () {
    _showOpacityElement(_videoControls);
  };
  FactoryOneNewPlayerControls.prototype.hideControls = function () {
    _hideOpacityElement(_videoControls);
  };
  FactoryOneNewPlayerControls.prototype.updateTimeElapsed = function (currTime) {
    _updateTimeElapsed(currTime);
  };
  FactoryOneNewPlayerControls.prototype.initializeVideoInfo = function (videoObj) {
    _initVideoInfo(videoObj);
  };
  FactoryOneNewPlayerControls.prototype.updatePlayBtn = function () {
    _updatePlayBtn();
  };
  FactoryOneNewPlayerControls.prototype.updateVolume = function (vol) {
    _updateVolumeIcon(vol);
  };
  FactoryOneNewPlayerControls.prototype.updateFullscreen = function () {
    _updateFullscreenButton();
  };
  FactoryOneNewPlayerControls.prototype.updateProgressBar = function (time) {
    _updateProgressBar(time);
  };

  let ret = new FactoryOneNewPlayerControls(container, vectorFcn);
  return ret;
}
module.exports = MakeOneNewPlayerControlsObj;
