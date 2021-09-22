const ran                   = Math.floor(Math.random() * (99999) + 1);
const allClasses = [
    "cDiv",
    "adDiv",
    "player",
    "thumbnail",
    "adCtrl",
    "playerCtrl",
    "icon",
    "bigPlayBtn",
    "adPlayBtn",
    "adMuteBtn",
    "adProg",
    "hide",
    "adHide",
    "spinner",
    "comboDiv",
    "replayCtr",
    "replayBtnCtr"
];

function makeCls_(container) {
    var css_ = {};
    allClasses.forEach(function(name) {
      css_[name] = container+name+ran;
    });
    return css_;
}

let spinnerColor = '#000000';
var controlsColor = '%%color%%';

function makeStyles_(css_) {
    var stylesStrObj_ = {};
 
    stylesStrObj_.adControls = [
        //ad controls
        ".controls{height:100px;width:66px;margin-left:3px;position: absolute;bottom: 20px;left:5px;z-index:999;}",
        // Button play/pause CSS
        '.' + css_.adPlayBtn + ' {display: block;width: 0;height: 0;border-top: 10px solid transparent;border-bottom: 10px solid transparent;border-left: 12px solid ' +
        controlsColor +
        ";margin: 5px 0px 10px 0px;position: relative;z-index: 1;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;left: 10px;}",

        '.' + css_.adPlayBtn + ':before {content: "";position: absolute;top: -15px;left: -23px;bottom: -15px;right: -7px;border-radius: 50%;border: 2px solid ' +
        controlsColor +
        ";z-index: 2;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;}",

        '.' + css_.adPlayBtn + ':after {content: "";opacity: 0;transition: opacity 0.6s;-webkit-transition: opacity 0.6s;-moz-transition: opacity 0.6s;}',

        '.' + css_.adPlayBtn + ':hover:before, .' + css_.adPlayBtn + ':focus:before {transform: scale(1.1);-webkit-transform: scale(1.1);-moz-transform: scale(1.1);}',

        '.' + css_.adPlayBtn + '.active {border-color: transparent;}',

        '.' + css_.adPlayBtn + '.active:after {content: "";opacity: 1;width: 10px;height: 16px;position: absolute;left: -16px;top: -8px;border-color: ' +
        controlsColor +
        "; border-style: double; border-width: 0px 0 0px 15px;}",
        
        // speaker
        '.' + css_.adMuteBtn + ' {height: 30px;width: 30px;position: relative;overflow: hidden;display: inline-block;}',
        '.' + css_.adMuteBtn + ' span {pointer-events: none; display: block;width: 8px;height: 8px;background: ' +
        controlsColor +
        ";margin: 11px 0 0 2px;}",
        '.' + css_.adMuteBtn + ' span:after {content: "";position: absolute;width: 0;height: 0;border-style: solid;border-color: transparent ' +
        controlsColor +
        " transparent transparent;border-width: 10px 14px 10px 15px;left: -13px;top: 5px;box-sizing: unset;}",
        '.' + css_.adMuteBtn + ' span:before {transform: rotate(45deg);border-radius: 0 50px 0 0;content: "";position: absolute;width: 5px;height: 5px;border-style: double;border-color: ' +
        controlsColor +
        ";border-width: 7px 7px 0 0;left: 18px;top: 9px;transition: all 0.2s ease-out;box-sizing: unset;}",
        '.' + css_.adMuteBtn +':hover span:before {transform: scale(0.8) translate(-3px, 0) rotate(42deg);}',
        '.' + css_.adMuteBtn +'.mute span:before {transform: scale(0.5) translate(-15px, 0) rotate(36deg);opacity: 0;}',
        '.' + css_.adProg + '{height: 5px;position: absolute;bottom: 0;left: 0;right: 0;background: #231B12;-moz-border-radius: 25px;-webkit-border-radius: 25px;border-radius: 25px;-webkit-box-shadow: inset 0 -1px 1px rgb(255 255 255 / 30%);-moz-box-shadow: inset 0 -1px 1px rgba(255,255,255,0.3);box-shadow: inset 0 -1px 1px rgb(255 255 255 / 30%);z-index: 1;}',
        '.' + css_.adProg + ' > span {display: block;height: 100%;-webkit-border-top-right-radius: 8px;-webkit-border-bottom-right-radius: 8px;-moz-border-radius-topright: 8px;-moz-border-radius-bottomright: 8px;border-top-right-radius: 8px;border-bottom-right-radius: 8px;-webkit-border-top-left-radius: 20px;-webkit-border-bottom-left-radius: 20px;-moz-border-radius-topleft: 20px;background-color: #F77604;' +
            '-moz-border-radius-bottomleft: 20px;border-top-left-radius: 20px;border-bottom-left-radius: 20px;-webkit-box-shadow: inset 0 2px 9px rgb(255 255 255 / 30%), inset 0 -2px 6px rgb(0 0 0 / 40%);-moz-box-shadow: inset 0 2px 9px rgba(255,255,255,0.3),inset 0 -2px 6px rgba(0,0,0,0.4);box-shadow: inset 0 2px 9px rgb(255 255 255 / 30%), inset 0 -2px 6px rgb(0 0 0 / 40%);position: relative;overflow: hidden;}',
        '.' + css_.adProg + '> span:after {content: "";position: absolute;top: 0;left: 0;bottom: 0;right: 0;z-index: 1;-webkit-background-size: 50px 50px;-moz-background-size: 50px 50px;background-size: 50px 50px;-webkit-border-top-right-radius: 8px;-webkit-border-bottom-right-radius: 8px;-moz-border-radius-topright: 8px;-moz-border-radius-bottomright: 8px;' +
                'border-top-right-radius: 8px;border-bottom-right-radius: 8px;-webkit-border-top-left-radius: 20px;-webkit-border-bottom-left-radius: 20px;-moz-border-radius-topleft: 20px;-moz-border-radius-bottomleft: 20px;border-top-left-radius: 20px;border-bottom-left-radius: 20px;overflow: hidden;}',

        // '.' + replayBtnCls + '{position: absolute;padding: 9px;bottom: 20px;padding-right: 30px;right: 0px;background: rgba(0, 0, 0, 0.74);z-index: 2;color: rgba(255, 255, 255, 0.8);cursor: pointer;border-radius: 4px;font-size: 14px;letter-spacing: 1px;font-family:"Open Sans",sans-serif,serif;}',
        // '.' + replayBtnCls + ' .material-icons {position: absolute;top:5px;}',
        '.' + css_.replayCtr + '{opacity: 0.8;background-color: #ffffff;width: 100%;height: 100%;position: absolute;top: 0;display: flex;left: 0;justify-content: center;z-index: 9999;align-items: center;}',
        '.' + css_.replayBtnCtr + '{opacity:0.8;height:40px;display:flex;justify-content:center;align-items:center;cursor:pointer;transition:opacity 175ms ease;}',
        '.' + css_.replayBtnCtr + ' .replay-icon {color: #294355;border: 2px solid #294355;border-radius: 35px;padding: 7px;}',
        '.' + css_.replayBtnCtr + ' .replay-text {margin-left: 20px;font-size: 20px;line-height: 40px;height: 40px;color: #294355;}'
    ].join("\n");

   
    stylesStrObj_.default = [
        '@import url(https://fonts.googleapis.com/icon?family=Material+Icons);',
        '.' + css_.spinner + ' {width: 80px;height: 80px;position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2;}',
        '.' + css_.spinner + ':after {content: " ";display: block;width: 64px;height: 64px;margin: 8px;border-radius: 50%;border: 6px solid '+spinnerColor+';border-color: '+spinnerColor+' transparent '+spinnerColor+' transparent;animation: '+css_.spinner+' 1.2s linear infinite;}',
        '@-webkit-keyframes ' + css_.spinner + '{0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}',
        '@keyframes ' + css_.spinner + '{0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}',
    
        '.' + css_.bigPlayBtn + '{z-index: 99999; opacity:0.5;width: 0;height: 0;border-top: 50px solid transparent;border-bottom: 50px solid transparent;border-left: 60px solid white;z-index: 1;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;left: 10px;margin: 0;position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);}',
        '.' + css_.bigPlayBtn + ':before {background: black; opacity: 0.3; content: "";position: absolute;top: -75px;left: -115px;bottom: -75px;right: -35px;border-radius: 50%;border: 10px solid white;z-index: 2;transition: all 0.3s;-webkit-transition: all 0.3s;-moz-transition: all 0.3s;}',
        '.' + css_.bigPlayBtn + ':after {content: "";opacity: 0;transition: opacity 0.6s;-webkit-transition: opacity 0.6s;-moz-transition: opacity 0.6s;}',
        '.' + css_.bigPlayBtn + ':hover:before, .'+css_.bigPlayBtn+':focus:before {transform: scale(1.1);-webkit-transform: scale(1.1);-moz-transform: scale(1.1);}',
        '.' + css_.bigPlayBtn + '.active {border-color: transparent;}',
        '.' + css_.bigPlayBtn + '.active:after {content: "";opacity: 1;width: 10px;height: 70px;position: absolute;left: -67px;top: -35px;border-color: white; border-style: double; border-width: 0px 0 0px 60px;}',
    
       /////// '.' + contentDivCls + ',.' + adDivCls + ',.' + playerCls + ',.' + thumbnailCls + '{position: absolute;top: 0;left: 0;right: 0;bottom: 0;width: 100%;height: 100%;z-index: 1;}',
       '.' + css_.player + '{position: absolute;top: 0;left: 0;right: 0;bottom: 0;width: 100%;height: 100%;}',
       '.' + css_.cDiv + '{position: absolute;top: 0;left: 0;right: 0;bottom: 0;width: 100%;height: 100%;}',
       '.' + css_.adDiv + '{position: absolute;top: 0;left: 0;right: 0;bottom: 0;width: 100%;height: 100%;}',
       //'.' + adDivCls + '{position:relative; width: 100%;height: 100%; }',
       '.' + css_.comboDiv + '{position:relative; width: 100%;height: 100%; }',
       '.' + css_.thumbnail + '{cursor:pointer;width:100%;height:auto;}',
       '.' + css_.adCtrl + ',.' + css_.playerCtrl + '{height: 32px;width: 66px;margin-left: 3px;position: absolute;bottom: 20px;left: 5px;z-index: 999;}',
       '.' + css_.hide + '{display: none;}'
    ].join("\n");
    return stylesStrObj_;
}

module.exports.makeCls = makeCls_;
module.exports.makeStyles = makeStyles_;