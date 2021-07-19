# Testing a creative render in HB Server Side Sites
-  Multi Resource overrides needed:


## 1. doctor the response from the prebid adserver used by Kompas (which is hosted by appnexus)
* FROM URL : https://prebid.adnxs.com/pbs/v1/openrtb2/amp?tag_id=15573016&w=300&h=600&ow=&oh=&ms=300x600%2C300x250&slot*
* TO URL : https://jixieamptest.kompas.com/api/jsongen?filename=bid&tag_id=test
* The response of the above hack endpoint (TO URL) is basically this:
- `{"targeting":{"hb_bidder":"openx","hb_bidder_openx":"openx","hb_cache_host":"prebid.sin3.adnxs-simple.com","hb_cache_host_openx":"prebid.sin3.adnxs-simple.com","hb_cache_id":"f38c9fe2-a08d-47cc-b8ed-fb0c305c0be9","hb_cache_id_openx":"f38c9fe2-a08d-47cc-b8ed-fb0c305c0be9","hb_cache_path":"/pbc/v1/cache","hb_cache_path_openx":"/pbc/v1/cache","hb_pb":"0.19","hb_pb_openx":"0.19","hb_size":"300x250","hb_size_openx":"300x250"}}`;
* Note that since KG has not added the JX units to the appnexus side yet, so there is no jixie in the picture. We just ride on some existing adnetwork in their config


## 2. doctor the response from the DFP of kompas
* FROM URL : https://securepubads.g.doubleclick.net/gampad/ads?iu=%2F31800665%2FKOMPAS.COM_Mobile_AMP*hb_pb_openx*
* TO URL : https://jixieamptest.kompas.com/api/testpagegen?filename=dfphb&tag_id=test
* The response of the above hack endpoint is a big blob, but the essense is this:
````
<script>
  var ucTagData = {};
  ucTagData.adServerDomain = "";
  ucTagData.pubUrl = "https://jogja.tribunnews.com/2021/05/25/penjelajahan-wisata-hutan-pinus-dlingo";
  ucTagData.targetingMap = {"hb_bidder":["openx"],"hb_bidder_openx":["openx"],"hb_cache_host":["prebid.sin3.adnxs-simple.com"],"hb_cache_host_openx":["prebid.sin3.adnxs-simple.com"],"hb_cache_id":["f38c9fe2-a08d-47cc-b8ed-fb0c305c0be9"],"hb_cache_id_openx":["f38c9fe2-a08d-47cc-b8ed-fb0c305c0be9"],"hb_cache_path":["/pbc/v1/cache"],"hb_cache_path_openx":["/pbc/v1/cache"],"hb_pb":["0.19"],"hb_pb_openx":["0.19"],"hb_size":["300x250"],"hb_size_openx":["300x250"],"page":["amp"],"pos":["MiddleMediumRectangle"],"section":["adv"]};
  ucTagData.hbPb = "0.19";
  try {
    ucTag.renderAd(document, ucTagData);
  } catch (e) {
    console.log(e);
  }
</script>
````
* The above communicates that for the adslot, the stuff from a prebid server bidder has won and it is to be rendered. (ucTag.renderAd)
* However, the ad is still not brought to the page yet. The missing link is the hb_cache_id!!!

## 3. doctor the appnexus cache endpoint to our!
* FROM URL: https://prebid.sin3.adnxs-simple.com/pbc/v1/cache?uuid=*
* FROM URL: https://prebid.sin3.adnxs-simple.com/pbc/v1/cache?uuid=f38c9fe2-a08d-47cc-b8ed-fb0c305c0be9
* TO URL: https://jixieamptest.kompas.com/api/jsongen?filename=cache&tag_id=test
* The above is something like this (not exactly this but just to show the idea, the real thing contains base64 encoded resolved creative:
`{"id":"f38c9fe2-a08d-47cc-b8ed-fb0c305c0be9","impid":"imp-15573016","price":0.19,"adm":"<div id=\\"jxOutstreamContainer\\" style=\\"text-align: center;width:100%;\\"> <script>var p={responsive: 1, maxwidth: 640, container: \\"jxOutstreamContainer\\", creativeid: 800}; function jxdefer(p){if (window.jxuniversal){window.jxuniversal.init(p);}else{setTimeout(function(){jxdefer(p)}, 100);}}jxdefer(p); </script> <script type=\\"text/javascript\\" src=\\"https://scripts.jixie.io/jxfriendly.1.3.min.js\\" defer></script> </div>","adomain":["openx.com"],"crid":"469661686240","w":300,"h":600}`


