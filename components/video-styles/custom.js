const ran                   = Math.floor(Math.random() * (99999) + 1)
const contentDivCls         = 'contentDivCls' + ran;
const adDivCls              = 'adDivCls' + ran;
const playerCls             = 'playerCls' + ran;
const thumbnailCls          = 'thumbnailCls' + ran;
const adControlsCls         = 'adControlsCls' + ran;
const playerControlsCls     = 'playerControlsCls' + ran;
const iconCls               = 'iconCls'  + ran;
const bigPlayBtnCls         = 'bigPlayBtnCls' + ran;
const commonBigPlayBtnCls   = 'commonBigPlayBtnCls' + ran;
const adPlayBtnCls          = 'adPlayBtnCls' + ran;
const adMuteBtnCls          = 'adMuteBtnCls' + ran;
const adProgressBarCls      = 'adProgressBarCls' + ran;
const hideCls               = 'hideCls' + ran;
const adHideCls             = 'adHideCls' + ran;
const hideOpacityCls        = 'hideOpacityCls' + ran;
//const controlsColor         = '#FF0000';
const spinnerCls            = 'spinnerCls' + ran; 

const overlayControlCls     = 'JXOverlayControls' + ran;
const overlayCenterControlsCls = 'overlayCenterControlsCls'+ ran;
const overlayTitleCls       = 'JXOverlayTitle' + ran;
const leftControlsCls       = 'leftControls' + ran;
const rightControlsCls      = 'rightControls' + ran;
const bottomControlCls      = 'bottomControls' + ran;
const fullscreenBtnCls      = 'fullscrrenBtn' + ran;
const fullscreenExitBtnCls  = 'fullscrrenExitBtn' + ran;
const playBtnCls            = 'playBtn' + ran;
const pauseBtnCls           = 'pauseBtn' + ran;
const muteBtnCls            = 'muteBtn' + ran;
const volumeLowCls          = 'volumeLow' + ran;
const volumeMidCls          = 'volumeMid' + ran;
const volumeHighCls         = 'volumeHigh' + ran;
const settingBtnCls         = 'qualityBtn' + ran;
const speedContainerCls     = 'speedContainer' + ran;
const qualityContainerCls   = 'qualityContainerCls' + ran;
const fullScreenBtnContainer= 'fullScreenBtnContainer' + ran;
const subtitleContainerCls  = 'subtitleContainer' + ran;
const speedValueCls         = 'speedValue' + ran;
const subtitleValueCls      = 'subtitleValue' + ran;
const speedSelectionCls     = 'speedSelectionCls' + ran;
const subtitleSelectionCls  = 'subtitleSelectionCls' + ran;
const qualitySelectionCls   = 'qualitySelection' + ran;
const qualityItemsCls       = 'qualityItems' + ran;
const playbackAnimationCls  = 'playbackAnimation' + ran;
const playbackRoundedCls    = 'playbackRounded' + ran;
const overlayBigPlayBtnCls  = 'overlayBigPlayBtn' + ran;
const overlayBigPauseBtnCls = 'overlayBigPauseBtn' + ran;
const volumeControlCls      = 'volumeControls' + ran;
const volumePanelCls        = 'volumePanel' + ran;
const videoProgressContainerCls= 'videoProgressContainerCls' + ran;
const videoProgressCls      = 'videoProgressCls' + ran;
const videoProgressTooltipCls = 'videoProgressTooltipCls' + ran;
const videoProgressInputCls = 'videoProgressInputCls' + ran;
const fastForwardBtnContainerCls = 'fastForwardBtnContainerCls' + ran;
const backwardBtnContainerCls = 'backwardBtnContainerCls' + ran;

let spinnerColor = '#000000';
var controlsColor = '%%color%%';
var stylesStrObj_ = {};

