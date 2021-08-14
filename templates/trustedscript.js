/* 
   For jixie creatives which wants to run as a trusted + untrusted script

   Why need follow a template: ensure all communication between 
        renders <--> creative
   are only received and handled by the intended recipient 

   If you follow this template, your script will be fine both as trusted and
   non-trusted

   Communications can be:
    jxloaded (only needed if untrusted)
    jxhasad, jxnoad
    
    adparameters jxvisible jxnotvisible

    

   The earlier "trusted" scripts actually have issues in the sense that
   the communication with the renderer side is broken
   If there are a few of these in the same "window", there is no good way 
   to make sure the right renderer instance is hearing from the creative
   that it is managing

   We don't bother to fix those old creatives (mainly player scripts) as they
   are not really used.

   But moving forward, if a JIXIE script must be "trusted", then it should be
   written based on this template

   Then there will be no problem of messages flying to the wrong recipient.
   The renderer side is already enabled to do like this.
 */   
(function() {
    // Signature of your script
    // %%%%%%% something known to the render core.js %%%%%%%
    const mySig = 'jx_video_ad'; //

    if (window[mySig]) {
        return;
    }
    window[mySig] = 1;

    let MakeOneInst = function(containerId, data) {
        //Note: containerId could be null
        //if it is null, means this script is run as untrusted 
        //i.e. renderer created an iframe just to stick this script inside
        //So you just use the "body" to hang your stuff then.
        //

        //Use function notifyMaster to talk to the renderer
        //e.g. change height, has ad, no ad 


        //create an object which must at least expose on function
        //notifyMe
        function Bla() {
            //..TODO IMPLEMENT
        }
        /****
         * IMPLEMENTATION OF YOUR CREATIVE JS
         * ...
         * ...
         * ...TODO TODO
         * ..
         */
        //You must expose this function to hear stuff from renderer 
        //jxvisible, jxnotvisible
        Bla.prototype.handleNotify = function(action) {
            //TODO: handle jxvisible, jxnotvisible sent our way from renderer
        }
        let ret = new Bla(containerId, data);
        return ret;
    }

    function notifyMaster(containerId, type, data = null) {
        if (type == 'jxloaded') {  
            //not necessarily right bah.
            //may not be parent ah.
            parent.postMessage(msgStr, '*'); 
            return;
        }
        let obj = {
            type: type,
        };
        if (containerId) {
            //for matching at the renderer level.
            obj.token = containerId;
        }
        if (data) {
            obj.data = data;
        }
        let msgStr = "jxmsg::" + JSON.stringify(obj);
        parent.postMessage(msgStr, '*');
    }


    let instMap = new Map();
    let iFrameCr = null;
    let runMe = function(containerId, adparameters) {
        let cr = MakeOneInst(containerId, adparameters);
        if (!containerId) {
            //if we are in iframe, then this is null
            iFrameCr = cr;
        } else { //if not in iframe, then possibly got other instances of this
            //thing on the window. then stick it in a map
            instMap.set(containerId, cr);
        }
    }
    let notifyMe = function(containerId, action) {
        let cr = containerId ? instMap.get(containerId) : iFrameCr;
        if (cr) {
            cr.handleNotify(action);
        }
    }

    window[mySig] = (function() {
        var queue = [];
        if (window[mySig]) {
            // queue from outside might be null... 
            queue = window[mySig].queue || queue;
        }
        //here we execute code that is in the queue
        if (queue.length > 0) {
            window[mySig] = {
                run: runMe,
                notify: notifyMe
            };
        }
        while (queue.length > 0) {
            var command = queue.shift();
            command();
        }
        //must override the thing so that the queue functionis eual to running it then.
        return {
            run: runMe,
            notify: notifyMe,
            queue: {
                push: function(fcn) {
                    //executing it now!!!
                    fcn();
                }
            }
        };
    })();

    //The listening is only needed when you are sure sometimes your JS will 
    //be served by renderer inside an iframe. 
    //If your this script will always be trusted : true, then no need the following
    //code:
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
                notifyMe(null, type);
                break;
            case "adparameters":
                runMe(null, json.data);
                break;
        }
    } //listen
    window.addEventListener('message', listen, false);

    notifyMaster(null, 'jxloaded');
    // Only needed when univeral unit is outside our iframe ----->
})();

