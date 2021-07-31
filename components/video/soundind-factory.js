const modulesmgr                = require('../basic/modulesmgr');
const common                    = modulesmgr.get('basic/common');


const defaultSoundIndColor       = "rgba(255, 255, 255, 0.8)";
const defaultSoundIndBgColor     = "rgba(0, 0, 0, 0.74)";
const defaultSoundIndText        = '';
const defaultSoundIndPosition    = "top-right";
const defaultSoundIndDuration    = 15; //seconds

const waveCls                   = "JXSoundWave";
const soundIndAnimationName     = "sound-wave";
const timeLeftCls               = "JXWaveTimeLeft";
const timeLeftAnimationName     = "wave-time-left";
//const unMuteBtnCls       = "JXUnMuteBtn"; //to be obsoleted
//const unMuteBtnWrapperCls = "JXUnMuteBtnWrapper"; //ditto

//aiyo wah liao. thsi is such a simple array . delay just +0.1 each time ah.
const animationDelays = [
    {
        left: 0,
        delay: 0.3
    },
    {
        left: 2,
        delay: 0.4
    },
    {
        left: 2,
        delay: 0.5
    },
    {
        left: 2,
        delay: 0.6
    },
    {
        left: 2,
        delay: 0.7
    },
    {
        left: 2,
        delay: 0.8
    },
    {
        left: 2,
        delay: 0.9
    },
    {
        left: 2,
        delay: 1
    },
    {
        left: 2,
        delay: 1.1
    },
    {
        left: 2,
        delay: 1.2
    },
];

