/**
 * Jixie SDK 
 */
(function() {
    var jxReady = false;
    var crReady = false;
    var preJxReadyEvents = [];
    var visState = 'unknown';
    var unfiredTrackers = {
        impression: 1
    }
    var trackerBaseUrl = null;

    //For testing and development
    function emitDbgStr(msg) {
        //console.log(`jxevetnsdk__##### ${msg}`);
        return; //
        try {
            let subj = 'Dbg: ' + (new Date()).toISOString();
            let data = JSON.stringify({text: subj + " " + msg});
            let xhr = new XMLHttpRequest();
            xhr.open("POST", "https://hooks.slack.com/services/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?text=xxxxxyyyyyzzzzz");
            xhr.send(data);
        }
        catch (error) {
        }
    }

    //this is for the type where the "application" triggers a event firing
    //we just send it
    function fireTracker(action, extraSegment) {
        emitDbgStr(`FIRING ${action}`);
        //and then actually fire it ajax call
        fetch(trackerBaseUrl + '&action='+action + (extraSegment ? '&'+extraSegment:''), {
            method: 'GET',
            credentials: 'include'
        }).catch((err) => {});
    }

    //this is for the sdk-managed events sending
    //We make sure we only send @ action once.
    function fireOneOffTracker(action) {
        if (unfiredTrackers[action]) {
            unfiredTrackers[action] = 0;
            emitDbgStr(`FIRING ${action}`);
            //and then actually fire it ajax call
            fetch(trackerBaseUrl + '&action='+action, {
                method: 'GET',
                credentials: 'include'
            }).catch((err) => {});
        }
    }

    //This is called in 2 scenarios: 
    //1. Upon new messages (jxvisible, jxnotvisible) arriving from renderer re visibility
    //2. When the application calls creativeReady; In this case, the param newState will be null.
    //This is in case the SDK is already all ready and already started to be informed
    //of (and thus keep) the vis state of the creative area.
    function handleVisUpdate(newState) {
        if (newState)
            visState = newState;
        if (visState == 'unknown' || unfiredTrackers.done || !crReady ) {
            return; //do nothing
        }
        emitDbgStr(`handleVisUpdate ${newState}`);
        if (visState == 'jxvisible') {
            setTimeout(function() {
                if (visState == "jxvisible") {
                    unfiredTrackers.done = true;
                    fireOneOffTracker('impression');
                }
            }, 2000);
        }
    }

    function creativeReady_() {
        if (jxReady) { //if already true
            emitDbgStr(`CCC creativeReady called1`);
            crReady = true;
            handleVisUpdate(null); //This is in case the vis states already started 
            //to come in (we keeping state so we may already know the area is currently
            //visible, say.
        }
        else {
            emitDbgStr(`CCC creativeReady called2`);
            //Flag this true, so that when jxReady, then the events-firing 
            //prep can got ahead
            ////we have to queue this stuff up then.
            crReady = true;
        }
    }

    function reportEvent_(arg) { //action, extraSegment) {
        if (jxReady) {
            emitDbgStr(`CCC reportEvent called ${arg}`);
            fireTracker('click', 'clickid='+arg);
        }
        else {
            preJxReadyEvents.push(arg);
            //we have to queue this stuff up then. coz dunno the tracker url how to fire!
        }
    }
  
    function notifyMaster(type, data = null) {
        if (type == 'jxloaded' || type == 'jxhasad') {  
            parent.postMessage(type, '*'); 
            return;
        }
        //we have no use case for this. maybe can scrape for now:
        let obj = {
            type: type,
        };
        if (data) {
            obj.data = data;
        }
        let msgStr = "jxmsg::" + JSON.stringify(obj);
        parent.postMessage(msgStr, '*');
    }
    function listen(e) {
        let json = null;
        let type = null;
        if (e.data == 'jxvisible' || e.data == 'jxnotvisible') {
            type = e.data;
        }
        if (e.data.indexOf('jxmsg::') == 0) {
            try {
                json = JSON.parse(e.data.substr('jxmsg::'.length));
                type = json.type;
            } catch (err) {}
        }
        if (!type) return; //unrelated to us, we dun bother.
        switch (type) {
            case "jxvisible":
            case "jxnotvisible":
                handleVisUpdate(type);
                break;
            case "adparameters":
                trackerBaseUrl = json.data.trackers.baseurl + '?' + json.data.trackers.parameters;
                emitDbgStr(`just gotten adparameters crReady=${crReady}`);
                //we can start to process any things.
                jxReady = true; //jx SDK side all ready as already armed with tracker Base URL info
                //and also will be expected visibility notifications from renderer any time.
                if (crReady) {
                    handleVisUpdate(null); //well, usu by this time (since we just posted the)
                    //jxhasad, we will not have jxvisible state updates yet. So this is redundant.
                    if (preJxReadyEvents.length > 0) {
                        for (var i  = 0; i < preJxReadyEvents.length; i++) {
                            emitDbgStr(`### Making up for the event that was emitted before SDK was ready`);
                            reportEvent_(preJxReadyEvents[i]);
                        }
                        preJxReadyEvents.length = 0;
                    }
                }
                break;
        }
    } //listen
    window.addEventListener('message', listen, false);
    notifyMaster('jxloaded');
    //for the creative to call on us.
    window.jxeventssdk = {
        creativeReady: creativeReady_,
        reportEvent: reportEvent_
    };

    //<---
    //https://mrcoles.com/blog/google-analytics-asynchronous-tracking-how-it-work/
    var JxEventsQ = function () {
        this.push = function () {
            for (var i = 0; i < arguments.length; i++) try {
                if (typeof arguments[i] === "function") arguments[i]();
                else {
                    let fcnname = arguments[i][0];
                    //console.log(`##### x = ${x}`);
                    //console.log(`##### y = ${y}`);
                    if (fcnname == 'creativeReady') {
                        //if our thing is really really loaded late, then perhaps we don't even have the stuff to send the event!
                        creativeReady_();
                    }
                    else if (fcnname == 'reportEvent') {
                        let arg = arguments[i][1];
                        //if our thing is really really loaded late, then perhaps we don't even have the stuff to send the event!
                        reportEvent_(arg);
                    }
                    // get tracker function from arguments[i][0]
                    // get tracker function arguments from arguments[i].slice(1)
                    // call it!  trackers[arguments[i][0]].apply(trackers, arguments[i].slice(1));
                }
            } catch (e) {}
        }
    };
    // get the existing _jxeventsq array
    var _old_jxeventsq = window._jxeventsq;
    // create a new _jxeventsq object
    window._jxeventsq = new JxEventsQ(); //actually no need object, just cloned from some website's snipplet .. :-)
    // execute all of the queued up events - apply() turns the array entries into individual arguments
    window._jxeventsq.push.apply(window._jxeventsq, _old_jxeventsq);
    //--->

})();
