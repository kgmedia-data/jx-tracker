 * Bundle built to make simple creative renderer 
 * It is not good to make ad call coz it does not try to get ids/pg info etc
 * BUt it be well equipped to render a creative available in the jsoncreativeobj64
 * property of the options object
 * 
 * Documentation: refer to jxrenderer.md in this same dir
 * 
 * There is no use for this script now. No deployment
 */
 
## JIXIE SIMPLE RENDERER

### ONE-OFF FAMILIARIZATION of this componentized stuff
 - Please read. Else some stuff will not appear to make sense
 - docs/HowDoesItWork.md

### Deployment 
- generated as bundles/jx-app-jxrenderer.min.js
    - not live . no use case yet.
    - It is not good to make ad call coz it does not try to get ids/pg info etc
        - BUt it be well equipped to render a creative available in the jsoncreativeobj64 property of the options object
        - since we already have the specific hbrenderer.js we have currently no use for this generic dumb renderer
 

### Components' dependencies
* Dependencies (not showing modulesmgr, cssmgr and the basic/common)
   - bundles/hbrenderer.js: 
        - note that we don't need all those basic/ids, basic/pginfo coz the ad is already determined and will be passed to our renderer as a base64 encoded string.
        
        - renderer/core  
            - renderer/univelements 
        
### snipplet and window variables

 -  window.jxrenderer , window.jxrenderer.init
```
<div id="jxoutstream${rannum}" style="width: 100%;"> <script type="text/javascript" src="https://scripts.jixie.io/????????.min.js" defer=""></script> 
<script> 
var p ={ 
    maxwidth: 300, //<--- TODO: To think about the pgwidth stuff!!!
    container: "jxoutstream${rannum}", 
    jsoncreativeobj64: <Base64 encoded string of the ad JSON response>
}; 
function jxdefer(p) { 
    if (window.${jxuniversal_}) { 
        window.${jxuniversal_}.hbinit(p); 
    } 
    else { 
        setTimeout(function() { jxdefer(p) }, 100); 
    } 
}  
jxdefer(p); 
</script> 
</div>
```
 