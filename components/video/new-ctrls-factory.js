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
const bigPlayBtnCls = cssmgr.getRealCls("bigPlayBtnCls");
const playbackAnimationCls = cssmgr.getRealCls("playbackAnimationCls");
const overlayBigPlayBtnCls = cssmgr.getRealCls("overlayBigPlayBtnCls");
const overlayBigPauseBtnCls = cssmgr.getRealCls("overlayBigPauseBtnCls");

const overlayControlCls = cssmgr.getRealCls("overlayControlCls");
const overlayTitleCls = cssmgr.getRealCls("overlayTitleCls");
const bottomControlCls = cssmgr.getRealCls("bottomControlsCls");
const leftControlCls = cssmgr.getRealCls("leftControlsCls");
const rightControlCls = cssmgr.getRealCls("rightControlsCls");
const volumeControlCls = cssmgr.getRealCls("volumeControlCls");

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
const speedValueCls = cssmgr.getRealCls("speedValueCls");
const speedSelectionCls = cssmgr.getRealCls("speedSelectionCls");
const settingBtnCls = cssmgr.getRealCls("settingBtnCls");
const qualitySelectionCls = cssmgr.getRealCls("qualitySelectionCls");
const qualityItemsCls = cssmgr.getRealCls("qualityItemsCls");

const playBtnId = "playBtn";
const volumeBtnId = "volumeBtn"
const volumePanelId = "volumePanel"
const muteBtnId = "muteBtn";
const vLowId = "volumeLow";
const vMidId = "volumeMid";
const vHighId = "volumeHigh";
const fullScreenBtnId = "fullScreenBtn";
const speedBtnId = "speedBtn";
const qualityBtnId = "qualityBtn";
// const speedValueId = "speedValue";

