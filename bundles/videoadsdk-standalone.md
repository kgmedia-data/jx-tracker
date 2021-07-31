## VIDEO AD SDK for publisher use

### Confluence:
 - https://jixie.atlassian.net/wiki/spaces/DEMO/pages/242122812/Player+SDK+jxvideo.x.y.js
 - All along this is https://scripts.jixie.io/jxvideo.1.3.min.js
 
### Historical:
 - due to the fact that the ad container width and height are hardcoded inside jxvideo.1.3.min.js, the publisher has been doing various hacks - translation, scaling to make things look ok (esp if the video ad is not even 16:9; just some translation to "get by")
 - This new codebase should take care of all the issues.

### How to manage the transition?
 - the new JS should work with the current way KG is using it
 - they make a 640x360 to give to the SDK (As SDK expects that and hardcodes that when working with IMA SDK) and then apply scaling in their script
 - They can continue to do that
 - However, with the new capability, they can do away with all such scaling attempts. Just pass us a container which is in the correct size and shape and we will fill it up always
 
### ONE-OFF FAMILIARIZATION of this componentized stuff
 - Please read. Else some stuff will not appear to make sense
 - docs/HowDoesItWork.md

### Deployment 
- generated as bundles/jx-app-videoadsdk-standalone.min.js
    - ==PLANNED TO BE DEPLOYED AS https://scripts.jixie.io/jxvideo.1.3.min.js
    - so the publishers do not need to change anything unless they want to


### Contents
 - just refer to the Confluence external doc above to know what this script is supposed to do
 - What is new about this new implementation
    - supports the published APIs and features
    - follows the size of the container passed in, so caller no need to do scaling 
    - i.e. supports videos of any shape
    - Looping was supported by the jixie VPAID JS earlier
    - But in this, the looping is supported by this JS
    - this is in anticipation that the jixie SIMID creative cannot support looping (some quirks). So we may as well move the operation here.

### Components' dependencies
* Dependencies (not showing modulesmgr, cssmgr and the basic/common)
   - bundles/videoadsdk-standalone.js: 
        - video/adplayer <-- IMPORTANT this is shared by both videoadsdk.js and videoadsdk-standalone.js 
            - video-styles/videoad
            - video/spinner-factory
            - video/replaybtn-factory 
            - video/horizbanner-factory <-- use dummy version which does nothing
            - video/admgr-factory
                - video/adctrls-factory
                - video-styles/videoad
            - video/vast 