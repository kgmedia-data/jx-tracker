
/**
 * a pretty custom ad scheduler for the video sdk
 * THIS IS ACTUALLY A VERY CUSTOM SCHEDULER. IT IS NOT THAT GENERIC IN
 * ITS APIs exposd. THE MAIN GOAL IS TO MIN COMPUTATION AT EVERY PLAYHEAD UPDATE.
 * 
 * So the exposed object does expect certain order of calling its functions.
 * But I guess I'd still have it as a module to just make each file short.
 * 
 * Currently only used by player-factory.js
 * 
 * @param {*} adscfg 
 * @returns 
 */
let MakeOneAdScheduler_ = function(adscfg) {
    var _sLastSlot = -1;
    var _podSize = 1;

    //Here the usedSlots and maxSlots include the preroll that we assume
    //will be played somehow at the start (not managed by us)
    var _usedSlots = 0;
    var _maxSlots = 999; //in here the maxslots also includes PURE PREROLL.
                         //delay == 0 means publisher wants first ad to be
                         //pure preroll
    var _sInterval = 9999999;
    var _sDelay = 8;
    var _minTimeLeft = 0;
    var _sNext = 8; //some default delay...
    var _dirty = true;
    function FactoryOneAdScheduler(adscfg) {
        //adscfg = {
          //  delay : 0,
            //interval: 70,
            //mintimeleft: 8
        //};
        if (adscfg.hasOwnProperty('delay') && !isNaN(adscfg.delay)) {
            _sDelay = parseInt(adscfg.delay);
        }
        if (adscfg.hasOwnProperty('interval') && !isNaN(adscfg.interval)) {
            _sInterval = parseInt(adscfg.interval);
        }
        
        if (adscfg.maxslots && !isNaN(adscfg.maxslots)) {
            _maxSlots = parseInt(adscfg.maxslots);
        }
        if (adscfg.hasOwnProperty('mintimeleft') && !isNaN(adscfg.mintimeleft)) {
            _minTimeLeft = parseInt(adscfg.mintimeleft);
        }
        if (adscfg.podsize && !isNaN(adscfg.podsize)) {
            _podSize = parseInt(adscfg.podsize);
        }
        if (_sDelay == 0) {
            //coz the first one is not managed by us (the preroll)
            _usedSlots = 1;
        }
        if (_sDelay == -1) {//dun want ads
            _maxSlots = 0;
        }
        if (_sInterval === 0 || _sInterval === 9999999) {
            _sInterval = 9999999;
            _maxSlots = 1; //Like that? <--- test this. TODO MON
        }
        if (_minTimeLeft == 0) {//not set, then we still give something
            _minTimeLeft = Math.ceil(_sInterval/2);
        }
        _dirty = true;
    }
    FactoryOneAdScheduler.prototype.reset = function() {
        _sLastSlot = -1;
        //whenever a new video we reset.
        _usedSlots = (_sDelay === 0? 1: 0);
        _dirty = true;
    }
    function _updateNext(accuTime) {
        if (_usedSlots >= _maxSlots) {
            _sNext = -1;
            _dirty = false;
            return;
        }
        if (_sLastSlot == -1) {
            _sNext = _sDelay;
            if (_sNext == 0) {
                _sNext = _sInterval == 0 ? -1: _sDelay + _sInterval;
            }
        }
        else {
            _sNext = _sInterval == 0 ? -1: _sLastSlot + _sInterval;
        }
        //
        if (_sNext != -1 && _sNext < accuTime) {
            //if ... for some strange reason
            _sNext = accuTime + 2;
        }
        _dirty = false;
    }
    //get time of next time slot and it will be saved there.
    //first slot is 0, but can still have others ah.
    FactoryOneAdScheduler.prototype.getFirstNonPreroll = function() {
        if (_dirty) {
            _updateNext(0);
        }
        if (_sNext == -1) return null;
        return {
            reqTime: _sNext <= 3 ? 0: _sNext -3,
            playTime: _sNext
        };
        //console.log(`__DEBUG podSize=${_podSize} maxSlots=${_maxSlots} minTimeLeft=${_minTimeLeft} interval=${_sInterval} delay=${_sDelay}`);
        //console.log(`__DEBUG(So far ${_usedSlots}) first non preroll ${_sNext}`);
        return _sNext;
    }
    //So when the time comes, we still do a last minute check:
    FactoryOneAdScheduler.prototype.canPlayAd = function(playhead, duration) {
        //notes: it seems for livestream this duration will be a huge number (many years)
        // so this comparison will succeed always then.
        if (duration - playhead < _minTimeLeft) {
            //if haven't played the first ad, then ok can go ahead even though we 
            //start play near the end of the video
            //console.log(`__DEBUG(So far decision= ${_sDelay && _usedSlots == 0 ? true: false}   (playhead=${playhead} vs duration=${duration})`);
            return (_sDelay && _usedSlots == 0 ? true: false);
        }
        //check playhead, duration stuff
        //about the max slots stuff
        //console.log(`__DEBUG(So far ${_usedSlots}) CAN play ad (playhead=${playhead} vs duration=${duration})`);
        return true;
    }
    //if yes, then we "take Ad Slot"
    FactoryOneAdScheduler.prototype.useSlot = function(accuTime) {
        _usedSlots++;
        _sLastSlot = accuTime;
        _updateNext(accuTime);
        //console.log(`__DEBUG(So far ${_usedSlots}) use slot at ${accuTime} ; next slot is ${_sNext}`);
        return _sNext;
    }
    FactoryOneAdScheduler.prototype.getAdIdx = function(adTagBase) {
        return _usedSlots-1;
    }
    FactoryOneAdScheduler.prototype.getNext = function(accuTime) {
        _updateNext(accuTime);
        if (_sNext == -1) return null;
        return {
            reqTime: _sNext <= 3 ? 0: _sNext - 3,
            playTime: _sNext
        };
    }
    let ret = new FactoryOneAdScheduler(adscfg);
    return ret;
}
module.exports = MakeOneAdScheduler_;