var primaryColor = '%%primaryColor%%';
var buttonsColor = '%%buttonsColor%%';

  stylesStrObj_.adControls = [
    //ad controls
    ".controls{height:100px;width:66px;margin-left:3px;position: absolute;bottom: 20px;left:5px;z-index:999;}",
    // Button play/pause CSS
    '.' + adPlayBtnCls + ' {display: block;width: 0;height: 0;border-top: 10px solid transparent;border-bottom: 10px solid transparent;border-left: 12px solid ' +
    controlsColor +
    ";margin: 5px 0px 10px 0px;position: relative;z-index: 1;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;left: 10px;}",

    '.' + adPlayBtnCls + ':before {content: "";position: absolute;top: -15px;left: -23px;bottom: -15px;right: -7px;border-radius: 50%;border: 2px solid ' +
    controlsColor +
    ";z-index: 2;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;}",

    '.' + adPlayBtnCls + ':after {content: "";opacity: 0;transition: opacity 0.6s;-webkit-transition: opacity 0.6s;-moz-transition: opacity 0.6s;}',

    '.' + adPlayBtnCls + ':hover:before, .' + adPlayBtnCls + ':focus:before {transform: scale(1.1);-webkit-transform: scale(1.1);-moz-transform: scale(1.1);}',

    '.' + adPlayBtnCls + '.active {border-color: transparent;}',

    '.' + adPlayBtnCls + '.active:after {content: "";opacity: 1;width: 10px;height: 16px;position: absolute;left: -16px;top: -8px;border-color: ' +
    controlsColor +
    "; border-style: double; border-width: 0px 0 0px 15px;}",
    
    // speaker
    '.' + adMuteBtnCls + ' {height: 30px;width: 30px;position: relative;overflow: hidden;display: inline-block;}',
    '.' + adMuteBtnCls + ' span {pointer-events: none; display: block;width: 8px;height: 8px;background: ' +
    controlsColor +
    ";margin: 11px 0 0 2px;}",
    '.' + adMuteBtnCls + ' span:after {content: "";position: absolute;width: 0;height: 0;border-style: solid;border-color: transparent ' +
    controlsColor +
    " transparent transparent;border-width: 10px 14px 10px 15px;left: -13px;top: 5px;box-sizing: unset;}",
    '.' + adMuteBtnCls + ' span:before {transform: rotate(45deg);border-radius: 0 50px 0 0;content: "";position: absolute;width: 5px;height: 5px;border-style: double;border-color: ' +
    controlsColor +
    ";border-width: 7px 7px 0 0;left: 18px;top: 9px;transition: all 0.2s ease-out;box-sizing: unset;}",
    '.' + adMuteBtnCls +':hover span:before {transform: scale(0.8) translate(-3px, 0) rotate(42deg);}',
    '.' + adMuteBtnCls +'.mute span:before {transform: scale(0.5) translate(-15px, 0) rotate(36deg);opacity: 0;}',
    '.' + adProgressBarCls + '{height: 5px;position: absolute;bottom: 0;left: 0;right: 0;background: #231B12;-moz-border-radius: 25px;-webkit-border-radius: 25px;border-radius: 25px;-webkit-box-shadow: inset 0 -1px 1px rgb(255 255 255 / 30%);-moz-box-shadow: inset 0 -1px 1px rgba(255,255,255,0.3);box-shadow: inset 0 -1px 1px rgb(255 255 255 / 30%);z-index: 1;}',
    '.' + adProgressBarCls + ' > span {display: block;height: 100%;-webkit-border-top-right-radius: 8px;-webkit-border-bottom-right-radius: 8px;-moz-border-radius-topright: 8px;-moz-border-radius-bottomright: 8px;border-top-right-radius: 8px;border-bottom-right-radius: 8px;-webkit-border-top-left-radius: 20px;-webkit-border-bottom-left-radius: 20px;-moz-border-radius-topleft: 20px;background-color: #F77604;' +
        '-moz-border-radius-bottomleft: 20px;border-top-left-radius: 20px;border-bottom-left-radius: 20px;-webkit-box-shadow: inset 0 2px 9px rgb(255 255 255 / 30%), inset 0 -2px 6px rgb(0 0 0 / 40%);-moz-box-shadow: inset 0 2px 9px rgba(255,255,255,0.3),inset 0 -2px 6px rgba(0,0,0,0.4);box-shadow: inset 0 2px 9px rgb(255 255 255 / 30%), inset 0 -2px 6px rgb(0 0 0 / 40%);position: relative;overflow: hidden;}',
    '.' + adProgressBarCls + '> span:after {content: "";position: absolute;top: 0;left: 0;bottom: 0;right: 0;z-index: 1;-webkit-background-size: 50px 50px;-moz-background-size: 50px 50px;background-size: 50px 50px;-webkit-border-top-right-radius: 8px;-webkit-border-bottom-right-radius: 8px;-moz-border-radius-topright: 8px;-moz-border-radius-bottomright: 8px;' +
            'border-top-right-radius: 8px;border-bottom-right-radius: 8px;-webkit-border-top-left-radius: 20px;-webkit-border-bottom-left-radius: 20px;-moz-border-radius-topleft: 20px;-moz-border-radius-bottomleft: 20px;border-top-left-radius: 20px;border-bottom-left-radius: 20px;overflow: hidden;}'
  ].join("\n");

  
  stylesStrObj_.default = [
    '.' + spinnerCls + ' {width: 80px;height: 80px;position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2;}',
    '.' + spinnerCls + ':after {content: " ";display: block;width: 64px;height: 64px;margin: 8px;border-radius: 50%;border: 6px solid '+spinnerColor+';border-color: '+spinnerColor+' transparent '+spinnerColor+' transparent;animation: '+spinnerCls+' 1.2s linear infinite;}',
    '@-webkit-keyframes ' + spinnerCls + '{0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}',
    '@keyframes ' + spinnerCls + '{0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}',
  
    '.' + bigPlayBtnCls + '{opacity:0.5;width: 0;height: 0;border-top: 50px solid transparent;border-bottom: 50px solid transparent;border-left: 60px solid white;z-index: 1;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;left: 10px;margin: 0;position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);}',
    '.' + bigPlayBtnCls + ':before {background: black; opacity: 0.3; content: "";position: absolute;top: -75px;left: -115px;bottom: -75px;right: -35px;border-radius: 50%;border: 10px solid white;z-index: 2;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;}',
    '.' + bigPlayBtnCls + ':after, .' + commonBigPlayBtnCls + ':after {content: "";opacity: 0;transition: opacity 0.6s;-webkit-transition: opacity 0.6s;-moz-transition: opacity 0.6s;}',
    '.' + bigPlayBtnCls + ':hover:before, .'+bigPlayBtnCls+':focus:before, .'+ commonBigPlayBtnCls +':hover:before, .'+ commonBigPlayBtnCls +':focus:before {transform: scale(1.1);-webkit-transform: scale(1.1);-moz-transform: scale(1.1);}',
    '.' + bigPlayBtnCls + '.active, .' + commonBigPlayBtnCls + '.active {border-color: transparent;}',
    '.' + bigPlayBtnCls + '.active:after, .' + commonBigPlayBtnCls + '.active {content: "";opacity: 1;width: 10px;height: 70px;position: absolute;left: -67px;top: -35px;border-color: white; border-style: double; border-width: 0px 0 0px 60px;}',

    '.' + commonBigPlayBtnCls + '{width: 0;height: 0;border-top: 50px solid transparent;border-bottom: 50px solid transparent;border-left: 60px solid black;z-index: 1;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;left: 10px;margin: 0;position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);}',
    '.' + commonBigPlayBtnCls + ':before {content: "";position: absolute;top: -75px;left: -115px;bottom: -75px;right: -35px;border-radius: 50%;border: 10px solid black;z-index: 2;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;}',
  
    '.' + contentDivCls + ',.' + adDivCls + ',.' + playerCls + ',.' + thumbnailCls + '{position: absolute;top: 0;left: 0;right: 0;bottom: 0;width: 100%;height: 100%;z-index: 1;}',
    '.' + adControlsCls + ',.' + playerControlsCls + '{height: 32px;width: 66px;margin-left: 3px;position: absolute;bottom: 20px;left: 5px;z-index: 999;}',
    '.' + hideCls + '{display: none !important;}',
    '.' + adHideCls + '{visibility: hidden;}',
    //////// We are showing the fullscreen button after all 'video::-webkit-media-controls-fullscreen-button{display: none !important;}',
    '.' + iconCls +  '{position:absolute;top:0;right:0;height:30px;width:30px;cursor:pointer;background-position:center;background-repeat:no-repeat;background-size:cover;z-index:2;}',
    '.' + iconCls + '.top-left {top:0;left:0;}',
    '.' + iconCls + '.top-right {top:0;right:0;}',
    '.' + iconCls + '.bottom-right {bottom:0;right:0;}',
    '.' + iconCls + '.bottom-left {bottom:0;left:0;}',
  ].join("\n");

  stylesStrObj_.customControls = [
    '@font-face{font-family: JXVideo;src: url(data:application/font-woff;charset=utf-8;base64,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)format("woff");'+
        'font-weight: normal;font-style: normal;}',
    '.'+overlayControlCls+'{display: flex;flex-direction: column;z-index:1;right: 0;left: 0;padding: 10px;position: absolute;bottom: 0;transition: all 0.2s ease;background:linear-gradient(180deg,transparent,rgba(0,0,0,.8) 80%);}',
    '.'+overlayControlCls+' button{display:flex;position:relative;align-items:center;justify-content:center;border:none;outline:none;background-color:transparent;padding:3px;box-shadow:none;-moz-appearance: none;-webkit-appearance: none;-ms-appearance: none;appearance: none;}',
    '.'+overlayControlCls+' button:before{font-size:11px;content: attr(data-title);position: absolute;display: none;right: 0;left:unset;top: -50px;background-color: rgba(0, 0, 0, 0.6);color: #fff;padding: 4px 6px;word-break: keep-all;white-space: pre;line-height:1;font-family: Arial, Helvetica, sans-serif;text-transform:none;}',
    '.'+overlayControlCls+' button:hover::before{display: inline-block;}',
    '.'+overlayTitleCls+'{z-index:2;width:100%;padding:10px;position:absolute;top:0;background:linear-gradient(0deg,transparent,rgba(0,0,0,.7) 100%);}',
    '.'+overlayTitleCls+' div{overflow:hidden;width:80%;font-size:14px;color:'+buttonsColor+';text-align:left;font-family: Arial, Helvetica, sans-serif;font-weight:600;display: -webkit-box;-webkit-line-clamp: 1;-webkit-box-orient: vertical;text-shadow:1px 1px 1px rgb(0 0 0 / 80%);}',
    '.'+fullscreenBtnCls+', .'+fullscreenExitBtnCls+', .'+settingBtnCls+'{font-family: JXVideo;line-height:1;font-size: 2em;color: '+buttonsColor+';font-style: normal;}',
    '.'+fullscreenBtnCls+':before{content: "\\f108";}',
    '.'+fullscreenExitBtnCls+':before{content: "\\f109";}',
    '.'+settingBtnCls+':before{content: "\\f110";}',
    '.'+pauseBtnCls+', .'+playBtnCls+'{font-family: JXVideo;line-height:1;font-size: 2em;color: '+buttonsColor+';font-style: normal;}',
    '.'+pauseBtnCls+':before, .'+overlayBigPauseBtnCls+':before{content: "\\f103";}',
    '.'+volumeLowCls+', .'+volumeMidCls+', .'+volumeHighCls+', .'+muteBtnCls+'{font-family: JXVideo;line-height:1;font-size: 2em;color: '+buttonsColor+';font-style: normal;}',
    '.'+muteBtnCls+':before{content: "\\f104";}',
    '.'+volumeLowCls+':before{content: "\\f105";}',
    '.'+volumeMidCls+':before{content: "\\f106";}',
    '.'+volumeHighCls+':before{content: "\\f107";}',
    '.'+overlayBigPauseBtnCls+', .'+overlayBigPlayBtnCls+'{font-family: JXVideo;line-height:1;font-size: 2em;color: '+buttonsColor+';font-style: normal;}',
    '.'+playBtnCls+':before, .'+overlayBigPlayBtnCls+':before{content: "\\f101";}',
    '.'+overlayBigPlayBtnCls+', .'+overlayBigPauseBtnCls+'{font-size:4em}',
    '.'+leftControlsCls+', .'+rightControlsCls+', .'+bottomControlCls+'{display:flex;justify-content:center;align-items:center;color:'+buttonsColor+';}',
    '.'+bottomControlCls+'{width:100%;justify-content:space-between;order:2}',
    '.'+speedValueCls+', .'+subtitleValueCls+'{width: auto;height: auto;display: flex;justify-content: center;align-items: center;color: '+buttonsColor+';font-size: 2em;background: #ffffff5e;border-radius: 5px;padding: 3px;font-weight:700;line-height:1;text-transform:none;font-family: Arial, Helvetica, sans-serif;letter-spacing:normal;}',
    '.'+volumeControlCls+'{display:flex;align-items:center;margin-right:10px;}',
    'input[type="range"].'+volumePanelCls+'{-webkit-appearance: none;width: 70px;height: 5px;background: rgba(255, 255, 255, 1);border-radius: 5px;background-image: linear-gradient('+primaryColor+', '+primaryColor+');background-size: 100% 100%;background-repeat: no-repeat;}',
    'input[type="range"].'+volumePanelCls+'::-webkit-slider-thumb, input[type="range"].'+volumePanelCls+'::-moz-range-thumb, input[type="range"].'+volumePanelCls+'::-ms-thumb{-webkit-appearance: none;height: 17px;width: 17px;border-radius: 50%;background: '+buttonsColor+';'+
        'cursor: ew-resize;box-shadow: 0 0 2px 0 #555;transition: background .3s ease-in-out;}',
    '.'+speedSelectionCls+', .'+qualitySelectionCls+', .'+subtitleSelectionCls+'{width: 50px;position: absolute;bottom: 85px;left: 50%;right: 50%;transform: translate(-50%, 0);}',
    '.'+qualitySelectionCls+', .'+subtitleSelectionCls+'{width:80px;}',
    '.'+speedSelectionCls+' div, .'+qualitySelectionCls+' div, .'+subtitleSelectionCls+' div{background-color: '+buttonsColor+';color: #000;text-align: center;padding: 5px;font-family: Arial, Helvetica, sans-serif;font-size:12px;cursor: pointer;}',
    '.'+speedSelectionCls+' div:hover, .'+speedSelectionCls+' .active, .'+qualitySelectionCls+' .'+qualityItemsCls+':hover, .'+qualitySelectionCls+' .'+qualityItemsCls+'.active, .'+subtitleSelectionCls+' div:hover, .'+subtitleSelectionCls+' .active{font-weight: bold;background-color: #66B4F4;}',
    '.'+speedContainerCls+', .'+subtitleContainerCls+'{position: relative;display: flex;align-items: center;margin-right: 7px;}',
    '.'+speedContainerCls+'{order:1;-webkit-order:1;}',
    '.'+subtitleContainerCls+'{order:2;-webkit-order:2;}',
    '.'+qualityContainerCls+'{order:3;-webkit-order:3;position:relative;}',
    '.'+fullScreenBtnContainer+'{order:4;-webkit-order:4;margin-right:0;}',
    '.'+playbackAnimationCls+', .'+playbackRoundedCls+'{cursor:pointer;opacity:1;order:2;display:flex;align-items:center;}',
    '.'+overlayCenterControlsCls+'{position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);z-index:2;opacity:1;display:flex;align-items:center;justify-content:space-between;width:40%;}',
    '.'+playbackRoundedCls+'{width:4.5em;height:4.5em;position:relative;border-radius:100%;background:'+primaryColor+';}',
    '.'+playbackRoundedCls+' span{position: absolute;left: 50%;top: 50%;transform: translate(-50%, -50%);font-size:3.25em;}',
    '.'+hideOpacityCls+'{opacity:0;}',
    '.'+videoProgressContainerCls+'{display:flex;flex-direction:column;height:6px;width:100%;position:relative;}',
    '.'+videoProgressCls+'{height: 6px;width:100%;-webkit-appearance: none;-moz-appearance: none;appearance: none;border-radius: 2px;pointer-events: none;position: absolute;top: 0;z-index: 1;order:1;}',
    '.'+videoProgressCls+'::-webkit-progress-bar{background-color: rgba(255, 255, 255, 0.6);}',
    '.'+videoProgressCls+'::-webkit-progress-value{background: '+primaryColor+';}',
    '.'+videoProgressCls+'::-moz-progress-bar{background: '+primaryColor+';}',
    '.'+videoProgressInputCls+'{position: absolute;top: 0;width: 100%;cursor: pointer;margin: 0;}',
    '.'+videoProgressInputCls+':hover + .'+videoProgressTooltipCls+'{display:block;}',
    '.'+videoProgressTooltipCls+'{display: none;position: absolute;top: -50px;margin-left: -20px;font-size: 12px;padding: 3px;content: attr(data-title);font-weight: bold;color: #fff;background-color: rgba(0, 0, 0, 0.6);}',
    'input[type="range"].'+videoProgressInputCls+'{-webkit-appearance: none;-moz-appearance: none;height: 6px;background: transparent;cursor: pointer;}',
    'input[type="range"].'+videoProgressInputCls+':focus{outline:none;}',
    'input[type="range"].'+videoProgressInputCls+'::-webkit-slider-runnable-track{width: 100%;cursor: pointer;-webkit-appearance: none;transition: all 0.4s ease;}',
    'input[type="range"].'+videoProgressInputCls+'::-webkit-slider-thumb{height: 0px;width: 0px;background: transparent;cursor: pointer;-webkit-appearance: none;margin-left: -1px;}',
    'input[type="range"].'+videoProgressInputCls+':focus::-webkit-slider-runnable-track{background: transparent;}',
    'input[type="range"].'+videoProgressInputCls+'::-moz-range-track{width: 100%;height: 8.4px;cursor: pointer;border: 1px solid transparent;background: transparent;}',
    '.'+fastForwardBtnContainerCls+', .'+backwardBtnContainerCls+'{cursor:pointer;position:relative;order:1;visibility:hidden;width:30px;height:30px;}',
    '.'+fastForwardBtnContainerCls+' svg, .'+backwardBtnContainerCls+' svg{fill:'+buttonsColor+';stroke:'+buttonsColor+';width:100%;height:100%;transform:none;}',
    '.'+backwardBtnContainerCls+' svg{transform:rotateY(180deg);}',
    '.'+fastForwardBtnContainerCls+'{order:3;}',
    '.'+fastForwardBtnContainerCls+' span, .'+backwardBtnContainerCls+' span{position:absolute;color:'+buttonsColor+';font-size:14px;top:50%;left:50%;transform:translate(-50%, -50%)}',
  ].join("\n");

