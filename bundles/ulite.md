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
 -  window.jxuniversal , window.jxuniversal.init
 - This is well known and well documented in the Confluence under the words "universal". 
```
  var p ={
							              maxwidth: 640, // set a maximum width
							              unit: "62dfd0d28588b4a2ed791b90dda06fce",
							              container: "jxOutstreamContainer", 
							          };
							         // We have a function waiting for the script to be loaded before initialsing it
							          function jxdefer(p) {
							               if (window.jxuniversal) {
							                     window.jxuniversal.init(p);
							               } else {
							                     setTimeout(function() { jxdefer(p) }, 100);
							               }
							           }
							           jxdefer(p);
							      </script>
          						  <!-- <script type="text/javascript" src="https://jx-creatives.s3-ap-southeast-1.amazonaws.com/universal-ad-unit/js/jxfriendly.1.3.js" defer></script> -->
          						  <!-- <script type="text/javascript" src="../../js/jxfriendly.1.3.min.js" defer></script> -->
          						  <script type="text/javascript" src="https://scripts.jixie.io/jxfriendly.1.3.min.js" defer></script>
						        </div>```
   
