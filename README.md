# README #

# What is this?
- the repo for building our Jixie video player, OSM, HB renderer and hopefully soon the new universal unit
- From the gulpfile, you can more easily see where each thing is supposed to go to.

# More info
- read the gulpfile.js : lines 1 - 150 should say it all.


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
