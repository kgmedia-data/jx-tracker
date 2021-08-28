/**
 * This showcase the strucutre of a new creative 
 * This example one it has signature jxvideoadsdk
 * If you write your own jixie creative using this template, then easily it can
 * just be served trusted (and multiple instances in the same window space will work ok!) or
 * untrusted (in its own iframe) and can talk to the renderer .
 */
(function() {
    /**
     * 
     * 
     * START OF PART 1 of Standard template stuff for a new creative type 
     * This thing can easily be trusted and non-trusted (depends on how renderer create us)
     * 
     * 
     */
    if (window.jxvideoadsdk) { //SIGNATURE!
        //something particular to this creative form.
        //this signature need to be known to the renderer
        return;
    }
    window.jxvideoadsdk = 1;
    const ourSig = 'jxvideoadsdk';
    const ourSigQ = 'jxvideoadsdkq';
    var trusted = false;
    if (window.jxrenderercore) {
        //then we know we as a creative were created as trusted
        //since we are in the same window as the renderer.
        trusted = true;
    }



    /**
     * 
     * 
     * END OF PART 1 of Standard template stuff for a new creative type PART
     * 
     * 
     */



    let MakeOneInst = function(containerId, data) {
        //Note: containerId could be 'default'
        //if it is 'default', means this script is run as untrusted 
        //i.e. renderer created an iframe just to stick this script inside
        //So you just use the "body" to hang your stuff then.

        //Use function notifyMaster to talk to the renderer
        //e.g. change height, has ad, no ad 


        //create an object which must at least expose on function
        //notifyMe
        function Bla() {
            //..TODO IMPLEMENT
        }
        /****
         * 
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



    //With this suggested structure, then you can easily support multiple instances of your
    //creative within 1 window space:
    var instMap = new Map();
    function makeCreative(containerId, adparameters) {
        if (!containerId) {
            //so in your code above, if containerId is default, then you know
            //to just hang the stuff in the 'body' then.
            containerId = 'default';
        }
        let instMaybe = instMap.get(containerId);
        if (instMaybe) {
            return;
        }
        let playerInst = MakeOneInst(containerId, adparameters);
        instMap.set(containerId, playerInst);
        return playerInst;
    }

    /**
     * 
     * 
     * START OF PART 2 of Standard template stuff for a new creative type 
     * This thing can easily be trusted and non-trusted (depends on how renderer create us)
     * 
     * 
     */
    function listen(e) {
        let json = null;
        if (typeof e.data === 'string' && e.data.startsWith('jx'))
        ;
        else {
            return;
        }
        if (e.data == 'jxvisible' || e.data == 'jxnotvisible') {
            json = {
                type: e.data
            };
        }
        if (!json && e.data.indexOf('jxmsg::') == 0) {
            try {
                json = JSON.parse(e.data.substr('jxmsg::'.length));
            } catch (err) {}
        }
        if (!json) return; //unrelated to us, we dun bother.
        if (!json.token) {
            json.token = 'default';
        }
        switch (json.type) {
            case "jxvisible":
            case "jxnotvisible":
                let instMaybe = instMap.get(json.token);
                if (instMaybe) {
                    instMaybe.notifyMe(json.type);
                }
                break;
            case "adparameters":
                makeCreative(json.token, json.data);
                break;
        }
    } //listen

    if (!trusted) {
        window.addEventListener('message', listen, false);
        notifyMaster('jxloaded', ourSig);
    }

    //NOTE: If want to resize can call this:
    //notifyMaster('size', ourSig, {height: 512});

    function notifyMaster(type, token, data = null) {
        let msgStr = '';
        if (type == 'jxloaded') {
            token = window.name;
        }
        let obj = {
            type: type,
            token: token
        };
        if (data) {
            obj.params = data;
        }
        msgStr = "jxmsg::" + JSON.stringify(obj);
        if (trusted) { //it is just a function call then
            window.jxrenderercore.notify(type, token, data);
            //OR you can call like this:
            //window.jxrenderercore.notifyByStr(msgStr);
        } else {
            parent.postMessage(msgStr, '*');
        }
    }

    var JxEventsQ = function() {
        this.push = function() {
            for (var i = 0; i < arguments.length; i++) try {
                if (typeof arguments[i][0] === "string") {
                    let fcnname = arguments[i][0];
                    if (fcnname == 'message' && arguments[i].length >= 2) {
                        listen({
                            data: arguments[i][1]
                        });
                    }
                }
            } catch (e) {}
        }
    };
    // get the existing queue array
    var _old_eventsq = window[ourSigQ];
    window[ourSigQ] = new JxEventsQ(); //actually no need object, just cloned from some website's snipplet .. :-)
    // execute all of the queued up events - apply() turns the array entries into individual arguments
    if (_old_eventsq)
        window[ourSigQ].push.apply(window[ourSigQ], _old_eventsq);
    /**
     * 
     * 
     * END OF PART 2 of Standard template stuff for a new creative type 
     * This thing can easily be trusted and non-trusted (depends on how renderer create us)
     * 
     * 
     */



})();