/**
     * the sound indicator thing which is put on a corner of the video area
     * to entice the user to click to enable SOUND.
     * @param {*} config 
     * @returns 
     */
    //ok we need to 
    function MakeOneSoundIndicator_(container, config) {
        var _lastRemainingTime = -1;
        var _soundInd = null;
        var _boundIndClicked = null;
        var _timeRemainElt = null;
        var _boundIndClicked = null;
        var _duration = defaultSoundIndDuration;
        var _defaultRemainText = "%%MINUTES%%:%%SECONDS%%"

        var _indicatorClicked = function(cb) {
            _hide(true); //unhook = true
            cb();
        }
        FactoryOneSoundIndicator.prototype.getDuration = function() {
            return _duration;
        }
        //the cb is a function furnished by the caller . well something to turn on the sound loh...
        FactoryOneSoundIndicator.prototype.stop = function() {
            _hide(true);
        }
        FactoryOneSoundIndicator.prototype.start = function(cb) {
            if (_soundInd) {
                _soundInd.style.display = "table";
                _boundIndClicked = _indicatorClicked.bind(null, cb);
                _soundInd.addEventListener('click', _boundIndClicked);
            }
        };       
        //when finished ad, this will be called
        FactoryOneSoundIndicator.prototype.showMaybe = function() {
            if (_soundInd && _boundIndClicked) {
                //if !_boundIndClicked means already unhooked.
                _soundInd.style.display = "table";
            }
        };       
        

        FactoryOneSoundIndicator.prototype.setRemainingTime = function(remainingTime) {
            if (_timeRemainElt) {
                remainingTime = Math.floor(remainingTime);
                if (remainingTime == _lastRemainingTime) {
                    return;
                }
                _lastRemainigTime = remainingTime;
                remainingTime %= 3600;
                let minutes = Math.floor(remainingTime / 60);
                let seconds = Math.floor(remainingTime % 60);
                if (minutes > 0 || seconds > 0) {
                minutes = String(minutes).padStart(2, "0");
                seconds = String(seconds).padStart(2, "0");
                _timeRemainElt.innerHTML = _defaultRemainText.replace(/%%MINUTES%%/, minutes).replace(/%%SECONDS%%/, seconds);
                }
            }
        }
        //when starting ad, this will be called
        FactoryOneSoundIndicator.prototype.hideMaybe = function() {
            _hide(false); //only hide it from view. no need unhook the click listening
        }

        var _hide = function(unhook) {            
            if (_soundInd) {
                //just need to be very sure those animations stuff are not running!
                if (_soundInd.style.display != 'none')
                    _soundInd.style.display = "none";
                if (unhook) {
                    if (_boundIndClicked)
                        _soundInd.removeEventListener('click', _boundIndClicked);
                    _boundIndClicked = null;
                }
            }
        };
        //Currently we offer 3 styles : speaker and wave-only, timeleft
        function _makeTimeLeft(position, text, color, bgColor) {
            _lastRemainigTime = -1;
            let animationTimeLeft = animationDelays.slice(0, 4);
            const animationRulesArr = animationTimeLeft.map(function(obj, idx) {
                return  '.' + timeLeftCls +' .time-left-sound-bar:nth-of-type('+ (idx+1) +'){margin-left: '+obj.left+'px; animation-delay: '+obj.delay+'s;}';
            });
            let stylesArr = [
                '.' + timeLeftCls +'{display:table;position:absolute;top:5px;right:10px;width: auto;height:auto;overflow:hidden;z-index:2;cursor:pointer;line-height:1.3;border-radius:5px;}',
                '.' + timeLeftCls +'.top-right{position:absolute;top:5px;right:10px;}',
                '.' + timeLeftCls +'.top-left{position:absolute;top:5px;left:10px;}',
                '.' + timeLeftCls +'.top{position:absolute;top:5px;left:50%;transform: translate(-50%, 0px);}',
                '.' + timeLeftCls +'.no-text{padding:5px;}',
                '.' + timeLeftCls +' .text-wrapper {text-align:center;font-size:12px;margin:0px 5px 0px 5px;font-weight:400;margin-top:-5px;font-family:Arial, Helvetica, sans-serif;}',
                '.' + timeLeftCls +' .time-left-sound-bar {height: 5px;width: 5px;animation: '+timeLeftAnimationName+' 0.75s infinite ease;}',
                '.time-left-bar-wrapper {width: 100%;display: flex;height:12px;justify-content: center;align-items: flex-end;}',
                '.time-left-inner-wrapper {display:flex;padding:0 5px;align-items:center;padding:5px;}',
                '.time-left-inner-wrapper.no-text {padding:0px;}',
                '.' + timeLeftCls +'.top-left .time-left-inner-wrapper {flex-direction:row-reverse;}',
                '.time-left-text {display:flex;flex:1;font-size:15px;font-family:Arial, Helvetica, sans-serif;align-items:center;justify-content:center;vertical-align:middle;padding-right: 3px;height:12px;}',
                '.' + timeLeftCls +'.top-left .time-left-inner-wrapper .time-left-text {padding-right:0;padding-left:3px;}',
                '@keyframes '+timeLeftAnimationName+'{0%{height:5px;}30%{height:10px;}60%{height:12px;}80%{height:10px;}100%{height:5px;}}',
            ];
            common.acss(stylesArr.concat(animationRulesArr).join("\n"), "SoundIndWaveTimeLeft"+Date.now());//just a random thing //due to the color

            let innerWrapper = document.createElement('div');
            innerWrapper.className = 'time-left-inner-wrapper';
            let soundInd = document.createElement('div');
            soundInd.className = timeLeftCls +' '+ position;
            soundInd.style.background = bgColor;
            _timeRemainElt = document.createElement('div');
            _timeRemainElt.className = 'time-left-text';
            _timeRemainElt.style.color = color;
            _timeRemainElt.innerHTML = "00:00";
            innerWrapper.appendChild(_timeRemainElt);

            let barWrapper = document.createElement('div');
            barWrapper.className = 'time-left-bar-wrapper';
            innerWrapper.appendChild(barWrapper)
            animationTimeLeft.forEach(function() {
                let div = document.createElement('div');
                div.style.background = color;
                div.className = 'time-left-sound-bar';
                barWrapper.appendChild(div);
            });
            soundInd.appendChild(innerWrapper);
            if (text) {
                let textWrapper = document.createElement('div');
                textWrapper.className = 'text-wrapper';
                textWrapper.innerHTML = text;
                textWrapper.style.color = color;
                soundInd.appendChild(textWrapper);
            }
            else {
                soundInd.classList.add('no-text');
                innerWrapper.classList.add('no-text');
            }
            return soundInd;
        }
        /******* WE FOR NOW DO NOT SUPPORT THIS STYLE:
        function _makeSpeaker(position, color, bgColor) {
            let stylesArr = [
                '.' + unMuteBtnWrapperCls + '{position:absolute;z-index:2;cursor:pointer;}',
                '.' + unMuteBtnWrapperCls +'.top-right{position:absolute;top:5px;right:10px;}',
                '.' + unMuteBtnWrapperCls +'.top-left{position:absolute;top:5px;left:10px;}',
                '.' + unMuteBtnWrapperCls +'.top{position:absolute;top:5px;left:50%;transform: translate(-50%, 0px);}',
                '.' + unMuteBtnCls + ' {position:relative;height: 30px;width: 30px;position: relative;overflow: hidden;display: inline-block;}',
                '.' + unMuteBtnCls + ' .speaker-on {display: block;width: 8px;height: 8px;background: '+color+';margin: 11px 0px 0px 2px;}',
                '.' + unMuteBtnCls + ' .speaker-on::before {transform: rotate(45deg);border-radius: 0px 50px 0px 0px;content: "";position: absolute;width: 10px;height: 10px;border-style: double;border-color: '+color+';' +
                    'border-width: 7px 7px 0px 0px;left: 17px;top: 10px;transition: all 0.2s ease-out 0s;}',
                '.' + unMuteBtnCls + ' .speaker-on::after {content: "";position: absolute;width: 0px;height: 0px;border-style: solid;border-color: transparent '+color+' transparent transparent;border-width: 10px 14px 10px 15px;left: -13px;top: 5px;}',
                '.' + unMuteBtnCls + ' .slashed {position:absolute;background: '+color+';margin-top:-18px;height:28px;width:2px;left:0px;transform:translateX(13px) rotate(-45deg)}'
            ];
            common.acss(stylesArr.join("\n"), "SoundIndSpeaker"+Date.now());//just a random thing //due to the color

            let soundInd = document.createElement('div');
            soundInd.className = unMuteBtnWrapperCls +' '+ position;
            soundInd.style.background = bgColor;
            let wrapper = document.createElement('div');
            wrapper.className = unMuteBtnCls;

            let spanElt = document.createElement('span');
            spanElt.className = "speaker-on";
            spanElt.style.color = color; 

            let slashElt = document.createElement('span');
            slashElt.className = "slashed";
            soundInd.style.color = color; 

            wrapper.appendChild(spanElt);
            wrapper.appendChild(slashElt);
            soundInd.appendChild(wrapper)
            return soundInd;
        }
        *******/
        function _makeWave(position, text, color, bgColor) {
            //if no text we make the wave of few bars.
            //if no text, we only take 4 bars
            let sliceArg = -1;
            if (text) {
                if (text.length < 10) 
                    sliceArg = 6;
            }
            else {
                sliceArg = 4;
            }

            let animationDelays1 = sliceArg > 0  ? animationDelays.slice(0,sliceArg): animationDelays;

            const animationRulesArr = animationDelays1.map(function(obj, idx) {
                return  '.' + waveCls +' .sound-bar:nth-of-type('+ (idx+1) +'){margin-left: '+obj.left+'px; animation-delay: '+obj.delay+'s;}';
            });
            let stylesArr = [
                //'.' + waveCls +'{display:table;justify-content:center;align-items:flex-start;position:absolute;top:5px;right:10px;width: auto;height:40px;overflow:hidden;background:'+bgColor+';z-index:2;cursor:pointer;}',
                '.' + waveCls +'{display:table;position:absolute;top:5px;right:10px;width: auto;height:auto;overflow:hidden;z-index:2;cursor:pointer;line-height:1.3;border-radius:5px;}',
                '.' + waveCls +'.top-right{position:absolute;top:5px;right:10px;}',
                '.' + waveCls +'.top-left{position:absolute;top:5px;left:10px;}',
                '.' + waveCls +'.top{position:absolute;top:5px;left:50%;transform: translate(-50%, 0px);}',
                '.' + waveCls +'.no-text{padding:0 5px 5px;}',
                // '.' + waveCls +'.top div,.' + waveCls +'.top-right div,.' + waveCls +'.top-left div{bottom:20px;}',
                //'.' + waveCls +' span {text-align:center;font-size:12px;color: '+color+'}',
                '.' + waveCls +' .text-wrapper {text-align:center;font-size:12px;margin:0px 5px 0px 5px;font-weight:400;}',
                //'.' + waveCls +' div {position:absolute;height: 5px;width: 5px;animation: '+soundIndAnimationName+' 0.5s infinite ease;bottom: 0px;background:'+color+'}',
                '.' + waveCls +' .sound-bar {height: 5px;width: 5px;animation: '+soundIndAnimationName+' 0.95s infinite ease;}',
                ////////'.bar-wrapper {width: 100%;display: flex;height: 18px;justify-content: center;align-items: flex-end;}',
                '.bar-wrapper .no-text {margin-bottom:5px;}'
                //////////'@keyframes '+soundIndAnimationName+'{0%{height:1px;}30%{height:11px;}60%{height:14px;}80%{height:11px;}100%{height:1px;}}',
            ];
            if (false && !text) {
                stylesArr.push('.bar-wrapper {width: 100%;display: flex;height: 22px;justify-content: center;align-items: flex-end;}');
                stylesArr.push('@keyframes '+soundIndAnimationName+'{0%{height:5px;}30%{height:15px;}60%{height:18px;}80%{height:15px;}100%{height:5px;}}');
            }
            else {
                stylesArr.push('.bar-wrapper {width: 100%;display: flex;height: 18px;justify-content: center;align-items: flex-end;}');
                stylesArr.push('@keyframes '+soundIndAnimationName+'{0%{height:1px;}30%{height:11px;}60%{height:14px;}80%{height:11px;}100%{height:1px;}}');
            }
            common.acss(stylesArr.concat(animationRulesArr).join("\n"), "SoundIndWave"+Date.now());//just a random thing //due to the color

            let soundInd = document.createElement('div');
            soundInd.className = waveCls +' '+ position;
            soundInd.style.background = bgColor;

            let barWrapper = document.createElement('div');
            barWrapper.className = 'bar-wrapper';

            let textWrapper = null;
            if (text) {
                textWrapper = document.createElement('div');
                textWrapper.className = 'text-wrapper';
                textWrapper.innerHTML = text;
                textWrapper.style.color = color;
            } else {
                barWrapper.classList.add('no-text');
            }
            animationDelays1.forEach(function() {
                let div = document.createElement('div');
                div.style.background = color;
                div.className = 'sound-bar';
                barWrapper.appendChild(div);
            });
            soundInd.appendChild(barWrapper);
            if (textWrapper) soundInd.appendChild(textWrapper);
            else soundInd.classList.add('no-text');
            return soundInd;
        }
        function FactoryOneSoundIndicator(container, config, showImmediately = true) {
            let position = config.position || defaultSoundIndPosition;
            let text = config.text || defaultSoundIndText;
            let color = config.color || defaultSoundIndColor;
            let bgColor = config.bgcolor || defaultSoundIndBgColor;
            _duration = defaultSoundIndDuration;
            if (!isNaN(config.duration)) {
                _duration = parseInt(config.duration);
                if (_duration < 0 ) {
                    _duration = defaultSoundIndDuration;
                }
            }
            if (_duration == 0) {
                _duration = 9999999;
            }
            
            if (config.style == 'waveonly' || config.style == 'wave') {
                _soundInd = _makeWave(position, text, color, bgColor);
            }
            /********* FOR NOW NOT SUPPORTED else if (config.style == 'speaker') {
                _soundInd = _makeSpeaker(position, color, bgColor);
            }*********/
            else if (config.style == 'timeleft') {
                _soundInd = _makeTimeLeft(position, text, color, bgColor);
            }
            else {
                _soundInd = _makeTimeLeft(position, text, color, bgColor);
            }
            container.appendChild(_soundInd);
            _soundInd.style.display = showImmediately ? "table": "none";
        }
        let ret = new FactoryOneSoundIndicator(container, config);
        return ret;
    }
module.exports = MakeOneSoundIndicator_;