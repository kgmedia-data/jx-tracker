## JIXIE amp_ad script - this is WIP still. Not yet operationally live

### ONE-OFF FAMILIARIZATION of this componentized stuff
 - Please read. Else some stuff will not appear to make sense
 - docs/HowDoesItWork.md

### Deployment 
 - it needs to be deployed as  https://scripts.jixie.io/jxamp.min.js
 - This is hardcoded into the AMP runtime. Cannot anyhow change
 - publisher embeds something like this on their AMP pages:
 ```
 <h2>Jixie</h2>
  <amp-ad width="400" height="300" type="jixie" layout="responsive"
  data-unit="jixietestunit"
  data-cid="1174"
  data-options='{"miscParams":{"reserve1":"test1","reserve2":"test2"}}'>
  </amp-ad>
  ```

### Components' dependencies
* Dependencies (not showing modulesmgr, cssmgr and the basic/common)
 - bundles/amp-osm.js:
    - osmengine/amp-core
        - osmpartners/amp-teads
        - osmpartners/amp-unruly
        - osmpartners/amp-jixie
        
    - as of now (still in development phase ...), to render a jixie ad,
    we are loading a jixie renderer JS (i.e. it is not built into this file yet)