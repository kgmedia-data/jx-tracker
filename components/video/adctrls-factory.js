/**
     * Makes a Control Object for ADS
     * 
     * APIs for the ADS Controls object: TO BE FILLED IN (basically are the prototype functions)
     */
 const modulesmgr            = require('../basic/modulesmgr');
 const common                = modulesmgr.get('basic/common');
 const cssmgr                = modulesmgr.get('video/cssmgr');
 
 const btnPlayID = 'btnPlayID';
 const btnMuteID = 'btnMuteID';
 
  function MakeOneAdControlsObj_(container, vectorFcn, doProgressBar = true, controlsObj = null) {
     const styles                = cssmgr.getRealCls(container);
     var _container = null;
     var _cDiv = null;
     var _vectorFcn = null;
     var _isPlaying = false;
     var _isMuted = false;
     var _playBtn = null;
     var _muteBtn = null;
     var _progressBarWrapper = null; // progress bar wrapper element
     var _progressBar = null; // progress bar element
     var _progressBarPaused = false;
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
             var p = common.toCamelCase(vendor + prop);
             if(p in el.style) {
                 el.style[p] = val;
                 }
         });
     }
 
     function FactoryOneAdControls(container, vectorFcn, doProgressBar, controlsObj) {
         _container = container;
         _vectorFcn = vectorFcn;
         
         let cColor = (controlsObj && controlsObj.color ? controlsObj.color: '#FF0000');
         cssmgr.inject(container, 'adControls', { color: cColor });
 
         let r = Math.floor(Math.random() * 1000);
         const innerElm = '<span style="width: 0px;"></span>'; // the child element of the progress bar
         const controlDiv = '<div style="float:left; width:30px;">' + 
                             '<a href="javascript:void(0)" id="' + btnPlayID + '-' + r + '" class="' + styles.adPlayBtn + '"></a></div>' + 
                           '<div style="float:left; width:30px;margin-left:3px;">' + 
                             '<a href="javascript:void(0)" id="' + btnMuteID + '-' + r + '"  class="' + styles.adMuteBtn + '"><span></span></a></div>';
         _cDiv = common.newDiv(
             _container,
             "div",
             controlDiv,
             styles.adCtrl
         );
         if (controlsObj && controlsObj.position == 'right') {
             _cDiv.style.right = '5px';
             _cDiv.style.left = 'unset';
         }
 
         if (doProgressBar) {
             _progressBarWrapper = common.newDiv(
                 _container,
                 "div",
                 innerElm,
                 styles.adProg
             );
             _progressBar = _progressBarWrapper.children[0];
         }
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
         _cDiv.classList.add(styles.hide);
         if (_progressBarWrapper) _progressBarWrapper.classList.add(styles.hide);
     };
     FactoryOneAdControls.prototype.show = function() {
         _cDiv.classList.remove(styles.hide);
         if (_progressBarWrapper) _progressBarWrapper.classList.remove(styles.hide);
     };
     FactoryOneAdControls.prototype.updateProgressBar= function(value, adData){
         if (_progressBar) { // check if the progress bar child element i.e span element
             let transitionTime = adData.duration;
             if (_progressBarPaused) {
                 transitionTime = adData.duration - adData.currentTime;
                 _progressBarPaused = false;
             }
 
             _progressBar.style.width = Math.floor(value) + 'px'; // set the specified width to span element
             _setStyleToElement(_progressBar, 'transition', 'width '+transitionTime+'s linear') // set the transition to span element
         }
     };
     FactoryOneAdControls.prototype.pauseProgressBar= function(){
         if (_progressBar && _progressBarWrapper) {
             if (_progressBar.offsetWidth < _progressBarWrapper.offsetWidth) {
                 _progressBarPaused = true;
                 _progressBar.style.width = Math.floor(_progressBar.offsetWidth) + 'px'; // set the specified width to span element
                 _setStyleToElement(_progressBar, 'transition', 'none');
             }
         }
     };
     FactoryOneAdControls.prototype.resetProgressBar= function(){
         _progressBarPaused = false;
         _progressBar.style.width = '0px';
         _setStyleToElement(_progressBar, 'transition', 'none');
     };
  
     let ret = new FactoryOneAdControls(container, vectorFcn, doProgressBar, controlsObj);
     return ret;
 };
 module.exports = MakeOneAdControlsObj_;

 /* 
 ************** module: video/adctrls-factory ******************************************

* module.exports:
    - function which will make one ad controls object
     The made object will have the following functions:
    
     updatePlayState = function(isPlaying)
     updateMutedState = function(isMuted) 
     
     hide = function() 
     show = function() 

     updateProgressBar= function(value, adData)
     pauseProgressBar= function()
     resetProgressBar= function()

    
* requires/dependencies:
    a lot
*/