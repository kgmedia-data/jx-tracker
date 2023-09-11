# README #

## What is this?
- the repo for building our Jixie OSM (outstream manager), HB renderer and the new universal unit, recommendation (tracker) SDK, recommendation widget, video widget
- From the gulpfile, you can more easily see where each thing is supposed to go to.

## What branches ?
- there is the master - the latest production-grade branch
- there are currently 2 production branches: they exist more for the sake of pipelines
    - production_rec_widget_sdk  
        - this branch is asso. with a pipeline to build the recommendation sdk script, recmomendation widget script, and video widget scripts and push them to s3
    - production_osm 
        - this branch is asso. with a pipeline (manual trigger) to build the jixie osm script, header-bidding rendering script and universal script, and push them to s3.
## Branching Practices:        
- branching practices: can branch off from master (e.g. rw-FES-123-blabla)
- But more often than not there will be certain fixes based off the production_videosdk or production_osm branch 
    - then after a while, I will manually introduce them to the master branch
        means there are periods when master, production_osm and production_rec_widget_sdk will be divergent. But after a while, they should all be equalized.

## Deployment Method: MANUAL PIPELINE via bitbucket GUI:
- to deploy the osm files (branch should be production_osm)
    - visit bitbucket console - pipelines section
    - choose the branch "production_osm"
    - choose the pipeline: "custom: production_osm"

- to deploy the widget files (branch should be production_rec_widget_sdk)
    - visit bitbucket console - pipelines section
    - choose the branch "production_rec_widget_sdk"
    - choose the pipeline: "custom: production_rec_widget_sdk"


## More info
- read the gulpfile.js : lines 1 - 150 should say it all.

## deployment snipplets to give to the publisher:
- OSM:
    https://jixie.atlassian.net/wiki/spaces/ESD/pages/1381368160/OSM+-+outstream+manager
    - will give basic OSM embed, and how to deploy OSM thru GAM
- Headerbidding renderer:    
    - TO WRITE: how to embed the hb-renderer (it is done by the adserver)
- Universal unit:    
    - TO WRITE: how to embed the universal unit, and how to do that thru GAM
- recommendation widget/video recommendation widget:
    - https://jixie.atlassian.net/wiki/spaces/DEMO/pages/1847721989/Video+Widget
    - https://jixie.atlassian.net/wiki/spaces/DEMO/pages/1870954501/Recommendation+Widget
- recommendation SDK:
    - https://jixie.atlassian.net/wiki/spaces/ESD/pages/1854373889/Recommendation+SDK    


## What is this repository for? #
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
- There might be some remnants of jx video sdk but that thing has been moved into its own repo (jixie-player-sdk-for-web)


## For Rationale please read docs/HowDoesItWork.md

/*
/*
    video and banner+video types
    -put our video js-script in IFRAME
    -wait for jxloaded message
    -postMessage(adparameters)
    -wait for jxhasad etc message
    -postMessage(jxvisible etc) - creatives fires the trackers, not us

    DPA
    -inject the template HTML in IFRAME
    -wait for jxloaded message
    -postMessage(adparameters)
    -wait for jxhasad etc message
    -postMessage(jxvisible etc) - creatives fires the trackers, not us

    simple display image
    -we just stick in the image into the DOM (DIV), but we hook onload, onerror and talk to self using events on the div
    -wait for jxhasad etc event
    -call our own handler upon jxvisible (we fire trackers)
    
    display script fragment (can be injected into DIV or IFRAME)
    -we just stick the fragment into the DOM
    -we fake jxhasad
    -call our own handler upon jxvisible (we fire trackers)

    player script (can be injected into DIV or IFRAME)
    -stick the script into the DOM 
    -these older generation of stuff they are all talk using arguments or query params
        (for trusted, they use query param to the script url, for IFRAME
            they seem to use the jxuni_p injected into the iframe)
    -wait for jxhasad etc event or message
    -we postMessage (& dispatchEvents too) for jxvisibile etc.

    */