const timeElapsedId = "time-elapsed";
const durationId = "duration";

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
  var _rightControls = null;
  var _videoTitle = null;
  var _overlayPlayBtn = null;
  var _overlayBigPlayBtn = null;
  var _overlayVolumeBtn = null;
  var _overlayVolumeRange = null;
  var _overlayFScreenBtn = null;
  var _overlaySpeedBtn = null;
  var _overlayQualityBtn = null;

  var _speedItems = null;
  var _qualityItems = null;

  const randNumb = Math.floor(Math.random() * 1000);

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

    resizeObserver = new ResizeObserver(_onVideoResized);
    resizeObserver.observe(_container);

    _videoControls = document.createElement("div");
    _videoControls.className = overlayControlCls +' '+ hideOpacityCls;
    _videoControls.innerHTML = _generateControls();

    _videoTitle = document.createElement("div");
    _videoTitle.className = overlayTitleCls +' '+ hideOpacityCls;
    _videoTitle.innerHTML = "<div>This is the title of video</div>";

    _overlayBigPlayBtn = document.createElement("div");
    _overlayBigPlayBtn.className = playbackAnimationCls +' '+hideCls;
    _overlayBigPlayBtn.innerHTML = `<span class="${overlayBigPlayBtnCls}"></span>
                            <span class="${overlayBigPauseBtnCls} ${hideCls}"></span>`;

    _container.appendChild(_videoTitle);
    _container.appendChild(_videoControls);
    _container.appendChild(_overlayBigPlayBtn);

    _rightControls = document.querySelector(`.${rightControlCls}`);

    _overlayPlayBtn = document.getElementById(`${playBtnId}-${randNumb}`);
    _overlayPlayBtn.addEventListener('click', _togglePlay);
    _overlayBigPlayBtn.addEventListener('click', _togglePlay);

    _overlayVolumeBtn = document.getElementById(`${volumeBtnId}-${randNumb}`);
    _overlayVolumeBtn.addEventListener('click', _toggleMute);

    _overlayVolumeRange = document.getElementById(`${volumePanelId}-${randNumb}`);
    _overlayVolumeRange.addEventListener('input', _updateVolume);

    _overlayFScreenBtn = document.getElementById(`${fullScreenBtnId}-${randNumb}`);
    _overlayFScreenBtn.addEventListener('click', _toggleFullScreen);

    _overlaySpeedBtn = document.getElementById(`${speedBtnId}-${randNumb}`);
    _overlaySpeedBtn.addEventListener('click', _toggleSpeedSelection);

    _speedItems = document.querySelectorAll(`.${speedSelectionCls} div`);
    _speedItems.forEach((x) => x.addEventListener('click', _selectSpeed));

    _overlayQualityBtn = document.getElementById(`${qualityBtnId}-${randNumb}`);
    _overlayQualityBtn.addEventListener('click', _toggleQualitySelection);

    _qualityItems = document.querySelectorAll(`.${qualityItemsCls}`);
    _qualityItems.forEach((x) => x.addEventListener('click', _selectQuality));

    window.addEventListener('click', _onWindowClick);
  }

  FactoryOneNewPlayerControls.prototype.reset = function () {
    if (_bigPlayBtn) {
      _container.removeChild(_bigPlayBtn);
      _bigPlayBtn = null;
    }
    if (_overlayBigPlayBtn) {
      _container.removeChild(_overlayBigPlayBtn);
      _overlayBigPlayBtn = null;
    }
    if (_thumbnailImg) {
      _container.removeChild(_thumbnailImg);
      _thumbnailImg = null;
    }
    if (resizeObserver) resizeObserver = null
    if (_videoControls) {
      _container.removeChild(_videoControls);
      _videoControls = null;
    }
    if (_videoTitle) {
      _container.removeChild(_videoTitle);
      _videoTitle = null;
    }
    window.removeEventListener('click', _onWindowClick);
    _container.removeEventListener('mouseover', _onVideoHovered);
    _container.removeEventListener('mouseout', _onMouseOutVideo);

    // dunno if we still need to do this after removing the video controls element from the DOM
    // coz all of this below elements are the child of the video controls element
    // if (_overlayPlayBtn) {
    //   _overlayPlayBtn.removeEventListener('click', _togglePlay);
    //   _overlayPlayBtn = null;
    // }
    // if (_overlayVolumeBtn) {
    //   _overlayVolumeBtn.removeEventListener('click', _toggleMute);
    //   _overlayVolumeBtn = null;
    // }
    // if (_overlayVolumeRange) {
    //   _overlayVolumeRange.removeEventListener('input', _updateVolume);
    //   _overlayVolumeRange = null;
    // }
    // if (_overlayFScreenBtn) {
    //   _overlayFScreenBtn.removeEventListener('click', _toggleFullScreen);
    //   _overlayFScreenBtn = null;
    // }
    // if (_overlaySpeedBtn) {
    //   _overlaySpeedBtn.removeEventListener('click', _toggleSpeedSelection);
    //   _overlaySpeedBtn = null;
    // }
    // if (_speedItems) {
    //   _speedItems.forEach((x) => x.removeEventListener('click', _selectSpeed));
    //   _speedItems = null;
    // }
    // if (_overlayQualityBtn) {
    //   _overlayQualityBtn.removeEventListener('click', _toggleQualitySelection);
    //   _overlayQualityBtn = null;
    // }
    // if (_qualityItems) {
    //   _qualityItems.forEach((x) => x.removeEventListener('click', _selectQuality));
    //   _qualityItems = null;
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
    if (_bigPlayBtn) {
      _hideBigPlayBtn();
    }

    if (_thumbnailImg) _thumbnailImg.classList.add(hideCls);
    if (_boundClickedCB) {
      common.removeListener(_bigPlayBtn, "click", _boundClickedCB);
      _boundClickedCB = null;
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
  function _showControls() {
    _videoControls.classList.remove(hideOpacityCls);
  }
  function _hideControls() {
    _videoControls.classList.add(hideOpacityCls);
  }
  function _hideVideoTitle() {
    _videoTitle.classList.add(hideOpacityCls);
  }
  function _showVideoTitle() {
    _videoTitle.classList.remove(hideOpacityCls);
  }
  function _hideBigPlayBtn() {
    _bigPlayBtn.classList.add(hideCls);
  }
  function _showBigPlayBtn() {
    _bigPlayBtn.classList.remove(hideCls);
  }
  function _hideOverlayBigPlayBtn() {
    _overlayBigPlayBtn.classList.add(hideCls);
  }
  function _showOverlayBigPlayBtn() {
    _overlayBigPlayBtn.classList.remove(hideCls);
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
    if (!_overlayQualityBtn.contains(e.target)) {
      const qualitySelection = document.querySelector(`.${qualitySelectionCls}`)
      qualitySelection.classList.add(hideCls);
    }
    if (!_overlaySpeedBtn.contains(e.target)) {
      const speedSelection = document.querySelector(`.${speedSelectionCls}`)
      speedSelection.classList.add(hideCls);
    }
  }

  function _onVideoHovered() {
    _showControls();
    _showVideoTitle();
  }
  function _onMouseOutVideo() {
    _hideControls();
    _hideVideoTitle();
  }

  function _generateControls() {
    return `<div class="${bottomControlCls}">
      <div class="${leftControlCls}">
        <button data-title="Play" id="${playBtnId}-${randNumb}">
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
        </div>
      </div>
      <div class="${rightControlCls}">
        <div class="${speedContainerCls}">
          <button data-title="Speed" id="${speedBtnId}-${randNumb}">
            <span class="${speedValueCls}">1x</span>
          </button>
          <div class="${speedSelectionCls} ${hideCls}">
            <div data-title="0.25" data-playback="0.25">0.25</div>
            <div data-title="0.5" data-playback="0.5">0.5</div>
            <div data-title="1" data-playback="1">1</div>
            <div data-title="1.5" data-playback="1.5">1.5</div>
            <div data-title="2" data-playback="2">2</div>
          </div>
        </div>
        <div style="position: relative;">
          <button data-title="Quality" id="${qualityBtnId}-${randNumb}">
            <span class="${settingBtnCls}"></span>
          </button>
          <div class="${qualitySelectionCls} ${hideCls}">
            <div style="pointer-events:none; user-select:none;">Quality</div>
            <div data-title="1080p" class="${qualityItemsCls}" data-quality="1080">1080p</div>
            <div data-title="720p" class="${qualityItemsCls}" data-quality="720">720p</div>
            <div data-title="480p" class="${qualityItemsCls}" data-quality="480">480p</div>
            <div data-title="360p" class="${qualityItemsCls}" data-quality="360">360p</div>
          </div>
        </div>
        <button data-title="Full screen" id="${fullScreenBtnId}-${randNumb}" style="margin-right:0;">
          <span class="${fullscreenBtnCls}"></span>
          <span class="${fullscreenExitBtnCls} ${hideCls}"></span>
        </button>
      </div>
    </div>`
  }

  function _initVideoInfo(videoObj) {
    if (!_initialized) {
      _initialized = true;

      const videoDuration = Math.round(videoObj.duration);
      const time = _formatTime(videoDuration);
      const volume = _vectorFcn.getVolume();
      const speed = videoObj.playbackRate;
      
      const durationText = document.getElementById(durationId + '-' + randNumb);
      const speedValue = document.querySelector(`.${speedValueCls}`);
      const selectedPlaybackValue = document.querySelectorAll(`.${speedSelectionCls} div[data-playback~="${speed}"]`);
  
      durationText.innerText = `${time.minutes}:${time.seconds}`;
  
      _overlayVolumeRange.value = volume;
      _updateVolume(true);
      _updateVolumeIcon(volume);

      _speedItems.forEach((x) => x.classList.remove('active'));
      selectedPlaybackValue[0].classList.add('active');
      speedValue.innerText = speed + 'x';

      _container.addEventListener('mouseover', _onVideoHovered);
      _container.addEventListener('mouseout', _onMouseOutVideo);
    }
  }

  function _updateTimeElapsed(currentTime) {
    const timeElapsedText = document.getElementById(timeElapsedId + '-' + randNumb);
    const time = _formatTime(currentTime);
    timeElapsedText.innerText = `${time.minutes}:${time.seconds}`;
  }

  function _updatePlayBtn() {
    const playbackIcons = document.querySelectorAll(`#${playBtnId}-${randNumb} span`);
    const playbackAnimationIcons = document.querySelectorAll(`.${playbackAnimationCls} span`);
    const playBtn = document.getElementById(`${playBtnId}-${randNumb}`);

    playbackIcons.forEach((x) => x.classList.toggle(hideCls));
    playbackAnimationIcons.forEach((x) => x.classList.toggle(hideCls));

    _animatePlaybackBtn();
    if (!_vectorFcn.isPaused()) {
      playBtn.setAttribute('data-title', 'Pause');
    } else {
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

  function _toggleSpeedSelection() {
    const speedSelection = document.querySelector(`.${speedSelectionCls}`)
    speedSelection.classList.toggle(hideCls);
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

  function _toggleQualitySelection() {
    const qualitySelection = document.querySelector(`.${qualitySelectionCls}`)
    qualitySelection.classList.toggle(hideCls);
  }

  function _selectQuality(e) {
    const target = e.target;
    const dataset = target.dataset;

    _qualityItems.forEach((x) => x.classList.remove('active'));
    target.classList.add('active');

    console.log('Selected Quality is -->', dataset.quality) ;
  }

  function _animatePlaybackBtn() {
    if (_overlayBigPlayBtn) {
      if (_vectorFcn.isPaused()) {
        _showOverlayBigPlayBtn();
      } else {
        setTimeout(() => {
          _hideOverlayBigPlayBtn();
        }, 500);
      }
    }
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
      _bigPlayBtn = document.createElement("a");
      _bigPlayBtn.href = "javascript:void(0)";
      _bigPlayBtn.className = bigPlayBtnCls +' '+hideCls;

      _container.appendChild(_bigPlayBtn);
    }
    if (_bigPlayBtn) {
      if (cb) {
        _knownClickCBs.push(cb);
        //note: may be no need to bind already...
        _boundClickedCB = _clickedCB.bind({ cb: cb });
        common.addListener(_bigPlayBtn, "click", _boundClickedCB); //not sure about touch
      }

      _showBigPlayBtn();
      _showVideoTitle();
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
      _thumbnailImg.addEventListener("load", _boundImgLoadedFcn);
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
    _showControls();
  };
  FactoryOneNewPlayerControls.prototype.hideControls = function () {
    _hideControls();
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
  
  FactoryOneNewPlayerControls.prototype.reset = function () {};
  FactoryOneNewPlayerControls.prototype.togglePlay = function () {};
  FactoryOneNewPlayerControls.prototype.updateProgressBar = function () {};
  FactoryOneNewPlayerControls.prototype.showProgressBar = function () {};
  FactoryOneNewPlayerControls.prototype.hideProgressBar = function () {};
  FactoryOneNewPlayerControls.prototype.setTramsitionProgressBar =
    function () {}; //SPELLING

  let ret = new FactoryOneNewPlayerControls(container, vectorFcn);
  return ret;
}
module.exports = MakeOneNewPlayerControlsObj;
