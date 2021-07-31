## VIDEO AD PLAYER for use from Jixie rendering framework (OSM, outstream)

### What is is supposed to replace
 - so this is meant to replace the
    jxplayerbride+jxvideo.1.4.min.js (which are called by the jxfriendly.1.3.min.js+jxoutstream.1.3.4.min.js)
 
### ONE-OFF FAMILIARIZATION of this componentized stuff
 - Please read. Else some stuff will not appear to make sense
 - docs/HowDoesItWork.md

### Deployment 
- generated as bundles/jx-app-videoadsdk.min.js
    - ==> DEPLOYED AS https://scripts.jixie.io/jxvideocr.1.0.min.js
    - loaded by all the rendering stuff built from this repo whenever it is necessary to play a video ad (loaded into a friendly iframe)

### Components' dependencies
* Dependencies (not showing modulesmgr, cssmgr and the basic/common)
   - bundles/videoadsdk.js: 
        - video/adplayer <-- IMPORTANT this is shared by both videoadsdk.js and videoadsdk-standalone.js 
            - video-styles/videoad
            - video/spinner-factory
            - video/replaybtn-factory
            - video/horizbanner-factory
            - video/admgr-factory
                - video/adctrls-factory
                - video-styles/videoad
            - video/vast            