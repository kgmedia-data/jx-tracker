/**
 * Makes a Control Object for PLAYER. In the end we decided not to...
 * So we are really using mostly the HTML5 <video>'s controls
 * THis object only do the big play button
 */

const modulesmgr = require("../basic/modulesmgr");
const common = modulesmgr.get("basic/common");
const cssmgr = modulesmgr.get("video/cssmgr");
const playbackRateArr = [0.25, 0.5, 1, 1.5, 2];
const skipOffset = 15;

function MakeOneNewPlayerControlsObj(container, vectorFcn) {
  function FactoryOneCustomControls() {}
  
  const randNumb = Math.floor(Math.random() * 1000); //when we need to make some ids of controls
  const durationId = 'durationId' + randNumb;
  
  const styles = cssmgr.getRealCls(container);
  var cOptions = cssmgr.getOptions(container);
  if (cOptions && cOptions.controls) {
    cOptions = cOptions.controls;
  }
  else {
    cOptions = {};
  }

  var _vectorFcn = null;
  var _container = null;
  var _thumbnailImg = null;
  var _bigPlayBtn = null;
  var _boundImgLoadedFcn = null;

  var _initialized = false;
  var elmArr = [];

  var _videoControls = null;
  var _bottomControls = null;
  var _rightControls = null;
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

  var _qualitySelection = null;
  var _speedSelection = null;
  var _subtitleSelection = null;
  var _volumeIcons = null;
  var _muteIcon = null;
  var _lowIcon = null;
  var _midIcon = null;
  var _highIcon = null;
  var _timeElapsed = null;
  var _playIconsSet = [];
  var _pauseIconsSet = [];

  var _touchTimeout = null;
  // var _btnTimeout = null;

  var _bigPlayBtnCls = styles.custBigPlayBtnCtr;

  var _videoObj = null;

  // Big play button:
  // at the start, if it is click-to-play, or autoplay was not successful, the
  // bigplay button will be shown there (without all the other little ding-dong
  // controls). 
  // At that special stage, if the bigPlayBtn is pressed, then it should do a bunch of
  // extra stuff (trigger events, call all the callback - which actually are important in
  // initial promise-chain progression - esp important if there is pure-preroll)
  // Whereas, for the subsequent appearances of it while the started video is being
  // playd/ paused, there is no such extra steps to do.  i.e. just to the _togglePlay stuff
  
  // these are the clickCB registered with our showbigPLayButtons.
  //all the callback functions (these are promise resolvers) we record so
  //that we call them at one go when there is a click
  //to avoid dangling promise chains.
  //Coz while we are still "in" one promise chain (setV) to get ready one video
  //user could very well (inpatient) click on another thumbnail in the widget
  //to launch yet another video in the playlist.
  // very troublesome to pass the object around.. so
  // 
  var _knownClickCBs = [];

  // <-- utilities (DOM query)
  function _byClass(classname) {
    return _container.querySelector("."+classname);
  }
  function _qsa(selector) {
    return _container.querySelectorAll(selector);
  }
  function _byId(id) {
    return document.getElementById(id);
  }
  // -->

  function FactoryOneCustomControls(container, vectorFcn) {
    _vectorFcn = vectorFcn;
    _container = container;

    // choices are: simple or 2color (may need to change the names)
    if (cOptions.bigplaybutton != 'simple') _bigPlayBtnCls = styles.roundBigPlayBtnCtr;

    cssmgr.inject(container, 'customControls');

    // resizeObserver = new ResizeObserver(_onVideoResized);
    // resizeObserver.observe(_container);

    // these things is for the life time for this player instance. i.e. when switching
    // video, they will not be destroyed:
    _videoControls = common.newDiv(_container, "div", null, styles.oBotCtrl);
    _videoTitleDiv = common.newDiv(_container, "div", null, styles.oTitle+' '+styles.hideOpacity);
    _bottomControls = common.newDiv(_videoControls, "div", null, styles.botCtrl);
    //_leftControls = _createLeftControls();
    _createLeftControls(_playIconsSet, _pauseIconsSet);
    _rightControls = _createRightControls();
    _centerControls = common.newDiv(_container, "div", null, styles.oCenterCtrl);
    _createBigPlayBtn(_playIconsSet, _pauseIconsSet);
    _createSkipButtons();
    _createProgressBar();

    elmArr = [_centerControls, _videoTitleDiv, _videoControls];

    common.addListener(window, "click", _onWindowClick);
    common.addListener(_container, "click", _onTouch);
    common.addListener(_container, "touchstart", _onTouch);
  }

  // these concerns those items which will be recreated for each video as video changes
  // in the player instance:
  FactoryOneCustomControls.prototype.reset = function () {
    _waitingOnBigPlayBtnStart = false;
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
    _qualitySelection = null;
    _speedSelection = null;
    _subtitleSelection = null;
    
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

  function _bigPlayB4StartClickCB(evtObject) {
    // if this is called from the context of a real click event handler,
    // then evtObject will not be undefined.
    _waitingOnBigPlayBtnStart = false;
    //this can come from hideBigPlayBtn
    //yes we report before we really do the resolve.
    if (evtObject && _vectorFcn.reportClickToStart) {
      _vectorFcn.reportClickToStart();
    }
    [_overlayBackwardBtn, _overlayFastForwardBtn].forEach(function(x) {
      if (x) x.classList.remove(styles.hide)
    });
    if (_thumbnailImg) _thumbnailImg.classList.add(styles.hide);

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
    // if (!_vectorFcn.isPaused()) {
    //   _bigPlayBtn.classList.remove(className);
    // }
    if (_vectorFcn.cbHoverControls) _vectorFcn.cbHoverControls(false);
  }

  function _hideAll(className) {
    elmArr.forEach(function(x) {
      if (x) x.classList.add(className);
    });
    // if (!_vectorFcn.isPaused()) {
    //   _bigPlayBtn.classList.add(className);
    // }
    if (_vectorFcn.cbHoverControls) _vectorFcn.cbHoverControls(true);
  }
  
  function _bigPlayClickCB(evtOjectMaybe) {
    if (_waitingOnBigPlayBtnStart) {
      // we cannot use if (bigPlayBtn)  as a criteria anymore.
      //the big play button is always created ahead of time nowadays
      _bigPlayB4StartClickCB(evtOjectMaybe);
    }
    else {
      _togglePlay();
    }
  }

  function _createBigPlayBtn(playIconsSet, pauseIconsSet) {
    if (!_bigPlayBtn) {
      const iHTML = `<span class="${styles.custBigPlayBtn} "></span>
                      <span class="${styles.custBigPauseBtn} ${styles.hide}"></span>`;
      _bigPlayBtn = common.newDiv(_centerControls, "div", iHTML, _bigPlayBtnCls);
      common.addListener(_bigPlayBtn, "click", _bigPlayClickCB);
      playIconsSet.push(_byClass(styles.custBigPlayBtn));
      pauseIconsSet.push(_byClass(styles.custBigPauseBtn));
   }
  }

  function _createLeftControls(playIconsSet, pauseIconsSet) {
    var iHTML = `<button data-title="Play" id="${'playBtnId'+randNumb}">
                  <span class="${styles.playBtn}"></span>
                  <span class="${styles.pauseBtn} ${styles.hide}"></span>
                </button>
                <div class="${styles.volCtrl}">
                  <button data-title="Mute" id="${'volumeBtnId'+randNumb}">
                    <span class="${styles.muteBtn} ${styles.hide}"></span>
                    <span class="${styles.volLow} ${styles.hide}"></span>
                    <span class="${styles.volMid} ${styles.hide}"></span>
                    <span class="${styles.volHigh}"></span>
                  </button>
                </div>
                <div class="${styles.timeDispCtr}">
                  <span id="${'timeElapsedId'+randNumb}">00:00</span>
                  <span>&nbsp;/&nbsp;</span>
                  <span id="${durationId}">00:00</span>
                </div>`;
    var ctrl = common.newDiv(_bottomControls, "div", iHTML, styles.leftCtrl);

    _overlayPlayBtn = _byId(`${'playBtnId'+randNumb}`);
    common.addListener(_overlayPlayBtn, "click", _togglePlay);

    _overlayVolumeBtn = _byId(`${'volumeBtnId'+randNumb}`);
    common.addListener(_overlayVolumeBtn, "click", _toggleMute);

    _volumeIcons = _qsa(`#${'volumeBtnId'+randNumb} span`);
    _muteIcon = _byClass(styles.muteBtn);
    _lowIcon = _byClass(styles.volLow);
    _midIcon = _byClass(styles.volMid);
    _highIcon = _byClass(styles.volHigh);
    _timeElapsed = _byId(`${'timeElapsedId'+randNumb}`);

    if (!common.isIOS()) {
      // then you wrong then?!
      const volumeControl = _byClass(styles.volCtrl);
      _overlayVolumeRange = common.newDiv(volumeControl, "input", null, styles.volPanel); //, `${volumePanelId}-${randNumb}`);
      _overlayVolumeRange.type = "range";
      _overlayVolumeRange.max = "1";
      _overlayVolumeRange.min = "0";
      _overlayVolumeRange.step = "0.01";
      common.addListener(_overlayVolumeRange, "input", _updateVolume);
    }
    playIconsSet.push(_byClass(styles.playBtn));
    pauseIconsSet.push(_byClass(styles.pauseBtn));
    return ctrl;
  }

  function _createRightControls() {
    var iHTML = `<button data-title="Full screen" id="${'fullScreenBtnId'+randNumb}" class="${styles.fsBtnCtr}">
                  <span class="${styles.fsBtn}"></span>
                  <span class="${styles.fsExitBtn} ${styles.hide}"></span>
                </button>`;
    let ctrl = common.newDiv(_bottomControls, "div", iHTML, styles.rightCtrl);
    _overlayFScreenBtn = _byId(`${'fullScreenBtnId'+randNumb}`);
    common.addListener(_overlayFScreenBtn, "click", _toggleFullScreen);
    return ctrl;
  }

  function _createOverlaySpeedMenu() {
    _speedContainer = common.newDiv(_rightControls, "div", null, styles.speedCtr);
    _overlaySpeedBtn = common.newDiv(_speedContainer, "button", `<span class="${styles.speedVal}">1x</span>`);
    _overlaySpeedBtn.dataset.title = "Speed";
    _speedSelection = common.newDiv(_speedContainer, "div", null, styles.speedMenu+' '+styles.hide);

    playbackRateArr.forEach(function(x) {
      var elm = common.newDiv(_speedSelection, "div", x);
      elm.dataset.title = x;
      elm.dataset.playback = x;
      common.addListener(elm, 'click', _selectSpeed);
      _speedItems.push(elm);
    });

    common.addListener(_overlaySpeedBtn, "click", function() {
      _toggleMenuSelection(_speedSelection);
    });
  }

  function _createOverlayQualityMenu() {
    _qualityContainer = common.newDiv(_rightControls, "div", null, styles.resBtnCtr);
    _overlayQualityBtn = common.newDiv(_qualityContainer, "button", `<span class="${styles.resBtn}"></span>`, null); // `${qualityBtnId}-${randNumb}`)
    _overlayQualityBtn.dataset.title = "Quality";
    _qualitySelection = common.newDiv(_qualityContainer, "div", "<div style='cursor:default'>Quality</div>", styles.resMenu+' '+styles.hide);

    _qualityOptions.unshift({ height: "auto" });
    if (_qualityOptions.length > 0) {
      _qualityOptions.forEach((x) => {
        if (x.height) {
          x.label = x.height.toString() === "auto" ? "Auto" : x.height+"p";
          x.active = x.height.toString() === "auto" ? true : false;

          var elm = common.newDiv(_qualitySelection, "div", x.label, styles.resItem);
          if (x.active) elm.classList.add("active");
          elm.dataset.title = x.label;
          elm.dataset.quality = x.height;
          common.addListener(elm, 'click', _selectQuality.bind({ track: x }));
          _qualityItems.push(elm);
        }

      })
    }

    common.addListener(_overlayQualityBtn, "click", function() {
      _toggleMenuSelection(_qualitySelection);
    });
  }

  function _createOverlaySubtitleMenu() {
    _subtitleContainer = common.newDiv(_rightControls, "div", null, styles.capCtr);
    _overlaySubtitleBtn = common.newDiv(_subtitleContainer, "button", `<span class="${styles.capVal}">CC</span>`, null); // `${subtitleBtnId}-${randNumb}`)
    _overlaySubtitleBtn.dataset.title = "Subtitle";
    _subtitleSelection = common.newDiv(_subtitleContainer, "div", "<div style='cursor:default'>Subtitle</div>", styles.capMenu+' '+styles.hide);

    _subtitleOptions.push({ label: "Off", language: "off", kind: "subtitle", active: true });
    if (_subtitleOptions.length > 0) {
      _subtitleOptions.forEach(function(x) {
        if (x.kind === "subtitle") {
          var elm = common.newDiv(_subtitleSelection, "div", x.label, styles.resItem);
          if (x.active) elm.classList.add("active");
          elm.dataset.title = x.label;
          elm.dataset.subtitle = x.language === "off" ? "CC" : x.language;
          common.addListener(elm, 'click', _selectSubtitle.bind({subtitle: x}));
          _subtitleItems.push(elm);
        }
      });
    }

    common.addListener(_overlaySubtitleBtn, "click", function() {
      _toggleMenuSelection(_subtitleSelection);
    });
  }

  function _createProgressBar() {
    const _progressBarWrapper = common.newDiv(_videoControls, "div", null, styles.vidProgCtr);
    _progressBar = common.newDiv(_progressBarWrapper, "progress", null, styles.vidProg);
    _progressBar.value = 0;
    _progressBar.min = 0;

    _progressBarInput = common.newDiv(_progressBarWrapper, "input", null, styles.vidProgInput);
    _progressBarInput.type = "range";
    _progressBarInput.value = 0;
    _progressBarInput.min = 0;
    _progressBarInput.step = 1;

    _progressBarTooltip = common.newDiv(_progressBarWrapper, "div", "00:00", styles.vidProgTooltip);
    common.addListener(_progressBarInput, "mousemove", _updateProgressBarTooltip);
    common.addListener(_progressBarInput, "input", _skipAhead);
  }


  const bwfwSVG = `<svg width="102" height="112" viewBox="0 0 102 112" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M90.2777 30.4143C88.9433 28.7737 86.5342 28.5077 84.8723 29.8175C83.2103 31.1273 82.9132 33.5261 84.2055 35.1999C90.167 42.6755 93.396 51.9537 93.3602 61.5048C93.3653 84.302 75.3133 103.033 52.4701 103.933C29.6268 104.834 10.1489 87.5814 8.34995 64.8548C6.551 42.1283 23.0734 22.0424 45.7754 19.3575L40.5333 23.84C38.9744 25.2412 38.8195 27.6261 40.1841 29.2161C41.5487 30.8061 43.9355 31.0218 45.5644 29.7023L59.1098 18.1244C59.9683 17.3912 60.4624 16.3204 60.4624 15.1933C60.4624 14.0662 59.9683 12.9954 59.1098 12.2622L45.5644 0.684277C44.5198 -0.254672 43.0466 -0.554605 41.7165 -0.0991377C40.3863 0.35633 39.4087 1.4955 39.1628 2.87634C38.917 4.25718 39.4417 5.66233 40.5333 6.54654L46.3752 11.5385C19.2661 13.9194 -1.03062 37.3647 0.564199 64.4561C2.15901 91.5475 25.0672 112.464 52.2695 111.665C79.4717 110.866 101.106 88.6429 101.1 61.5048C101.142 50.2158 97.3245 39.2497 90.2777 30.4143Z"
        />
      <path
        d="M65.2653 29.2792C65.9333 30.0568 66.8839 30.5379 67.9077 30.6164C68.9315 30.695 69.9447 30.3645 70.7241 29.6979L84.2695 18.12C85.1279 17.3868 85.622 16.316 85.622 15.1889C85.622 14.0617 85.1279 12.9909 84.2695 12.2577L70.7241 0.679852C69.6795 -0.259097 68.2062 -0.55903 66.8761 -0.103563C65.546 0.351905 64.5683 1.49108 64.3225 2.87192C64.0767 4.25276 64.6014 5.65791 65.693 6.54212L75.8036 15.1927L65.6891 23.8395C64.0664 25.2253 63.8767 27.6601 65.2653 29.2792Z"
        />
    </svg>`;
  
  function _createSkipButtons() {
    const skipText = `<span>${skipOffset}</span>`;

    _overlayBackwardBtn = common.newDiv(_centerControls, "div", bwfwSVG, `${styles.bwrdBtnCtr}`);
    _overlayFastForwardBtn = common.newDiv(_centerControls, "div", bwfwSVG, `${styles.ffwrdBtnCtr}`);

    _overlayFastForwardBtn.insertAdjacentHTML('beforeend', skipText);
    _overlayBackwardBtn.insertAdjacentHTML('beforeend', skipText);

    common.addListener(_overlayBackwardBtn, "click", function() {
      if (_vectorFcn.setVideoPlayhead) _vectorFcn.setVideoPlayhead(_vectorFcn.getCurrentTime() - skipOffset);
    });
    common.addListener(_overlayFastForwardBtn, "click", function() {
      if (_vectorFcn.setVideoPlayhead) _vectorFcn.setVideoPlayhead(_vectorFcn.getCurrentTime() + skipOffset);
    });
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
  //     if(_qualityContainer) _qualityContainer.classList.add(styles.hide);
  //     if(_speedContainer) _speedContainer.classList.add(styles.hide);
  //     if(_subtitleContainer) _subtitleContainer.classList.add(styles.hide);
  //   } else {
  //     if(_qualityContainer) _qualityContainer.classList.remove(styles.hide);
  //     if(_speedContainer) _speedContainer.classList.remove(styles.hide);
  //     if(_subtitleContainer) _subtitleContainer.classList.remove(styles.hide);
  //   }
  // }

  

  function _onWindowClick(e) {
    if (_overlayQualityBtn && !_overlayQualityBtn.contains(e.target)) {
      // Cannot always call all these DOM queries when we can easily easily remember this 
      // blob const qualitySelection = common.qs(`.${styles.resMenu}`);
      //also by doing that, you could trigger another player's controls...
      _qualitySelection.classList.add(styles.hide);
    }
    if (_overlaySpeedBtn && !_overlaySpeedBtn.contains(e.target)) {
      //const speedSelection = common.qs(`.${styles.speedMenu}`);
      _speedSelection.classList.add(styles.hide);
    }
    if (_overlaySubtitleBtn && !_overlaySubtitleBtn.contains(e.target)) {
      //const subtitleSelection = common.qs(`.${styles.capMenu}`);
      _subtitleSelection.classList.add(styles.hide);
    }
  }

  function _animateControls() {
    //[styles.capMenu, styles.speedMenu, styles.resMenu].forEach(function(x) {
      //const elm = common.qs(`.${x}`);
      //if (elm) elm.classList.add(styles.hide);
    //});
    if (_qualitySelection) _qualitySelection.classList.add(styles.hide);
    if (_speedSelection)   _speedSelection.classList.add(styles.hide);
    if (_subtitleSelection) _subtitleSelection.classList.add(styles.hide);
    _hideAll(styles.hideOpacity);
  }

  function _onMouseIn() {
    _showAll(styles.hideOpacity);
  }

  function _onMouseOut() {
    _animateControls();
  }

  function _onTouch() {
    if (_touchTimeout) {
      window.clearTimeout(_touchTimeout);
    }
    _showAll(styles.hideOpacity);
    _touchTimeout = setTimeout(() => {
      _animateControls();
    }, 3e3);
  }

  function _initVideoInfo(videoObj) {
    // TODO (RENEE) anyhow do first. need properly integrate to get the real options.
    let ocontrols = {
      speed: 1,
      quality: 1,
      subtitles: 1
    };
    if (!_initialized) {
      _initialized = true;
      _videoObj = videoObj;
      var tempQuality = _vectorFcn.getResolution ? _vectorFcn.getResolution() : null;
      if (_vectorFcn.getSubtitles) _subtitleOptions = _vectorFcn.getSubtitles();
      
      // optional controls i.e playback rate, quality, subtitle. we show them based on what we got from video e.g subtitle, quality
      // e.g if there is no subtitle then we don't show the CC button
      // if (!common.isMobile()) {
        if (ocontrols.speed) {
          _createOverlaySpeedMenu();
        }
        if (ocontrols.quality) {
          if (tempQuality && tempQuality.tracks && tempQuality.tracks.length > 0) {
            _qualityOptions = tempQuality.tracks;
            _createOverlayQualityMenu();
          }
        }
        //if (_subtitleOptions.length > 0) _createOverlaySubtitleMenu();
        if (ocontrols.subtitles) {
          if (_vectorFcn.getSubtitles) _subtitleOptions = _vectorFcn.getSubtitles();
            _createOverlaySubtitleMenu();
        }
      // }

      _onTouch();
      _showVisibility(_overlayBackwardBtn);
      _showVisibility(_overlayFastForwardBtn);

      const videoDuration = Math.round(videoObj.duration);
      const time = _formatTime(videoDuration);
      const volume = _vectorFcn.getVolume();
      const speed = videoObj.playbackRate;
      
      const durationText = _byId(durationId);
      const speedValue = _byClass(styles.speedVal);
      const selectedPlaybackValue = _qsa(`.${styles.speedMenu} div[data-playback~="${speed}"]`);
  
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
        _showAll(styles.hide);
        _updateFullscreenButton();
      });
    }
  }

  function _updateTimeElapsed(currentTime) {
    //why need to byId get from the DOM every time leh???
    // every second ??! 
    const time = _formatTime(currentTime);
    _timeElapsed.innerText = `${time.minutes}:${time.seconds}`;
  }

  // function _animateBigPlayBtn() {
  //   if (_btnTimeout) {
  //     window.clearTimeout(_btnTimeout);
  //   }
  //   _btnTimeout = setTimeout(() => {
  //     _bigPlayBtn.classList.add(styles.hideOpacity);
  //   }, 3e3);
  // }

  function _updatePlayBtn() {
    if (!_vectorFcn.isPaused()) {
      _playIconsSet.forEach(function(one) {
        one.classList.add(styles.hide);
      });
      _pauseIconsSet.forEach(function(one) {
        one.classList.remove(styles.hide);
      });
      _overlayPlayBtn.setAttribute('data-title', 'Pause');
      // _animateBigPlayBtn();
    } else {
      _playIconsSet.forEach(function(one) {
        one.classList.remove(styles.hide);
      });
      _pauseIconsSet.forEach(function(one) {
        one.classList.add(styles.hide);
      });
      _overlayPlayBtn.setAttribute('data-title', 'Play');
      // _bigPlayBtn.classList.remove(styles.hideOpacity);
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
      if (_overlayVolumeRange) _updateVolumeIcon(false, _overlayVolumeRange.dataset.volume);
    } else {
      _vectorFcn.mute();
      if (_overlayVolumeRange) {
        _overlayVolumeRange.setAttribute('data-volume', _overlayVolumeRange.value);
        _overlayVolumeRange.value = 0;
        _overlayVolumeRange.classList.add(styles.hide);
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
    _volumeIcons.forEach((x) => x.classList.add(styles.hide));
    _overlayVolumeBtn.setAttribute('data-title', 'Mute');
    if (_vectorFcn.isMuted() || volume === 0) {
      _muteIcon.classList.remove(styles.hide);
      _overlayVolumeBtn.setAttribute('data-title', 'Unmute');
      if (_overlayVolumeRange) _overlayVolumeRange.classList.add(styles.hide);
      _vectorFcn.mute();
    } else {
      if (volume > 0 && volume < 0.3) {
        _lowIcon.classList.remove(styles.hide);
      } else if (volume > 0 && volume >= 0.3 && volume <= 0.5) {
        _midIcon.classList.remove(styles.hide);
      } else {
        _highIcon.classList.remove(styles.hide);
      }

      if (_overlayVolumeRange) {
        _overlayVolumeRange.classList.remove(styles.hide);
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
        _hideAll(styles.hide);
        _videoObj.webkitEnterFullscreen();
      }
    }
  }

  function _updateFullscreenButton() {
    const fullscreenIcons = _qsa(`#${'fullScreenBtnId'+randNumb} span`);
    fullscreenIcons.forEach((icon) => icon.classList.toggle(styles.hide));
  
    if (document.fullscreenElement) {
      _overlayFScreenBtn.setAttribute('data-title', 'Exit full screen');
    } else {
      _overlayFScreenBtn.setAttribute('data-title', 'Full screen');
    }
  }

  function _selectSubtitle(e) {
    const dataset = e.target.dataset;
    const subtitleValue = _byClass(styles.capVal);

    _subtitleItems.forEach((x) => x.classList.remove('active'));
    e.target.classList.add('active');
    subtitleValue.innerText = dataset.subtitle.toUpperCase();
    _vectorFcn.setSubtitle(this.subtitle);
  }

  function _selectSpeed(e) {
    const dataset = e.target.dataset;
    const speedValue = _byClass(styles.speedVal);
    _speedItems.forEach((x) => x.classList.remove('active'));
    e.target.classList.add('active');
    speedValue.innerText = dataset.playback + 'x';
    _vectorFcn.setPlaybackRate(Number(dataset.playback));
  }

  function _selectQuality(e) {
    _qualityItems.forEach((x) => x.classList.remove('active'));
    e.target.classList.add('active');
    if (_vectorFcn.setResolution) _vectorFcn.setResolution(this.track);

  }

  function _toggleMenuSelection(menuSelection) {
    menuSelection.classList.toggle(styles.hide);
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
  FactoryOneCustomControls.prototype.hideVVisual = function () {
    _hideSpinner();
    // if the big play button was shown (but somehow somehow the play still managed ... strangely, to start)
    // then we should still call ths _bigPlayB4StartClickCB
    if (_bigPlayBtn && _waitingOnBigPlayBtnStart) {
      _bigPlayB4StartClickCB();
    } else {
      if (_thumbnailImg) {
        _thumbnailImg.classList.add(styles.hide);
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
   FactoryOneCustomControls.prototype.showStarterPlayBtn = function (cb) {
    if (_bigPlayBtn) { // it should now always be non null then
      if (cb) {
        _knownClickCBs.push(cb);
      }
      _waitingOnBigPlayBtnStart = true;
    }
  };

  //a function to be bound
  function imgLoadedFcn() {
    try {
      this.img.removeEventListener("load", _boundImgLoadedFcn);
      if (_videoTitleDiv) _videoTitleDiv.classList.remove(styles.hideOpacity);
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
  FactoryOneCustomControls.prototype.initVVisual = function (thumbnailURL,imgLoadedCB) {
    _showSpinner();
    if (!_thumbnailImg) {
      //let r = Math.floor(Math.random() * 2000 + 1);
      //let thumbnailID = styles.thumbnail + "-" + r; //want ID for wat?
      _thumbnailImg = common.newDiv(
        _container,
        "img",
        null,
        styles.thumbnailCls
        //thumbnailID
      );
    }
    if (thumbnailURL && thumbnailURL != _thumbnailImg.src) {
      _boundImgLoadedFcn = imgLoadedFcn.bind({
        img: _thumbnailImg,
        cb: imgLoadedCB,
      });
      common.addListener(_thumbnailImg, "load", _boundImgLoadedFcn);
      common.addListener(_thumbnailImg, 'click', function(){
        if (_bigPlayBtn) {
            try {
                _bigPlayBtn.click();
            }
            catch(e) {}
        }
    });
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
  FactoryOneCustomControls.prototype.hideSpinner = function () {
    _hideSpinner();
  };
  FactoryOneCustomControls.prototype.showCtrl = function () {
    if (_videoControls) _videoControls.classList.remove(styles.hide);
  };
  FactoryOneCustomControls.prototype.hideCtrl = function () {
    if (_videoControls) _videoControls.classList.add(styles.hide);
  };
  FactoryOneCustomControls.prototype.setTimer = function (currTime) {
    _updateTimeElapsed(currTime);
  };
  FactoryOneCustomControls.prototype.setVInfo = function (videoObj) {
    _initVideoInfo(videoObj);
  };
  FactoryOneCustomControls.prototype.setPlayBtn = function () {
    _updatePlayBtn();
  };
  FactoryOneCustomControls.prototype.setVolIcon = function (vol) {
    _updateVolumeIcon(false, vol);
  };
  FactoryOneCustomControls.prototype.updateFsIcon = function () {
    _updateFullscreenButton();
  };
  FactoryOneCustomControls.prototype.setProg = function (time) {
    _updateProgressBar(time);
  };
  FactoryOneCustomControls.prototype.setVTitle = function (title) {
    _setVideoTitle(title);
  };
  FactoryOneCustomControls.prototype.showNativeCtrl= function(){
    return false;
  };
  let ret = new FactoryOneCustomControls(container, vectorFcn);
  return ret;
}
module.exports = MakeOneNewPlayerControlsObj;