function getCls_() {
  return {
    contentDivCls:          contentDivCls,
    adDivCls:               adDivCls,
    playerCls:              playerCls,
    thumbnailCls:           thumbnailCls,
    adControlsCls:          adControlsCls,
    playerControlsCls:      playerControlsCls,
    iconCls:                iconCls,
    spinnerCls:             spinnerCls,
    bigPlayBtnCls:          bigPlayBtnCls,
    commonBigPlayBtnCls:    commonBigPlayBtnCls,
    adPlayBtnCls:           adPlayBtnCls,
    adMuteBtnCls:           adMuteBtnCls,
    adProgressBarCls:       adProgressBarCls,
    hideCls:                hideCls,
    adHideCls:              adHideCls,
    hideOpacityCls:         hideOpacityCls,
    overlayControlCls:      overlayControlCls,
    overlayCenterControlsCls: overlayCenterControlsCls,
    overlayTitleCls:        overlayTitleCls,
    leftControlsCls:        leftControlsCls,
    rightControlsCls:       rightControlsCls,
    bottomControlCls:       bottomControlCls,
    fullscreenBtnCls:       fullscreenBtnCls,
    fullscreenExitBtnCls:   fullscreenExitBtnCls,
    playBtnCls:             playBtnCls,
    pauseBtnCls:            pauseBtnCls,
    muteBtnCls:             muteBtnCls,
    volumeLowCls:           volumeLowCls,
    volumeMidCls:           volumeMidCls,
    volumeHighCls:          volumeHighCls,
    settingBtnCls:          settingBtnCls,
    speedContainerCls:      speedContainerCls,
    qualityContainerCls:    qualityContainerCls,
    fullScreenBtnContainer: fullScreenBtnContainer,
    speedValueCls:          speedValueCls,
    speedSelectionCls:      speedSelectionCls,
    subtitleContainerCls:   subtitleContainerCls,
    subtitleSelectionCls:   subtitleSelectionCls,
    subtitleValueCls:       subtitleValueCls,
    qualitySelectionCls:    qualitySelectionCls,
    qualityItemsCls:        qualityItemsCls,
    playbackAnimationCls:   playbackAnimationCls,
    overlayBigPlayBtnCls:   overlayBigPlayBtnCls,
    overlayBigPauseBtnCls:  overlayBigPauseBtnCls,
    volumeControlCls:       volumeControlCls,
    volumePanelCls:         volumePanelCls,
    playbackRoundedCls:     playbackRoundedCls,
    videoProgressCls:       videoProgressCls,
    videoProgressContainerCls: videoProgressContainerCls,
    videoProgressInputCls: videoProgressInputCls,
    videoProgressTooltipCls: videoProgressTooltipCls,
    fastForwardBtnContainerCls: fastForwardBtnContainerCls,
    backwardBtnContainerCls: backwardBtnContainerCls
  };
}
function getStyles_() {
  return stylesStrObj_;
}

module.exports.getCls = getCls_;
module.exports.getStyles = getStyles_;