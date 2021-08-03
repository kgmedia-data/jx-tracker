## Just some info about appnexus outstream for now.
- no request; so OSM not supporting appnexus yet

## sample tag the publisher usually has
* http://video-demo.appnexus.com/samples/outstream.html
    - just for interest only
    - not supported yet

````
var apntag = apntag || {};
apntag.anq = apntag.anq || [];
//load ast.js - async
(function() {
    var d = document,
        scr = d.createElement('script'),
        pro = d.location.protocol,
        tar = d.getElementsByTagName("head")[0];
    scr.type = 'text/javascript';
    scr.async = true;
    scr.src = ((pro === 'https:') ? 'https' : 'http') + '://acdn.adnxs.com/ast/ast.js';
    if(!apntag.l) {
        apntag.l = true;
        tar.insertBefore(scr, tar.firstChild);
    }
})();
apntag.anq.push(function() {
    apntag.setPageOpts({
        member: 3535,
        targetingParams: {
        }
    });
    apntag.defineTag({
        targetId: 'modelJXOSMDiv',
        tagId: 5768085,
        sizes: [1, 1],
        allowedFormats: ['video'],
        targetingParams: {},
        rendererOptions: {
            "playerTechnology": ["html5", "flash"],
            "adText": "Ad",
            "showMute": true,
            "showVolume": true,
            "nonViewableBehavior": "pause",
            "showProgressBar": true,
            "autoInitialSize": true,
            "allowFullscreen": true,
            "skippable": {
                "videoThreshold": 15,
                "videoOffset": 5,
                "skipLocation": "top-left",
                "skipText": "Video can be skipped in %%TIME%% seconds",
                "skipButtonText": "SKIP"
            }
        }
    });
    apntag.loadTags();

});
````

````
<div id="outstream_1">
    <script type="text/javascript">
        apntag.anq.push(function() {
            apntag.showTag('outstream_1');
        });
    </script>
</div>
````        