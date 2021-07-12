/**
 * Bundle built to make a simple rendering script
 * Main use is to replace the current hbrenderer.min.js
 * Can also be used for OSM
 * (though I suspect for OSM we just build the renderer into the OSM script)
 * 
 * Very simple the whole creative is already in base64 encoded string
 * No need fetch ad.
 * But we support more than 1 creative though
 * Means the script loaded once only but if within same window
 * there are multiple chances to do work, we will
 */

if (window.jxrenderer && window.jxrenderer.init) {
    return;
}

const modulesmgr                    = require('../components/basic/modulesmgr');
const univelements                  = require('../components/renderer/univelements-stub');
modulesmgr.set('renderer/univelements',         univelements);
const mrenderer                     = require('../components/renderer/core');

function start_(options) {
    //here we make no effort to get ids pageinfo coz they are not needed.
    var inst = mrenderer.createInstance(options);
    //no need lah instMap.set(hashStr, inst);
}

window.jxrenderer = {
    init: start_
};
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