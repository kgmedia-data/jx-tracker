# README #

# What is this?
- the repo for building our Jixie video player, OSM, HB renderer and hopefully soon the new universal unit
- From the gulpfile, you can more easily see where each thing is supposed to go to.

# What branches ??!
- there is the master
- there are currently 2 production branch that matters:
    - production_videosdk (which is supposed to produce the file for this https://scripts.jixie.media/jxvideo.3.1.min.js)
    - production_osm (which is supposed to produce everything else)
- sometimes there will be certain fixes based off the production_videosdk or production_osm branch
    - then after a while, I will manually introduce them to the master branch
    - so that the master branch is the great superset. 
    - then merge master into e.g. production_videosdk (i.e. master = production_videosdk)
    - i.e. sometime the production_videosdk will deviate from master
    - however, periodically the master will be updated to have those changes


# More info
- read the gulpfile.js : lines 1 - 150 should say it all.

# deployment snipplets to give to the publisher:
```
      <!-- this div is styled by the publisher . it is the publisher who wants this fixed height thing -->
      <div class="ads-partner-wrap osmloc osmplaceonsite" style="min-height: 400px;max-width:100%">
      <p></p>
      </div>

        <!-- if you want two OSM units, fine: another one somewhere else on the page -->
      <div class="ads-partner-wrap osmloc1 osmplaceonsite" style="min-height: 400px;max-width:100%">
      <p></p>
      </div>
      
                            <!-- NO LONGER NEEDED <div id="osmdiv11111" style="display: none; visibility: hidden;"> -->
                               <script>
                                    window._jxoutstreammgrq = window._jxoutstreammgrq || [];

                                    //the first unit
                                    window._jxoutstreammgrq.push({
                                      unit: "1000008-iT3q5Ci4Ry",
                                      selectors: [".osmloc p:last"], //<--- this refers to that first div
                                      //not needed anymore managerdiv: "osmdiv",
                                      fixedheight: 400,
                                      excludedheight: 100
                                  });
                                  //second unit
                                    window._jxoutstreammgrq.push({
                                      unit: "1000116-VQEYBh645k", //usually should be a different unit.
                                      selectors: [".osmloc1 p:last"], //<--- this refers to the second div (destination for ad)
                                      // not need anymore managerdiv: "osmdiv",
                                      //You can use this to force creatives waterfall: creativeids: 1631, //1166,
                                      fixedheight: 400,
                                      excludedheight: 100
                                  });
                               </script>
                               <script type="text/javascript" src="https://scripts.jixie.media/jxosm.1.0.min.js" defer></script> 
```

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
