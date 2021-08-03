## JIXIE HBRENDERER

### ONE-OFF FAMILIARIZATION of this componentized stuff
 - Please read. Else some stuff will not appear to make sense
 - docs/HowDoesItWork.md

### Deployment 
- Whether non-AMP (client-side headerbidding) or AMP (server side using appnexus prebid server), both can use this to render the ad
- generated as bundles/jx-app-hbrenderer.min.js
    - ==LIVE AS => https://scripts.jixie.io/jxhbrenderer.1.1.min.js

### Components' dependencies
* Dependencies (not showing modulesmgr, cssmgr and the basic/common)
   - bundles/hbrenderer.js: 
        - note that we don't need all those basic/ids, basic/pginfo coz the ad is already determined and will be passed to our renderer as a base64 encoded string.
        
        - renderer/core  
            - renderer/univelements (-stub version; coz for HB we do not show those "learn more" stuff)
        
### snipplet and window variables

 -  window.jxhbuniversal , window.jxhbuniversal.hbinit
 - The whole SNIPPLET of HTML/script to trigger the hb renderer is spit out by the adserver (hb.jixie.io in the response). It looks something like this:
 - this is the snipplet of code in the adserver
```
<div id="jxoutstream${rannum}" style="width: 100%;"> <script type="text/javascript" src="https://scripts.jixie.io/jxhbrenderer.1.1.min.js" defer=""></script> 
<script> 
var p ={ 
    maxwidth: 300, 
    pgwidth: 300,  
    container: "jxoutstream${rannum}", 
    jsoncreativeobj64: <Base64 encoded string of the ad JSON response>
}; 
function jxdefer(p) { 
    if (window.jxhbuniversal) { 
        window.jxhbuniversal.hbinit(p); 
    } 
    else { 
        setTimeout(function() { jxdefer(p) }, 100); 
    } 
}  
jxdefer(p); 
</script> 
</div>
```
 - this thing will be in some DFP iframe. So on a page if there is our jixie ads "winning" a few slots then our this hbrendering script will be loaded and initialized a few times (Coz different "window" space)