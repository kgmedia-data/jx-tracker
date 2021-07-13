## How does this work?
* Motivation
    - our scripts are getting big. Even though there are individual "objects", but the file is getting huge. e.g. video SDK
    - we are writing over and over the same / similar code and putting them into new places
        - e.g. getting page url etc info, getting id info (Needed by OSM, video SDK, universal (normal/lite))
    - there is specialization:
        - e.g. display of creative (aka jxoutstream.1.3.4.js) But then there should be specialization
            - in the sense that if it is just to display a resolved creative in e.g. HB
                - no need to support adcall
                - no need to support those universal "elements" (Learn More)
                - ==> would be good there is a specialization of that which is SMALLER!

* How it works
    - using browserify ('require' <-- which is by right a node.js concept and not for browser JS)
    - During build time (thru gulp), browserify will walk the top file
        - scanning for 'require'
        - it is recursive e.g. top file is A.js and it 'require's B.js & C.js. And B.js can in turn 'require' C.js and D.js etc.
        - it will make sure the needed modules are packed into the final JS (typically called a bundle) only once

    - During run time, when require('B') is encountered, 
        - the code inside B.js would be run. The "result" is whatever that is exposed via the module.exports = ... at the bottom
        - IMPORTANT!!
        - Note, if B is also 'require'ed by some other stuff in the tree, B.js will not be re-run. That require statement will just return the "cached module.exports" from the earlier run of B.js
        - So all the stuff (your constants, variables) in  your B.js - they can "live on" in the closure and get updated as the module.exported functions are called (An example is /basic/modulesmgr.js). Good thing is that they are in the closure and not accessible outside of it.

* We go one step further! 
    - To achieve a true mix and match, we introduce another concept of modules manager
    - e.g. Bundle 1 we build the typical video SDK, bundle 2 we need to build a special one with a very different sound indicator (peculiar to Publisher "Super" but a lot of code and styles)
    - If we look at the dependency tree it is like this (some details e.g. helpers object omitted):
    - bundle:
        video/damplayer
            video/player-factory
                video/admgr-factory
                    video/cssmgr
                    video/adctrls-factory
                        video/cssmgr
                video/ctrls-factory
                    video/cssmgr
                video/soundind-factory
                video/spinner-factory
                    video/cssmgr

    - so in this example, video/soundind-factory is required by video/player-factory and NOT DIRECTLY by the bundle.
    - if the code WERE such that the code for video/player-factory DIRECTLY REQUIRES video/soundind-factory, then there is NO good way to easily mix and match stuff.
    - Thus we introduce the possibility of using modules manager (if you want)
    - A good example would be the bundles/videosdk.js
        - It loads everything UPFRONT in the bundles/videosdk.js file
            i.e. even though bundles/videosdk.js DOES NOT DIRECTLY use the sound indicator, it still 'require' the sound indicator js (the standard implementation)
        - Whatever brought in via 'require' upfront, we add it to the modules manager object
        - Then video/player-factory INSTEAD OF 'require' 'video/soundind-factory' - it will just modulesmgr.get('video/soundind-factory'); to get it
    - How does it encourage MIX and MATCH?
        - back to our hypothetical example - we can clone bundles/videosdk.js into bundles/videosdk-superpubdesign.js
        - bundles/videosdk.js has these 2 lines:
            - const soundind_fact = require('../components/video/soundind-factory');
            - modulesmgr.set('video/soundind-factory',soundind_fact); //<-- LOOK 
        - bundles/videosdk-superpublisher.js has these 2 lines:
            - const soundind_fact = require('../components/video/soundind-factory-supersuper');
            - modulesmgr.set('video/soundind-factory',soundind_fact); //<-- LOOK! SAME AS THE ONE ABOVE!!
        - NOTE the key-idea is: 
            - the video/player-factory the code will try to retrieve using the generic name:
            - const MakeOneSoundIndicator     = modulesmgr.get('video/soundind-factory');
            
   






