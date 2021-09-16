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
const overlayCenterControlsCls = cssmgr.getRealCls("overlayCenterControlsCls");
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
const fastForwardBtnContainerCls = cssmgr.getRealCls("fastForwardBtnContainerCls");
const backwardBtnContainerCls = cssmgr.getRealCls("backwardBtnContainerCls");

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

const timeElapsedId = "time-elapsed";
const durationId = "duration";
const fastForwardBtnId = "fastForwardBtn";
const backwardBtnId = "backwardBtn";

const primaryColor = "#1B63D4";
const buttonsColor = "#FFF";
const randNumb = Math.floor(Math.random() * 1000);
const playbackRateArr = [0.25, 0.5, 1, 1.5, 2];
const skipOffset = 15;

function MakeOneNewPlayerControlsObj(container, vectorFcn) {
  function FactoryOneCustomControls() {}
  var _vectorFcn = null;
  var _container = null;
  var _thumbnailImg = null;
  var _bigPlayBtn = null;
  var _boundClickedCB = null;
  var _boundImgLoadedFcn = null;

  var _initialized = false;
  var resizeObserver = null;
  var elmArr = [];

  var _videoControls = null;
  var _bottomControls = null;
  var _rightControls = null;
  var _leftControls = null;
  var _centerControls = null;
  var _videoTitle = null;
  var _videoTitleDiv = null;

  var _overlayPlayBtn = null;
  var _overlayVolumeBtn = null;
  var _overlayVolumeRange = null;
  var _overlayFScreenBtn = null;
  var _overlaySpeedBtn = null;
  var _overlayQualityBtn = null;
  var _overlaySubtitleBtn = null;
  var _overlayFastForwardBtn = null;
  var _overlayBackwardBtn = null;

  var _speedContainer = null;
  var _qualityContainer = null;
  var _subtitleContainer = null;

  var _progressBar = null;
  var _progressBarInput = null;
  var _progressBarTooltip = null;

  var _speedItems = [];
  var _qualityItems = [];
  var _qualityOptions = [];
  var _subtitleItems = [];
  var _subtitleOptions = [];

  var _state = "none";

  var _touchTimeout = null;

  var _bigPlayBtnCls = playbackAnimationCls;

  var _videoObj = null;

  //all the callback functions (these are promise resolvers) we record so
  //that we call them at one go when there is a click
  //to avoid dangling promise chains.
  //Coz while we are still "in" one promise chain (setV) to get ready one video
  //user could very well (inpatient) click on another thumbnail in the widget
  //to launch yet another video in the playlist.
  var _knownClickCBs = [];
  function FactoryOneCustomControls(container, vectorFcn) {
    _vectorFcn = vectorFcn;
    _container = container;

    // rounded big play button
    // if (true) _bigPlayBtnCls = playbackRoundedCls;

    cssmgr.inject('customControls', { buttonsColor: buttonsColor, primaryColor: primaryColor });

    // resizeObserver = new ResizeObserver(_onVideoResized);
    // resizeObserver.observe(_container);

    _videoControls = common.newDiv(_container, "div", null, overlayControlCls);
    _videoTitleDiv = common.newDiv(_container, "div", null, overlayTitleCls+' '+hideOpacityCls);

    _bottomControls = common.newDiv(_videoControls, "div", null, bottomControlCls);
    _leftControls = _createLeftControls();
    _rightControls = _createRightControls();

    _centerControls = common.newDiv(_container, "div", null, overlayCenterControlsCls);

    _createBigPlayBtn();
    _createSkipButtons();
    _createProgressBar();

    elmArr = [_bigPlayBtn, _overlayFastForwardBtn, _overlayBackwardBtn, _videoTitleDiv, _videoControls];

    common.addListener(window, "click", _onWindowClick);
    common.addListener(_container, "click", _onTouch);
    common.addListener(_container, "touchstart", _onTouch);
  }

  FactoryOneCustomControls.prototype.reset = function () {
    if (_thumbnailImg) {
      _container.removeChild(_thumbnailImg);
      _thumbnailImg = null;
    }

    _initialized = false;

    if (_speedContainer) {
      _rightControls.removeChild(_speedContainer);
      _speedContainer = null;
    }
    if (_qualityContainer) {
      _rightControls.removeChild(_qualityContainer);
      _qualityContainer = null;
    }
    if (_subtitleContainer) {
      _rightControls.removeChild(_subtitleContainer);
      _subtitleContainer = null;
    }
    

    if (_videoTitle) {
      _videoTitleDiv.removeChild(_videoTitle);
      _videoTitle = null;
    }

    _qualityOptions = [];
    _subtitleOptions = [];
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

    [_overlayBackwardBtn, _overlayFastForwardBtn].forEach(function(x) {
      if (x) x.classList.remove(hideCls)
    });

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
  function _showVisibility(elm) {
    if(elm) elm.style.visibility = "visible";
  }
  function _showAll(className) {
    elmArr.forEach(function(x) {
      if (x) x.classList.remove(className);
    });
  }
  function _hideAll(className) {
    elmArr.forEach(function(x) {
      if (x) x.classList.add(className);
    });
  }

  function _createBigPlayBtn() {
    if (!_bigPlayBtn) {
      _bigPlayBtn = document.createElement("div");
      _bigPlayBtn.className = _bigPlayBtnCls;
      _bigPlayBtn.innerHTML = `<span class="${overlayBigPlayBtnCls}"></span>
                              <span class="${overlayBigPauseBtnCls} ${hideCls}"></span>`;
      
      _centerControls.appendChild(_bigPlayBtn);
      common.addListener(_bigPlayBtn, "click", _togglePlay);
    }
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

    if (!common.isIOS()) {
      const volumeControl = document.querySelector(`.${volumeControlCls}`);
      _overlayVolumeRange = document.createElement("input");
      _overlayVolumeRange.type = "range";
      _overlayVolumeRange.className = volumePanelCls;
      _overlayVolumeRange.id = `${volumePanelId}-${randNumb}`;
      _overlayVolumeRange.max = "1";
      _overlayVolumeRange.min = "0";
      _overlayVolumeRange.step = "0.01";
      volumeControl.appendChild(_overlayVolumeRange);
      common.addListener(_overlayVolumeRange, "input", _updateVolume);
    }

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
    _speedContainer = common.newDiv(_rightControls, "div", null, speedContainerCls);
    _overlaySpeedBtn = common.newDiv(_speedContainer, "button", `<span class="${speedValueCls}">1x</span>`, null, `${speedBtnId}-${randNumb}`)
    _overlaySpeedBtn.dataset.title = "Speed";
    var speedSelection = common.newDiv(_speedContainer, "div", null, speedSelectionCls+' '+hideCls);

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
    _qualityContainer = common.newDiv(_rightControls, "div", null, qualityContainerCls);
    _overlayQualityBtn = common.newDiv(_qualityContainer, "button", `<span class="${settingBtnCls}"></span>`, null, `${qualityBtnId}-${randNumb}`)
    _overlayQualityBtn.dataset.title = "Quality";
    var qualitySelection = common.newDiv(_qualityContainer, "div", "<div>Quality</div>", qualitySelectionCls+' '+hideCls);

    _qualityOptions.unshift({ height: "auto" });
    if (_qualityOptions.length > 0) {
      _qualityOptions.forEach((x) => {
        if (x.height) {
          x.label = x.height.toString() === "auto" ? "Auto" : x.height+"p";
          x.active = x.height.toString() === "auto" ? true : false;

          var elm = common.newDiv(qualitySelection, "div", x.label, qualityItemsCls);
          if (x.active) elm.classList.add("active");
          elm.dataset.title = x.label;
          elm.dataset.quality = x.height;
          common.addListener(elm, 'click', _selectQuality.bind({ track: x }));
          _qualityItems.push(elm);
        }

      })
    }

    common.addListener(_overlayQualityBtn, "click", function() {
      _toggleMenuSelection(qualitySelectionCls);
    });
  }

  function _createOverlaySubtitleMenu() {
    _subtitleContainer = common.newDiv(_rightControls, "div", null, subtitleContainerCls);
    _overlaySubtitleBtn = common.newDiv(_subtitleContainer, "button", `<span class="${subtitleValueCls}">CC</span>`, null, `${subtitleBtnId}-${randNumb}`)
    _overlaySubtitleBtn.dataset.title = "Subtitle";
    var subtitleSelection = common.newDiv(_subtitleContainer, "div", "<div>Subtitle</div>", subtitleSelectionCls+' '+hideCls);

    _subtitleOptions.push({ label: "Off", language: "off", kind: "subtitle", active: true });
    if (_subtitleOptions.length > 0) {
      _subtitleOptions.forEach(function(x) {
        if (x.kind === "subtitle") {
          var elm = common.newDiv(subtitleSelection, "div", x.label, qualityItemsCls);
          if (x.active) elm.classList.add("active");
          elm.dataset.title = x.label;
          elm.dataset.subtitle = x.language;
          common.addListener(elm, 'click', _selectSubtitle.bind({subtitle: x}));
          _subtitleItems.push(elm);
        }
      });
    }

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

  function _createSkipButtons() {
    const skipText = `<span>${skipOffset}</span>`;

    _overlayBackwardBtn = common.newDiv(_centerControls, "div", _generateSVG(backwardBtnId), `${backwardBtnContainerCls}`);
    _overlayFastForwardBtn = common.newDiv(_centerControls, "div", _generateSVG(fastForwardBtnId), `${fastForwardBtnContainerCls}`);

    _overlayFastForwardBtn.insertAdjacentHTML('beforeend', skipText);
    _overlayBackwardBtn.insertAdjacentHTML('beforeend', skipText);

    common.addListener(_overlayBackwardBtn, "click", function() {
      if (_vectorFcn.setVideoPlayhead) _vectorFcn.setVideoPlayhead(_vectorFcn.getCurrentTime() - skipOffset);
    });
    common.addListener(_overlayFastForwardBtn, "click", function() {
      if (_vectorFcn.setVideoPlayhead) _vectorFcn.setVideoPlayhead(_vectorFcn.getCurrentTime() + skipOffset);
    });
  }

  function _generateSVG(id) {
    return `<svg width="102" height="112" viewBox="0 0 102 112" xmlns="http://www.w3.org/2000/svg" id="${id}">
      <path
        d="M90.2777 30.4143C88.9433 28.7737 86.5342 28.5077 84.8723 29.8175C83.2103 31.1273 82.9132 33.5261 84.2055 35.1999C90.167 42.6755 93.396 51.9537 93.3602 61.5048C93.3653 84.302 75.3133 103.033 52.4701 103.933C29.6268 104.834 10.1489 87.5814 8.34995 64.8548C6.551 42.1283 23.0734 22.0424 45.7754 19.3575L40.5333 23.84C38.9744 25.2412 38.8195 27.6261 40.1841 29.2161C41.5487 30.8061 43.9355 31.0218 45.5644 29.7023L59.1098 18.1244C59.9683 17.3912 60.4624 16.3204 60.4624 15.1933C60.4624 14.0662 59.9683 12.9954 59.1098 12.2622L45.5644 0.684277C44.5198 -0.254672 43.0466 -0.554605 41.7165 -0.0991377C40.3863 0.35633 39.4087 1.4955 39.1628 2.87634C38.917 4.25718 39.4417 5.66233 40.5333 6.54654L46.3752 11.5385C19.2661 13.9194 -1.03062 37.3647 0.564199 64.4561C2.15901 91.5475 25.0672 112.464 52.2695 111.665C79.4717 110.866 101.106 88.6429 101.1 61.5048C101.142 50.2158 97.3245 39.2497 90.2777 30.4143Z"
        />
      <path
        d="M65.2653 29.2792C65.9333 30.0568 66.8839 30.5379 67.9077 30.6164C68.9315 30.695 69.9447 30.3645 70.7241 29.6979L84.2695 18.12C85.1279 17.3868 85.622 16.316 85.622 15.1889C85.622 14.0617 85.1279 12.9909 84.2695 12.2577L70.7241 0.679852C69.6795 -0.259097 68.2062 -0.55903 66.8761 -0.103563C65.546 0.351905 64.5683 1.49108 64.3225 2.87192C64.0767 4.25276 64.6014 5.65791 65.693 6.54212L75.8036 15.1927L65.6891 23.8395C64.0664 25.2253 63.8767 27.6601 65.2653 29.2792Z"
        />
    </svg>`;
  }

  function _formatTime(timeInSeconds) {
    const result = new Date(timeInSeconds * 1000).toISOString().substr(11, 8);
  
    return {
      minutes: result.substr(3, 2),
      seconds: result.substr(6, 2),
    };
  }

  // Right now we show all of the controls we have
  // function _onVideoResized() {
  //   if (_container.offsetWidth <= 480) {
  //     if(_qualityContainer) _qualityContainer.classList.add(hideCls);
  //     if(_speedContainer) _speedContainer.classList.add(hideCls);
  //     if(_subtitleContainer) _subtitleContainer.classList.add(hideCls);
  //   } else {
  //     if(_qualityContainer) _qualityContainer.classList.remove(hideCls);
  //     if(_speedContainer) _speedContainer.classList.remove(hideCls);
  //     if(_subtitleContainer) _subtitleContainer.classList.remove(hideCls);
  //   }
  // }

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

  function _animateControls() {
    [subtitleSelectionCls, speedSelectionCls, qualitySelectionCls].forEach(function(x) {
      const elm = document.querySelector(`.${x}`);
      if (elm) elm.classList.add(hideCls);
    });
    _hideAll(hideOpacityCls);
  }

  function _onMouseIn() {
    _showAll(hideOpacityCls);
  }

  function _onMouseOut() {
    _animateControls();
  }

  function _onTouch() {
    if (_touchTimeout) {
      window.clearTimeout(_touchTimeout);
    }
    _showAll(hideOpacityCls);
    _touchTimeout = setTimeout(() => {
      _animateControls();
    }, 3e3);
  }

  function _initVideoInfo(videoObj) {
    if (!_initialized) {
      _initialized = true;
      _videoObj = videoObj;
      var tempQuality = _vectorFcn.getResolution ? _vectorFcn.getResolution() : null;
      
      if (_vectorFcn.getSubtitles) _subtitleOptions = _vectorFcn.getSubtitles();
      
      // optional controls i.e playback rate, quality, subtitle. we show them based on what we got from video e.g subtitle, quality
      // e.g if there is no subtitle then we don't show the CC button
      // if (!common.isMobile()) {
        if (true) _createOverlaySpeedMenu();
        if (tempQuality && tempQuality.tracks && tempQuality.tracks.length > 0) {
          _qualityOptions = tempQuality.tracks;
          _createOverlayQualityMenu();
        }
        console.log('_subtitleOptions', _subtitleOptions);
        if (_subtitleOptions.length > 0) _createOverlaySubtitleMenu();
      // }

      _onTouch();
      _showVisibility(_overlayBackwardBtn);
      _showVisibility(_overlayFastForwardBtn);

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
  
      if (_overlayVolumeRange) _overlayVolumeRange.setAttribute('data-volume', volume);
      _updateVolumeIcon(true, volume);

      if (_speedItems.length > 0) _speedItems.forEach((x) => x.classList.remove('active'));
      if (selectedPlaybackValue.length > 0) {
        selectedPlaybackValue[0].classList.add('active');
        speedValue.innerText = speed + 'x';
      }
      
      
      common.addListener(_container, "mouseover", _onMouseIn);
      common.addListener(_container, "mouseleave", _onMouseOut);
      common.addListener(videoObj, "webkitendfullscreen", function() {
        _showAll(hideCls);
        _updateFullscreenButton();
      });
    }
  }

  function _updateTimeElapsed(currentTime) {
    const timeElapsedText = document.getElementById(timeElapsedId + '-' + randNumb);
    const time = _formatTime(currentTime);
    timeElapsedText.innerText = `${time.minutes}:${time.seconds}`;
  }

  function _updatePlayBtn() {
    const playBtn = document.getElementById(`${playBtnId}-${randNumb}`);
    const playIcon = document.querySelector(`.${playBtnCls}`);
    const pauseIcon = document.querySelector(`.${pauseBtnCls}`);
    const bigPlayIcon = document.querySelector(`.${overlayBigPlayBtnCls}`);
    const bigPauseIcon = document.querySelector(`.${overlayBigPauseBtnCls}`);
    if (!_vectorFcn.isPaused()) {
      if (playIcon) playIcon.classList.add(hideCls);
      if (bigPlayIcon) bigPlayIcon.classList.add(hideCls);
      if (pauseIcon) pauseIcon.classList.remove(hideCls);
      if (bigPauseIcon) bigPauseIcon.classList.remove(hideCls);
      playBtn.setAttribute('data-title', 'Pause');
    } else {
      if (playIcon) playIcon.classList.remove(hideCls);
      if (bigPlayIcon) bigPlayIcon.classList.remove(hideCls);
      if (pauseIcon) pauseIcon.classList.add(hideCls);
      if (bigPauseIcon) bigPauseIcon.classList.add(hideCls);
      playBtn.setAttribute('data-title', 'Play');
    }
  }

  function _togglePlay() {
    if (_vectorFcn.isPaused()) {
      _vectorFcn.play();
      _state = "play";
      if (elmArr.findIndex(x => x === _bigPlayBtn) === -1) elmArr.push(_bigPlayBtn);
    } else {
      _vectorFcn.pause();
      _state = "pause";
      if (elmArr.findIndex(x => x === _bigPlayBtn) > -1) elmArr = elmArr.filter(x => x !== _bigPlayBtn);
    }
  }

  function _toggleMute() {
    if (_vectorFcn.isMuted()) {
      _vectorFcn.unMute();
      if (_overlayVolumeRange) _updateVolumeIcon(false, _overlayVolumeRange.dataset.volume);
    } else {
      _vectorFcn.mute();
      if (_overlayVolumeRange) {
        _overlayVolumeRange.setAttribute('data-volume', _overlayVolumeRange.value);
        _overlayVolumeRange.value = 0;
        _overlayVolumeRange.classList.add(hideCls);
      }
    }
  }

  function _updateVolume(isInit, volume) {
    const min = _overlayVolumeRange.min;
    const max = _overlayVolumeRange.max;
    const val = volume ? volume : _overlayVolumeRange.value;
    
    if (_vectorFcn.isMuted() && !isInit) {
      _vectorFcn.unMute();
    }
    if (_overlayVolumeRange) {
      _overlayVolumeRange.value = val;
      _overlayVolumeRange.style.backgroundSize = (val - min) * 100 / (max - min) + '% 100%';
    }
    _vectorFcn.setVolume(val);
  }

  function _updateVolumeIcon(isInit, volume) {
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
      if (_overlayVolumeRange) _overlayVolumeRange.classList.add(hideCls);
      
      _vectorFcn.mute();
    } else {
      if (volume > 0 && volume < 0.3) {
        lowIcon.classList.remove(hideCls);
      } else if (volume > 0 && volume >= 0.3 && volume <= 0.5) {
        midIcon.classList.remove(hideCls);
      } else {
        highIcon.classList.remove(hideCls);
      }

      if (_overlayVolumeRange) {
        _overlayVolumeRange.classList.remove(hideCls);
        _updateVolume(isInit, volume);
      }
    }
  }

  function _toggleFullScreen() {
    if (!common.isIOS()) {
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
    } else {
      if (_videoObj.webkitSupportsFullscreen) {
        _hideAll(hideCls);
        _videoObj.webkitEnterFullscreen();
      }
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
    subtitleValue.innerText = dataset.subtitle.toUpperCase();

    console.log('subtitle selected is --->', dataset.subtitle);
    _vectorFcn.setSubtitle(this.subtitle);
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

    console.log('Selected Quality is -->', Number(dataset.quality));
    if (_vectorFcn.setResolution) _vectorFcn.setResolution(this.track);

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

  function _setVideoTitle(title) {
    if (!_videoTitle) _videoTitle = common.newDiv(_videoTitleDiv, "div", title);
  }

  /**
   * If somehow somehow the play started then this should be called.
   * (play can start thru various channels ... See comment for _clickedCB function above.
   * actually I am thinking, once the play starts, we can just remove the thumbnail??
   */
  FactoryOneCustomControls.prototype.videoVisualsHide = function () {
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
  FactoryOneCustomControls.prototype.showBigPlayBtn = function (cb) {
    if (_bigPlayBtn) {
      if (cb) {
        _knownClickCBs.push(cb);
        //note: may be no need to bind already...
        _boundClickedCB = _clickedCB.bind({ cb: cb });
        common.addListener(_bigPlayBtn, "click", _boundClickedCB); //not sure about touch
      }

      _bigPlayBtn.classList.remove(hideCls);
    }
  };

  //a function to be bound
  function imgLoadedFcn() {
    try {
      this.img.removeEventListener("load", _boundImgLoadedFcn);
      if (_videoTitleDiv) _videoTitleDiv.classList.remove(hideOpacityCls);
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
  FactoryOneCustomControls.prototype.videoVisualsInit = function (thumbnailURL,imgLoadedCB) {
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
  FactoryOneCustomControls.prototype.videoVisualsRemoveSpinner = function () {
    _hideSpinner();
  };
  FactoryOneCustomControls.prototype.showControls = function () {
    if (_videoControls) _videoControls.classList.remove(hideCls);
  };
  FactoryOneCustomControls.prototype.hideControls = function () {
    if (_videoControls) _videoControls.classList.add(hideCls);
  };
  FactoryOneCustomControls.prototype.updateTimeElapsed = function (currTime) {
    _updateTimeElapsed(currTime);
  };
  FactoryOneCustomControls.prototype.initializeVideoInfo = function (videoObj) {
    _initVideoInfo(videoObj);
  };
  FactoryOneCustomControls.prototype.updatePlayBtn = function () {
    _updatePlayBtn();
  };
  FactoryOneCustomControls.prototype.updateVolume = function (vol) {
    _updateVolumeIcon(false, vol);
  };
  FactoryOneCustomControls.prototype.updateFullscreen = function () {
    _updateFullscreenButton();
  };
  FactoryOneCustomControls.prototype.updateProgressBar = function (time) {
    _updateProgressBar(time);
  };
  FactoryOneCustomControls.prototype.setVideoTitle = function (title) {
    _setVideoTitle(title);
  };
  FactoryOneCustomControls.prototype.showNativeControl= function(){
    return false;
  };
  FactoryOneCustomControls.prototype.lastPPGesture = function () {
    return _state;
  };

  let ret = new FactoryOneCustomControls(container, vectorFcn);
  return ret;
}
module.exports = MakeOneNewPlayerControlsObj;