/**** OUR LITTLE TEST CODE
 * THIS IS ACTUALLY A VERY CUSTOM SCHEDULER. IT IS NOT GENERIC. THE MAIN GOAL IS TO
 * MIN COMPUTATION AT EVERY PLAYHEAD UPDATE.
 
let adS =  MakeOneAdScheduler_(
    {
        delay: 0,
        interval: 90,
        mintimeleft: 20,
        maxslots: 2,
        podsize: 1
    });

let _accumulatedTime;
let _lastPlayhead;
let duration;

function cb(currentTime) {
    //console.log(`playhead=${playhead} acc=${_accumulatedTime}`);
    let diff = currentTime- _lastPlayhead;
    if (diff < 0) diff = 0 - diff;
    if(diff <= 2) {
        _accumulatedTime += diff;
    }

    if (Math.floor(Math.random() * 20) > 18)
        console.log(`playhead=${currentTime} acc=${_accumulatedTime}`);
    if (_nextAdSlot != -1 && _accumulatedTime > _nextAdSlot) {
        console.log(`!!!!!! ${_accumulatedTime} > ${_nextAdSlot}`);
        if (adS.canPlayAd(currentTime, duration)) {
            _nextAdSlot = adS.useSlot(_accumulatedTime);
        }
    }
    _lastPlayhead = currentTime;
}

function V1() {
    val = 120;//v1 start playing at 120th second.
    duration = 150;
    console.log(`starting video 1`);
    _accumulatedTime = 0;
    adS.reset();
    _nextAdSlot = adS.getFirstNonPreroll();
    _lastPlayhead = 0;
    
    let iTimer = setInterval(function() {
        //handling
        cb(val);
        val += 0.2;      
        if (val >= duration) {
            console.log("---- VIDEO1 ENDING--->");
            clearInterval(iTimer);
        }
    }, 20);
}

function V2() {
    val = 0; //v2 start playing at beginning.
    duration = 220;

    console.log(`starting video 2`);
    _accumulatedTime = 0;
    adS.reset();
    _nextAdSlot = adS.getFirstNonPreroll();
    _lastPlayhead = 0;
    let iTimer = setInterval(function() {
        //handling
        cb(val);
        val += 0.2;      
        if (val >= duration) {
            console.log("---- VIDEO2 ENDING--->");
            clearInterval(iTimer);
        }
    }, 20);
}

function V3() {
    val = 45; //v2 start playing at beginning.
    duration = 60;

    console.log(`starting video 3`);
    _accumulatedTime = 0;
    adS.reset(); //<---- IMPORTANT
    _nextAdSlot = adS.getFirstNonPreroll();//<---- IMPORTANT
    _lastPlayhead = 0;
    let iTimer = setInterval(function() {
        //handling
        cb(val);
        val += 0.2;      
        if (val >= duration) {
            console.log("---- VIDEO3 ENDING--->");
            clearInterval(iTimer);
        }
    }, 20);
}

setTimeout(V1, 0);
setTimeout(V2, 20000);
setTimeout(V3, 50000);
    */

/* 
 ************** module: video/adscheduler-factory*******************************************

* module.exports:
  - A function which makes one adscheduler object (You have to call it)
    Typically called like this
    const MakeOneAdScheduler  = require('../components/video/adscheduler-factory');

* requires/dependencies:
  - none

  var _adS = MakeOneAdScheduler(adsCfg);//done once. for all videos

  when switching video, pls call _adS.reset() to reset the stats of adS.
  Also pls do something like  
      _nextAdSlot = _adS.getNext();
  
  Then in your content video's playhead update callback, you should do this:      

  if (_nextAdSlot != -1 && _accumulatedTime > _nextAdSlot) {
        if (adS.canPlayAd(currentTime, duration)) { 
            //Why ? if remaining time is too short, we still may cancel the adslot
            //if it is not a first ad.
            _nextAdSlot = adS.useSlot(_accumulatedTime);
            // then pls do whatever is necessary to trigger the midroll with countdown etc
        }
    }

*/