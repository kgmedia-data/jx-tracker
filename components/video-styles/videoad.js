const ran                   = Math.floor(Math.random() * (99999) + 1)
const contentDivCls         = 'contentDivCls' + ran;
const adDivCls              = 'adDivCls' + ran;
const playerCls             = 'playerCls' + ran;
const thumbnailCls          = 'thumbnailCls' + ran;
const adControlsCls         = 'adControlsCls' + ran;
const playerControlsCls     = 'playerControlsCls' + ran;
const iconCls               = 'iconCls'  + ran;
const bigPlayBtnCls         = 'bigPlayBtnCls' + ran;
const adPlayBtnCls          = 'adPlayBtnCls' + ran;
const adMuteBtnCls          = 'adMuteBtnCls' + ran;
const adProgressBarCls      = 'adProgressBarCls' + ran;
const hideCls               = 'hideCls' + ran;
const adHideCls             = 'adHideCls' + ran;
const spinnerCls            = 'spinnerCls' + ran; 
const comboDivCls           = 'comboDivCls' + ran;
const replayBtnCls          = 'adReplayBtnCls' + ran;

let spinnerColor = '#000000';
var controlsColor = '%%color%%';
var stylesStrObj_ = {};

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
                'border-top-right-radius: 8px;border-bottom-right-radius: 8px;-webkit-border-top-left-radius: 20px;-webkit-border-bottom-left-radius: 20px;-moz-border-radius-topleft: 20px;-moz-border-radius-bottomleft: 20px;border-top-left-radius: 20px;border-bottom-left-radius: 20px;overflow: hidden;}',

        '.' + replayBtnCls + '{position: absolute;padding: 9px;bottom: 20px;padding-right: 30px;right: 0px;background: rgba(0, 0, 0, 0.74);z-index: 2;color: rgba(255, 255, 255, 0.8);cursor: pointer;border-radius: 4px;font-size: 14px;letter-spacing: 1px;font-family:"Open Sans",sans-serif,serif;}',
        '.' + replayBtnCls + ' .material-icons {position: absolute;top:5px;}',
    ].join("\n");

   
    stylesStrObj_.default = [
        '@import url(https://fonts.googleapis.com/icon?family=Material+Icons);',
        '.' + spinnerCls + ' {width: 80px;height: 80px;position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2;}',
        '.' + spinnerCls + ':after {content: " ";display: block;width: 64px;height: 64px;margin: 8px;border-radius: 50%;border: 6px solid '+spinnerColor+';border-color: '+spinnerColor+' transparent '+spinnerColor+' transparent;animation: '+spinnerCls+' 1.2s linear infinite;}',
        '@-webkit-keyframes ' + spinnerCls + '{0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}',
        '@keyframes ' + spinnerCls + '{0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}',
    
        '.' + bigPlayBtnCls + '{opacity:0.5;width: 0;height: 0;border-top: 50px solid transparent;border-bottom: 50px solid transparent;border-left: 60px solid white;z-index: 1;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;left: 10px;margin: 0;position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);}',
        '.' + bigPlayBtnCls + ':before {background: black; opacity: 0.3; content: "";position: absolute;top: -75px;left: -115px;bottom: -75px;right: -35px;border-radius: 50%;border: 10px solid white;z-index: 2;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;}',
        '.' + bigPlayBtnCls + ':after {content: "";opacity: 0;transition: opacity 0.6s;-webkit-transition: opacity 0.6s;-moz-transition: opacity 0.6s;}',
        '.' + bigPlayBtnCls + ':hover:before, .'+bigPlayBtnCls+':focus:before {transform: scale(1.1);-webkit-transform: scale(1.1);-moz-transform: scale(1.1);}',
        '.' + bigPlayBtnCls + '.active {border-color: transparent;}',
        '.' + bigPlayBtnCls + '.active:after {content: "";opacity: 1;width: 10px;height: 70px;position: absolute;left: -67px;top: -35px;border-color: white; border-style: double; border-width: 0px 0 0px 60px;}',
    
       /////// '.' + contentDivCls + ',.' + adDivCls + ',.' + playerCls + ',.' + thumbnailCls + '{position: absolute;top: 0;left: 0;right: 0;bottom: 0;width: 100%;height: 100%;z-index: 1;}',
       '.' + playerCls + '{position: absolute;top: 0;left: 0;right: 0;bottom: 0;width: 100%;height: 100%;}',
       '.' + contentDivCls + '{position: absolute;top: 0;left: 0;right: 0;bottom: 0;width: 100%;height: 100%;}',
       '.' + adDivCls + '{position: absolute;top: 0;left: 0;right: 0;bottom: 0;width: 100%;height: 100%;}',
       //'.' + adDivCls + '{position:relative; width: 100%;height: 100%; }',
       '.' + comboDivCls + '{position:relative; width: 100%;height: 100%; }',
       '.' + thumbnailCls + '{cursor:pointer;width:100%;height:auto;}',
       '.' + adControlsCls + ',.' + playerControlsCls + '{height: 32px;width: 66px;margin-left: 3px;position: absolute;bottom: 20px;left: 5px;z-index: 999;}',
       '.' + hideCls + '{display: none;}'
    ].join("\n");

function getCls_() {
    return {
    comboDivCls:        comboDivCls,
    contentDivCls:      contentDivCls,
    adDivCls:           adDivCls,
    playerCls:          playerCls,
    thumbnailCls:       thumbnailCls,
    adControlsCls:      adControlsCls,
    playerControlsCls:  playerControlsCls,
    iconCls:            iconCls,
    spinnerCls:         spinnerCls,
    bigPlayBtnCls:      bigPlayBtnCls,
    adPlayBtnCls:       adPlayBtnCls,
    adMuteBtnCls:       adMuteBtnCls,
    adProgressBarCls:   adProgressBarCls,
    hideCls:            hideCls,
    adHideCls:          adHideCls,
    replayBtnCls:       replayBtnCls,
    };
}
function getStyles_() {
    return stylesStrObj_;
}

module.exports.getCls = getCls_;
module.exports.getStyles = getStyles_;