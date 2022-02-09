THIS FILE DOES NOT BUILD

(function(){
    // 
    if (window.abcdefgh) return;
    window.abcdefgh = 1;

    function _createJxRecHelper(containerId) {
        // TO return a recHelperObject
        // This object must have the following 2 apis:
        //reportClick: function() {},
        //registerItem: function() {},
        return {};
    }
    window.jxRecMgr = {
        createJxRecHelper: _createJxRecHelper
    }
})();


Your code from earlier veriosn:


/**
 * internal use only:
 * @param {*} numItems 
 * @param {*} trackerUrlBase 
 * @param {*} loadedTS
 * @returns 
 */
 let MakeOneEvtHelper = function(numItems, trackerBlock, loadedTS) {
    // private variables:
    var _actions = [];
    var _itemVis = null;
    var _trackerUrlBase = null;
    
    function _sendWhatWeHave() {
        //prepare the object to send.
        //URL is the trackerUrlbase
        var msgBody = {
            actions: _actions,
            items: _itemVis 
        };
        //**stringify** this body and then send. by sendBeacon (see notes.txt for snipplet)
    }
    function _doPgExitHooks() {

    }
    function _doPgExitHooks() {
        document.addEventListener('visibilitychange', function logData() {
            if (document.visibilityState === 'hidden') {
                _sendWhatWeHave();
            }
          });
          window.addEventListener("pagehide", event => {
            /* the page isn't being discarded, so it can be reused later */
            _sendWhatWeHave();
          }, false);
    }
    function FactoryEvtHelper(numItems, trackerBlock) {
        //NOTE: to record the loaded event also.
        for (let i = 0; i < n; ++i) a[i] = 0;
        _trackerUrlBase = trackerBlock.sharedParams + '&' + trackerBlock.sharedParams;
        _itemVis = JSON.parse.JSON.stringify(trackerblock.items);
        _doPgExitHooks();
    }
    FactoryEvtHelper.prototype.recordEvent = function(action, itemIdx = -1) {
        // TODO
        /* stash a record to your events array (CHECK THE SPECS and my notes)
        {   
            "action":"load",
            "y":3000 // the pixels from the top of the page, optional
        }
        */
    };
    FactoryEvtHelper.prototype.recordItemVis = function(itemIdx) {
        // TODO
        // find the right item in the _itemVis and set the v from 0 to 1 then.
        //_itemVis
    };
    //TODO: set up something to monitor the page being covered or killed.

    let ret = new FactoryEvtHelper(numItems, trackerBlock, loadedTS);
    return ret;
}

/** General helper function 
     * collect first party cookie info
     * and other info and pack it into an object with possibly these 
     * properties:
     * {
     *  client_id: ....
     *  sid: ...
     *  cohort: ...
     *  accountid: ...
     *  widget: ....
     *  pageurl: ....
     *  keywords: ...
     * }
     * returns an object.
     */
 function collectBasicInfo() {
    // TODO
}


