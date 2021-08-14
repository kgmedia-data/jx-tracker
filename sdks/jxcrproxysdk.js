(function() {
    //var crStarterFunction = null;
    var jxReady = false;
    var crReady = false;
    var visState = 'unknown';
    var unfiredTrackers = {
        creativeView: 1,
        impression: 1
    }
    var trackerBaseUrl = null;

    //For testing and development
    function emitDbgStr(msg) {
        console.log(msg);
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
        emitDbgStr(`############## FIRING ${action}`);
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
            emitDbgStr(`############## FIRING ${action}`);
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
        emitDbgStr(`############## handleVisUpdate ${newState}`);
        if (visState == 'jxvisible') {
            fireOneOffTracker('creativeView');
            setTimeout(function() {
                if (visState == "jxvisible") {
                    unfiredTrackers.done = true;
                    fireOneOffTracker('impression');
                }
            }, 2000);
        }
    }

    /*****
     * the callback being the last step to call to start the ad
     * provided by the sdk caller
    function runWhenReady_(callback) {
        if (jxReady) { //already true
            crReady = true;
            callback();
            console.log(`############## Bcalling starter functions`);
            handleVisUpdate(null);
        }
        else {
            //so that when jxReady, then this will be run.
            crReady = true;
            crStarterFunction = callback;
        }
    }
    *****/

    function creativeReady_() {
        emitDbgStr(`CCC ############## creativeReady called`);
        if (jxReady) { //if already true
            crReady = true;
            handleVisUpdate(null); //This is in case the vis states already started 
            //to come in (we keeping state so we may already know the area is currently
            //visible, say.
        }
        else {
            //Flag this true, so that when jxReady, then the creativeView-firing 
            //prep can got ahead
            crReady = true;
        }
    }

    function reportEvent_(action, extraSegment) {
        emitDbgStr(`CCC ############## reportEvent called ${action} ${extraSegment}`);
        fireTracker(action, extraSegment);
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
                emitDbgStr(`############## just gotten adparameters`);
                //we can start to process any things.
                jxReady = true; //jx SDK side all ready as already armed with tracker Base URL info
                //and also will be expected visibility notifications from renderer any time.

                notifyMaster('jxhasad'); //YES <-- this does not depend on the calling of creativeReady
                if (crReady) {
                    handleVisUpdate(null); //well, usu by this time (since we just posted the)
                    //jxhasad, we will not have jxvisible state updates yet. So this is redundant.
                }
                /* if (crStarterFunction) {
                    //if creative already said they ready, then nothing to wait for
                    let tmp = crStarterFunction;
                    crStarterFunction = null;
                    handleVisUpdate();
                    emitDbgStr(`############## Acalling starter functions`);
                    tmp();
                }*/
                break;
        }
    } //listen
    window.addEventListener('message', listen, false);
    notifyMaster('jxloaded');

    window.jxproxy = (function() {
        var queue = [];
        if (window.jxproxy) {
            // queue from outside might be null... 
            queue = window.jxproxy.queue || queue;
        }
        //here we execute code that is in the queue
        if (queue.length > 0) {
            window.jxproxy = {
                //runWhenReady: runWhenReady_,
                creativeReady: creativeReady_,
                reportEvent: reportEvent_
            };
        }
        while (queue.length > 0) {
            var command = queue.shift();
            command();
        }
        //must override the thing so that the queue functionis eual to running it then.
        return {
            //runWhenReady: runWhenReady_,
            creativeReady: creativeReady_,
            reportEvent: reportEvent_,
            queue: {
                push: function(fcn) {
                    //executing it now!!!
                    fcn();
                }
            }
        };
    })();
})();
