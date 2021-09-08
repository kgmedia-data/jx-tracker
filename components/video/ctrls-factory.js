 /**
     * Makes a Control Object for PLAYER. In the end we decided not to...
     * So we are really using mostly the HTML5 <video>'s controls
     * THis object only do the big play button
     */
 
 const modulesmgr            = require('../basic/modulesmgr');
 const common                = modulesmgr.get('basic/common');

 const cssmgr                = modulesmgr.get('video/cssmgr');
 const thumbnailCls          = cssmgr.getRealCls('thumbnailCls');
 const hideCls               = cssmgr.getRealCls('hideCls');
 const bigPlayBtnCls         = cssmgr.getRealCls('bigPlayBtnCls');
 
 function MakeOnePlayerControlsObjD_(container, vectorFcn) {
    function FactoryOnePlayerControlsD() {}
    var _vectorFcn = null;
    var _container = null;
    var _thumbnailImg = null;
    var _bigPlayBtn = null;
    var _boundClickedCB = null;
    var _boundImgLoadedFcn = null;
    //all the callback functions (these are promise resolvers) we record so 
    //that we call them at one go when there is a click
    //to avoid dangling promise chains.
    //Coz while we are still "in" one promise chain (setV) to get ready one video
    //user could very well (inpatient) click on another thumbnail in the widget
    //to launch yet another video in the playlist.
    var _knownClickCBs = [];
    function FactoryOnePlayerControlsD(container, vectorFcn) {
        _vectorFcn = vectorFcn;
        _container = container;
    }
    
    FactoryOnePlayerControlsD.prototype.reset= function(){
        _container.removeChild(_bigPlayBtn);
        _bigPlayBtn = null;
        _container.removeChild(_thumbnailImg);
        _thumbnailImg = null;
    }

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
        if (_bigPlayBtn)
            _bigPlayBtn.classList.add(hideCls);
        if (_thumbnailImg)                
            _thumbnailImg.classList.add(hideCls);
        if (_boundClickedCB)  {              
            common.removeListener(_bigPlayBtn, 'click', _boundClickedCB);
            _boundClickedCB = null;
        }
        for (var i = 0; i < _knownClickCBs.length; i++) {
            _knownClickCBs[i]();
        }               
        _knownClickCBs.length = 0;
    }
    function _showSpinner () {
        if (_vectorFcn.showSpinner) vectorFcn.showSpinner();
    }

    function _hideSpinner() {
        if (_vectorFcn.hideSpinner) vectorFcn.hideSpinner();
    }
    /**
     * If somehow somehow the play started then this should be called.
     * (play can start thru various channels ... See comment for _clickedCB function above.
     * actually I am thinking, once the play starts, we can just remove the thumbnail??
     */
    FactoryOnePlayerControlsD.prototype.videoVisualsHide= function() {
        _hideSpinner();
        if (_bigPlayBtn && _boundClickedCB) {
            _boundClickedCB( );
        }
        else {
            if (_thumbnailImg) {               
                _thumbnailImg.classList.add(hideCls);
                _thumbnailImg = null; //aiyo can we just get rid of it .
                //we are not going to show this again, right?
            }
        }

    }
    /**
     * If there is a need (e.g. autoplay attempt failed or configuration is click to play)
     * Then this will be called.
     * @param {*} cb 
     */
    FactoryOnePlayerControlsD.prototype.showBigPlayBtn= function(cb){
        if (!_bigPlayBtn) {               
            //for now should be spinner
            /**/
            _bigPlayBtn = document.createElement("a");
            _bigPlayBtn.href = "javascript:void(0)";
            _bigPlayBtn.className = bigPlayBtnCls;
            ////if (isMobileDeviceBPB_) _bigPlayBtn.className = mobilePlayBtnCls;
            _container.appendChild(_bigPlayBtn);
        }
        if (_bigPlayBtn) {
            if (cb)  {
                _knownClickCBs.push(cb);
                //note: may be no need to bind already...
                _boundClickedCB = _clickedCB.bind({ cb: cb });
                common.addListener(_bigPlayBtn, 'click', _boundClickedCB);//not sure about touch
            }
            _bigPlayBtn.classList.remove(hideCls)
        }
    }
   
    //a function to be bound
    function imgLoadedFcn() {
        try {
        this.img.removeEventListener('load', _boundImgLoadedFcn);
        }
        catch(ee) {}
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
    FactoryOnePlayerControlsD.prototype.videoVisualsInit= function(thumbnailURL, imgLoadedCB){
        _showSpinner();
        if (!_thumbnailImg) {
            let r = Math.floor(Math.random() * (2000) + 1);
            let thumbnailID = thumbnailCls + '-' + r;//want ID for wat?
            _thumbnailImg = common.newDiv(_container, "img", null, thumbnailCls, thumbnailID);
        }
        if (thumbnailURL && thumbnailURL != _thumbnailImg.src) {
            _boundImgLoadedFcn = imgLoadedFcn.bind({ img: _thumbnailImg, cb: imgLoadedCB });
            _thumbnailImg.addEventListener('load', _boundImgLoadedFcn);
            _thumbnailImg.src = thumbnailURL; 
            if (_thumbnailImg.complete) {
                _boundImgLoadedFcn();
            }
        }
    }
    /**
     * every video : second stage. reached a canplay stage. so we remove the spinner.
     * So now can remove the loading spinner then
     * @param {*} thumbnailURL 
     */
    FactoryOnePlayerControlsD.prototype.videoVisualsRemoveSpinner= function(){
        _hideSpinner();
    }
    FactoryOnePlayerControlsD.prototype.showNativeControl= function(){
        return true;
    };
    
    //all do nothing
    FactoryOnePlayerControlsD.prototype.reset= function(){};
    FactoryOnePlayerControlsD.prototype.updatePlayState= function(){};
    FactoryOnePlayerControlsD.prototype.updateMutedState= function(){};
    FactoryOnePlayerControlsD.prototype.hideControls= function(){};
    FactoryOnePlayerControlsD.prototype.showControls= function(){};
    FactoryOnePlayerControlsD.prototype.setBtnMuteActive= function(){};
    FactoryOnePlayerControlsD.prototype.setBtnPlayActive= function(){};
    FactoryOnePlayerControlsD.prototype.togglePlay= function(){};
    FactoryOnePlayerControlsD.prototype.showProgressBar= function(){};
    FactoryOnePlayerControlsD.prototype.hideProgressBar= function(){};
    FactoryOnePlayerControlsD.prototype.setTramsitionProgressBar= function(){};//SPELLING
    FactoryOnePlayerControlsD.prototype.updateVolume= function(){};
    FactoryOnePlayerControlsD.prototype.updatePlayBtn= function(){};
    FactoryOnePlayerControlsD.prototype.initializeVideoInfo= function(){};
    FactoryOnePlayerControlsD.prototype.updateTimeElapsed= function(){};
    FactoryOnePlayerControlsD.prototype.updateProgressBar= function(){};
    let ret = new FactoryOnePlayerControlsD(container, vectorFcn);
    return ret;
}
module.exports = MakeOnePlayerControlsObjD_;


/* 
 ************** module: video/ctrls-factory ******************************************

 lazy implementation which only uses the native controls ...

* module.exports:
    - function which will make one player controls object
     The made object will have the following functions:
    
    - showBigPlayBtn function(cb)
    - videoVisualsInit function(thumbnailURL, imgLoadedCB)
        every video starts like this: stick the thumbnail there on top first
        then put the loading spinner
        When do we even put in the spinner then?
        Thumbnail we put down very early.
    - videoVisualsHide function() 
        hide all those thumbnail stuff; called when we detect play
    - videoVisualsRemoveSpinner= function()
        called when Video is ready (metadataloaded) to be played so remove the 
        loading spinner

    - reset function()

    The rest like do nothing since we are using the native controls:
    -  
    - updatePlayState function()
    - updateMutedState function()
    - hide function()
    - show function()
    - setBtnMuteActive function()
    - setBtnPlayActive function()
    - togglePlay function()
    - updateProgressBar function()
    - showProgressBar function()
    - hideProgressBar function()
    - setTramsitionProgressBar function()

* requires/dependencies:
    various
*/