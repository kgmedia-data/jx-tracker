/**
 * Bundle built to make HB winning creative renderer
 * 
 * Documentation: refer to hbrenderer.md in this same dir
 */
if (window.jxhbuniversal && window.jxhbuniversal.hbinit) {
    return;
}
const modulesmgr                    = require('../components/basic/modulesmgr');

const common                        = require('../components/basic/commonsmall');
modulesmgr.set('basic/common',     common);

//////const univelements                  = require('../components/renderer/univelements-stub');
//////modulesmgr.set('renderer/univelements',         univelements);
const mrenderer                     = require('../components/renderer/corehb');

function start_(options) {
    //the adserver will put in the config object
    //options.pgwidth (to equal the bidded slot's width)
    //In the absense of options.maxwidth, the pgwidth will be assigned to maxwidth too.
    //so all good.
    delete options.maxwidth;//
    
    //no showing of those Learn More... etc
    options.nested = -1; //<--- by default nested = -1 no need to say here ah
    //here we make no effort to get ids pageinfo coz they are not needed.
    var inst = mrenderer.createInstance(options);
    //no need lah instMap.set(hashStr, inst);
    //
}

window.jxhbuniversal = {
    hbinit: start_
};

//this is a now-common design-pattern so that the code calling us
//can just call us without checking if our script is loaded yet.
/*
window._jxhbrendererq = window._jxhbrendererq || [];
window._jxhbrendererq.push(p);

whereby the p is an object like this:
{ 
    tsjsrun: Date.now(), 
    responsive: 1, 
    nested: -1,
     maxwidth: 640, 
      container: "jxoutstream${rannum}",
       jsoncreativeobj64: "${hbresponse64}"
};
*/

/* FROM OSM CODE
var JxOSMQ = function () {
    this.push = function () {
        for (var i = 0; i < arguments.length; i++) try {
            if (Array.isArray(arguments[i]) && arguments[i][0] == 'init') {
                start(arguments[i][1]);    
            }
            else 
                start(arguments[i]);
        } catch (e) {}
    }
};

*/
var JxEventsQ = function () {
    this.push = function () {
        for (var i = 0; i < arguments.length; i++) try {
            if (typeof arguments[i][0] === "string") {
                let fcnname = arguments[i][0];
                if (fcnname == 'init' && arguments[i].length >= 2) {
                    start_(
                     arguments[i][1]
                    );
                }
            }
            else {
                start_(arguments[i]);
            }
        } catch (e) {}
    }
};
//let's build a version 2 then.
const ourSigQ = '_jxhbrendererq';
var _old_eventsq = window[ourSigQ];
window[ourSigQ] = new JxEventsQ(); //actually no need object, just cloned from some website's snipplet .. :-)
// execute all of the queued up events - apply() turns the array entries into individual arguments
if (_old_eventsq) {
    window[ourSigQ].push.apply(window[ourSigQ], _old_eventsq);
}

//Notes to self:
/*
To play video that's a different story for prebid if you answer VIDEO.
But to us everything is display (CHECK )
  else if (o.p.hbparams64 && o.p.hburlpath) {
                o.surl = o.p.hburlpath; 
}*/
/* This is the blob generated by adserver
`<div id="jxoutstream${rannum}" 
style="width: 100%;"> 
<script type="text/javascript" src="${consts.hbSALRenderUrl}" defer=""></script> 
<script> var p ={ 
    tsjsrun: Date.now(), 
    responsive: 1, 
    nested: -1,
     maxwidth: 640, 
      container: "jxoutstream${rannum}",
       jsoncreativeobj64: "${hbresponse64}"
    };
        function jxdefer(p) { if (window.${jxuniversal_}) { window.${jxuniversal_}.hbinit(p); } else { setTimeout(function() { jxdefer(p) }, 100); } } fetch('${dbgScriptRunUrl}&tsjsrun=' + p.tsjsrun); jxdefer(p); </script> </div>`;            
*/        