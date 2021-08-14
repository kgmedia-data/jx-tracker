/* 
   For jixie creatives which only want to run untrusted script (or HTML)

   For untrusted (i.e. renderer sticks this creative in iframe it creates),
   the communications is much simpler, actually.

   Not difficult to ensure all communication between 
        renders <--> creative
   are only received and handled by the intended recipient 

   If you follow this template, then all the plumbing already done

   The DPA templates and the bundles/videoad.js already follow thsi patterns

   Communications refer to :
     from creative to renderer: jxloaded, jxhasad, jxnoad
     From renderer to creative: adparameters jxvisible jxnotvisible
 */   
/*
can have HTML stuff here
But then the script part of your creative should be this
 */
   (function() {
    let MakeOneInst = function(containerId, data) {
        //Note: containerId will be null (just to be uniform as the other trusted script)
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
         * IMPLEMENTATION OF YOUR CREATIVE 
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
            parent.postMessage(msgStr, '*'); 
            return;
        }
        let obj = {
            type: type,
        };
        //it will always be null
        if (containerId) {
            obj.token = containerId;
        }
        if (data) {
            obj.data = data;
        }
        let msgStr = "jxmsg::" + JSON.stringify(obj);
        parent.postMessage(msgStr, '*');
    }
    let onlyInst = null;
    let runMe = function(containerId, adparameters) {
        if (!onlyInst)
            onlyInst = MakeOneInst(containerId, adparameters);
    }
    let notifyMe = function(containerId, action) {
        if (onlyInst)
            onlyInst.handleNotify(action);
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
                notifyMe(null, type);
                break;
            case "adparameters":
                runMe(null, json.data);
                break;
        }
    } //listen
    window.addEventListener('message', listen, false);
    notifyMaster(null, 'jxloaded');
})();

