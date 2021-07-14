
//not quite ready yet.
let MakeOneAdScheduler_ = function(delay,
    interval,
    maxslots,
    podsize) {

    var _usedSlots = 0;
    var _sLastSlot = -1;
    var _podSize = 1;
    var _maxSlots = 3;
    var _sInterval = 90;
    var _sNext = 5; //some default delay...
    var _dirty = true;
    function FactoryOneAdScheduler(delay, interval, maxSlots, podSize) {
        if (delay === undefined) {
            delay = 5;
        }
        if (interval === undefined) {
            interval = 90;
        }
        if (maxSlots === undefined) {
            maxSlots = 3;
        }
        if (podSize === undefined) {
            podSize = 1;
        }
        _podSize = podSize;
        _maxSlots = maxSlots;
        _sInterval = interval;
        _sDelay = delay;
        _sNext = delay;
        _dirty = true;
    }

    
    FactoryOneAdScheduler.prototype.reset = function() {
        //whenever a new video we reset.
        _numSlots = 0;
        _dirty = true;
    }
    function _updateNext(accuTime) {
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
        return _sNext;
    }
    //So when the time comes, we still do a last minute check:
    FactoryOneAdScheduler.prototype.canPlayAd = function(accuTime, playhead, duration) {
        //check playhead, duration stuff
        //about the max slots stuff
        return true;
    }
    //if yes, then we "take Ad Slot"
    FactoryOneAdScheduler.prototype.useSlot = function(accuTime) {
        _usedSlots++;
        _sLastSlot = accuTime;
        _updateNext(accuTime);
        return _sNext;
    }
    FactoryOneAdScheduler.prototype.getNext = function(accuTime) {
        _updateNext(accuTime);
        return _sNext;
    }
    
    let ret = new FactoryOneAdScheduler(
        delay,
        interval,
        maxslots,
        podsize
    );
    return ret;
}
module.exports = MakeOneAdScheduler_;