## bundles/videosdk.js

### First-timers pls read carefully docs/HowDoesItWork.md

### Deployment 
 - as https://scripts.jixie.io/jxvideo2.1.min.js
 - kompas' content video player (in trial phase)

### Dependencies: 
 - bundles/jxvideosdk.js:
    - video-styles/default
    - video/damplayer
        - video/player-factory
            - video/admgr-factory
                - video/adctrls-factory
                - video/cssmgr
            - video/ctrls-factory
                - video/cssmgr
            - video/soundind-factory
            - video/spinner-factory
                - video/cssmgr
 - Coz we want 'mix-n-match' possibility (re HowDoesItWork.md), only the bundles/videosdk.js will 'require' specific modules.
    - the modules below do not do 'require' explicitly. They get the objects from the modules manager instead
        
### Multiple instances management:
 - supported. For a given window on the page, the script main body will only be run once 
    - top of script checks for window.JX's. If there, returns.
 - window.JX exposes player and ampplayer APIs to instantiate a player instance with an options object
 - the caller would typically save the returned player instance and call on its APIs
