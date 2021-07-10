/**
     * Makes a Control Object for ADS
     * 
     * APIs for the ADS Controls object: TO BE FILLED IN (basically are the prototype functions)
     */
//const consts                          = require('./consts'); 
const _helpers                          = require('./helpers');
const _cssObj                           = _helpers.getCssObj();
const adControlsCls                     = _cssObj.adControlsCls;
const adPlayBtnCls                      = _cssObj.adPlayBtnCls;
const adMuteBtnCls                      = _cssObj.adMuteBtnCls;
const progressBarCls                    = _cssObj.progressBarCls;
const hideCls                           = _cssObj.hideCls; //???



const btnPlayID = 'btnPlayID';
const btnMuteID = 'btnMuteID';

 function MakeOneAdControlsObj_(container, vectorFcn) {
    var _container = null;
    var _cDiv = null;
    var _vectorFcn = null;
    var _isPlaying = false;
    var _isMuted = false;
    var _playBtn = null;
    var _muteBtn = null;
    var _progressBarDiv = null; // progress bar element
    var _progressBarPaused = false; // progress bar paused status
    var _vendors = [
        '-webkit-',
        '-o-',
        '-moz-',
        '-ms-',
        ''
    ];
    
    var _togglePlay = function() {
        //NOTE: In here, we do not try to set the button look
        //we depend on the updatePlayState, updateMutedState of
        //this object being called (this is in response to adsManager
        //events.) That is the one source of truth
        if(_isPlaying) {
            _vectorFcn.pause();
        } else {
            _vectorFcn.play();
        }
        return false;
    };

    var _toggleMute = function() {
        if(_isMuted) {
            _vectorFcn.unMute();
        } else {
            _vectorFcn.mute();
        }
        return false;
    };

    /** append specified style property to specified element */
    var _setStyleToElement =  function(el, prop, val) {
        _vendors.forEach(function(vendor) {
            var p = _helpers.toCamelCase(vendor + prop);
            if(p in el.style) {
                el.style[p] = val;
                }
        });
    }

    function FactoryOneAdControls(container, vectorFcn) {
        _container = container;
        _vectorFcn = vectorFcn;
        let r = Math.floor(Math.random() * 1000);
        const innerElm = '<span style="width: 0px;"></span>'; // the child element of the progress bar
        const controlDiv = '<div style="float:left; width:30px;">' + 
                            '<a href="javascript:void(0)" id="' + btnPlayID + '-' + r + '" class="' + adPlayBtnCls + '"></a></div>' + 
                          '<div style="float:left; width:30px;margin-left:3px;">' + 
                            '<a href="javascript:void(0)" id="' + btnMuteID + '-' + r + '"  class="' + adMuteBtnCls + '"><span></span></a></div>';
        _cDiv = _helpers.newDiv(
            _container,
            "div",
            controlDiv,
            adControlsCls
        );
        _progressBarDiv = _helpers.newDiv(
            _container,
            "div",
            innerElm,
            progressBarCls
        );
        _playBtn = document.getElementById(btnPlayID + '-' + r);
        _muteBtn = document.getElementById(btnMuteID + '-' + r);
        _playBtn.onclick = _togglePlay;
        _muteBtn.onclick = _toggleMute;
    };
    //these are called when the adsManager events happens.
    FactoryOneAdControls.prototype.updatePlayState = function(isPlaying) {
        _isPlaying = isPlaying;
        if (isPlaying) 
            _playBtn.classList.add('active');
        else                
            _playBtn.classList.remove('active');
    }
    FactoryOneAdControls.prototype.updateMutedState = function(isMuted) {
        _isMuted = isMuted;
        if (isMuted) 
            _muteBtn.classList.add('mute');
        else                
            _muteBtn.classList.remove('mute');
    }
    FactoryOneAdControls.prototype.hide = function() {
        _cDiv.classList.add(hideCls);
        _progressBarDiv.classList.add(hideCls);
    };
    FactoryOneAdControls.prototype.show = function() {
        _cDiv.classList.remove(hideCls);
        _progressBarDiv.classList.remove(hideCls);
    };
    FactoryOneAdControls.prototype.updateProgressBar= function(value, transitionTime){
        if (_progressBarDiv && _progressBarDiv.children.length > 0) { // check if the progress bar has a child element i.e span element
            _progressBarDiv.children[0].style.width = Math.floor(value) + 'px'; // set the specified width to span element
            _setStyleToElement(_progressBarDiv.children[0], 'transition', 'width '+transitionTime+'s linear') // set the transition to span element
        }
    };
    FactoryOneAdControls.prototype.pauseProgressBar= function(value){
        if (_progressBarDiv && _progressBarDiv.children.length > 0) { // check if the progress bar has a child element i.e span element
            _progressBarDiv.children[0].style.width = Math.floor(value) + 'px'; // set the specified width to span element
            _setStyleToElement(_progressBarDiv.children[0], 'transition', 'none') // set transition to none to stop the animation of progress bar
        }
    };
    FactoryOneAdControls.prototype.getProgressBarChildElm = function(){
        if (_progressBarDiv && _progressBarDiv.children.length > 0) {
            return _progressBarDiv.children[0]; // return the child element of the progress bar i.e <span></span>
        }
    };
    FactoryOneAdControls.prototype.getProgressBarElm = function(){
        if (_progressBarDiv && _progressBarDiv.children.length > 0) {
            return _progressBarDiv; // return the progress bar element
        }
    };
    FactoryOneAdControls.prototype.isProgressBarHasPaused = function() {
        return _progressBarPaused; // return the progress bar status, whether it has been paused or not
    };
 
    let ret = new FactoryOneAdControls(container, vectorFcn);
    return ret;
};
module.exports = MakeOneAdControlsObj_;