/**
 * Bundle built for the jixie "player SDK"
 */
if (window.JX) {
    return;
}
const mids                              = require('../components/basic/ids');
const cssObj                            = require('../components/video-styles/default');//we choose this set of style
const _helpers                          = require('../components/video/helpers');
//one off init needed
const ids = mids.get();
_helpers.setIds(ids);
_helpers.setCssObj(cssObj);
//need to do the setCssObject before the damplayer inclusion
const createObject                      = require('../components/video/damplayer');

var instMap = new Map();   
function makePlayer(options) {
    let hashStr = btoa(JSON.stringify(options));
    let instMaybe = instMap.get(hashStr);
    if (instMaybe) {
        return;
    }
    let playerInst = createObject(options);
    instMap.set(hashStr, playerInst);
    return playerInst;
}

window.JX = {
    player :  function(options) {
        return (makePlayer(options, null));
    },
    ampplayer : function(options, ampIntegration) {
        _helpers.sendScriptLoadedTrackerAMP(ampIntegration);
        return (makePlayer(options, ampIntegration));
    }
};

