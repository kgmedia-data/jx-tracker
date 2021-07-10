const defaultPTimeout_ = -1;
function makeNormalizedObj_({
            dbjson, p
          }) {
            //rtjson prepared.
            let rtjson = {
                timeout: dbjson.timeout ? dbjson.timeout: defaultPTimeout_,
                partner: dbjson.subtype, //for debug printout only
                trackers: dbjson.trackers,
                stackidx: dbjson.stackidx,
                stackdepth: dbjson.stackdepth,
                instID: 1,
                valid: false
            };
            {
                if (makeNormalizedObj__(dbjson, rtjson, p)) {
                    delete dbjson.trackers;
                    rtjson.valid = true;
                    return rtjson;
                }
            }
            return rtjson;      
        }          
      
    function common_(rtjson) {
        rtjson.customfcns = {};
       
    }

    function inject_(params) {
    if (!window.miowjx) { //TODO 
        var jxScript = document.createElement('script');
        jxScript.onload = function () {
            window.miowjx = 1;
        };
        //this thing just make sure you set the context properly. 
        //that's it
        jxScript.src = 'https://scripts.jixie.io/jxoutstreamlite.min.js';
        document.body.appendChild(jxScript); 
        //and this can be made to next time be interlaced in a waterfall even!
    }
    function jxdefer(p) {
        if (window.jxuniversallite) {
            window.jxuniversallite(p);
        } else {
            setTimeout(function() { jxdefer(p) }, 100);
        }
    }
    jxdefer(params);
}    

function makeNormalizedObj_(dbjson, rtjson, p) {
    common_(rtjson);
    rtjson.msgs = {
        //or we fire the has ad immediately lor.
        //we dun have hor.
    };
    var pp = {
        responsive: 1, 
        context: 'amp',
        container: `c`, 
        maxwidth: p.maxwidth,
        fixedheight: p.fixedheight,
        excludedheight: 0,
        jsoncreativeobj64: dbjson.adparameters.jsonbase64
    };
    rtjson.inject = inject_.bound(null, pp);
}
module.exports.makeNormalizedObj = makeNormalizedObj_;
module.exports.name ='jixie';