# README #

## use gulp xxxx to build 
- Just type gulp x and it will spit out the possible arguments

## Deployment Names
- bundles/amp-osm.js 
    ==x PLANNED BY NOT YET ==>  https://scripts.jixie.io/jxamp.min.js

- bundles/hbrenderer.js 
    - ===> https://scripts.jixie.io/jxhbrenderer.1.1.min.js
    
- bundles/osm.js 
    - ===> LIVE AS https://scripts.jixie.io/jxosm.1.0.min.js

- bundles/ulite.js 
    - ==x PLANNED BUT NOT YET : replace https://scripts.jixie.io/jxfriendly1.3.min.js from universal repo

- bundles/videoadsdk-standalone.js 
    - ==x not yet ==> https://universal.jixie.io/js/jxvideo.1.3.min.js"
    - i.e. when i feel ready, likely I will just have the contents of the jxvideo.1.3.min.js will be replaced by the new stuff
    - used mainly by publisher - the Kompas MASTER HEAD campaigns

- bundles/videoadsdk.js
    - ===> LIVE AS https://scripts.jixie.io/jxvideocr.1.0.min.js"
    - This is loaded by the renderers e.g jxosm.1.0.min.js / HB renderer, Univer renderer to play video type creatives

- bundles/videosdk.js
    - ===> LIVE AS https://scripts.jixie.io/jxvideo2.1.min.js


### What is this repository for? ###
* Quick summary
- changed a lot of our frontend scripts (not including jixietracker) to be COMPONENTIZED.
- i.e. try not to have repeated code
- So each 'thing' is an assembly of some basic services and some more code
- At the top of the food chain are the stuff in the bundles/ directory (Or the "apps) :
    - Each one will get built into one of our core script offerings
        - hb renderer
        - osm (classic) - currently it loads ulite dyn. will change to "include" it
        - osm (amp)
        - univ full (means can play all kinds of stuff including the old players e.g. DM, YT, etc)
        - jixie video SDK


* Version
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

## For Rationale please read docs/HowDoesItWork.md
