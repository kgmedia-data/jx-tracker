## JIXIE OSM for non-AMP

### Confluence: look for OSM
 - https://jixie.atlassian.net/wiki/spaces/ESD/pages/927563804/Advertisers+-+How-to+integrate+in+Jixie+Outstream+Manager+OSM
 - https://jixie.atlassian.net/wiki/spaces/ESD/pages/1007747122/Publishers+-+How+to+add+demand+partners+to+OSM+outstream+manager
 - for internal stuff there is a bunch of articles under this tree:
    - https://jixie.atlassian.net/wiki/spaces/DEMO/pages/808321025/Jixie+Outstream+Mediation+Layer
 
### ONE-OFF FAMILIARIZATION of this componentized stuff
 - Please read. Else some stuff will not appear to make sense
 - docs/HowDoesItWork.md

### Deployment 
- generated as bundles/jx-app-osm.min.js
    - ===> DEPLOYED LIVE AS https://scripts.jixie.io/jxosm.1.0.min.js

### Contents
- this is the OSM (outstream manager) which does the following
    - query adserver to get the waterfall of ads (typically partner tags e.g. teads, unruly, selectmedia) and the waterfall may contain also a jixie ad
    - the OSM engine will waterfall thru the tags (listening to 'impression' and 'no ad' messages from each partner)
    - if it comes to the jixie layer, note that currently the ability to render the jixie ad is built into the OSM JS itself (so no need to load another render script)

### Components' dependencies
* Dependencies (not showing modulesmgr, cssmgr and the basic/common)
   - bundles/osm.js: 
        - basic/ids : Used in this file: to assemble the needed info here to enable the adcall
        - basic/pginfo: ditto

        - osmengine/core
        - osmpartners/selectmedia : on how to inject the tag, detect has ad, no ad etc
        - osmpartners/teads : ditto
        - osmpartners/unruly : ditto
        - osmpartners/jixie 
        
        - renderer/core : this will render the jixie ad (another option would be to load the JS)
                            But for now we chose to build the component in.
                            Refer to runCreative_ in osmpartners/jixie.js
                            and the code mrenderer.createInstance below (<-- this is how
                            we just include the renderer in here)
            - renderer/univelements (we use the -stub variant of it) <-- since in OSM we never has to show those Learn More stuff
        
### snipplet and window variables
 -  window._jxosm
```
<script>
    window._jxosm = window._jxosm || [];
    window._jxosm.push({
      unit: "{osm ID}",
      selectors: ["{selector1}"],
    });
</script> 
<script type = "text/javascript" src = "{script URL}" defer> </script> 
```
   
