## JIXIE NEW UNIVERAL for non-AMP

### ONE-OFF FAMILIARIZATION of this componentized stuff
 - Please read. Else some stuff will not appear to make sense
 - docs/HowDoesItWork.md

### Deployment 
- This is meant to replace those jxfriendly + jxoutstream stuff in the universal-ad-unit repo
- generated as bundles/jx-app-ulite.min.js
    - NOT YET deployed since it will require a lot of testing as so many different creative types are to be supported and tested
    - Plan is to replace https://scripts.jixie.io/jxfriendly.1.3.min.js

### Components' dependencies
* Dependencies (not showing modulesmgr, cssmgr and the basic/common)
   - bundles/ulite.js: 
        - basic/ids : Used in this file: to assemble the needed info here to enable the adcall
        - basic/pginfo: ditto

        - renderer/core  
            - renderer/univelements 
        
### snipplet and window variables
 -  window._jxuniv  
 - This is well known and well documented in the Confluence under the words "universal". 
```
window._jxuniv = window._jxuniv || [];
 window._jxuniv.push({
     maxwidth: 640,
     unit: "62dfd0d28588b4a2ed791b90dda06fce", // TO BE REPLACED WITH THE AD UNIT ID (HERE IT IS DEMO ONLY)
     container: "jxOutstreamContainer",<-- DIV ID OF WHERE YOU WANT THE AD
     creativeid: 1707,  <- if want to force a creativeid, sure
 });
 <script type = "text/javascript" src = "{script URL}" defer> </script> 
 
```
   
