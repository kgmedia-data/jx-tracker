/*
all the bulk of the common code
should be minified
the config
no minify
easier for them to edit and see
*/

(
    function(config, widgetScript) { 
        try {
               // Assumption is that this code runs inside friendly iframe created by GAM
        // divA > divB > friendlyiframe
        // The divA was planted by publisher onto the page.
        // The gptCtr below refers to divA
        // Basically the real OSM script will be injected onto the publisher page itself
        // All these stuff will be a child of divA 

        // The divB > friendlyiframe (divB, friendlyiframe created by GAM inside divA)
        //  will just be ignored and continue to have that height of 1 then

        //Note: to be safe and not assume the structure is really divA > divB ... 
        //we walk up the parents of the iframe we are in.
        //Until we find one that is a GPT DIV. then we know we found the divA.

        // Here win and doc are the window and document objects of
        // the publisher page respectively (top most)
        let win = top;
        let doc = top.document;
        let cnt = 0;
        let gptCtr = null;
        let nd = window.frameElement;
        let ggSlots = win.googletag.pubads().getSlots();
        while (++cnt < 5) {
            if (nd) {
                nd = nd.parentElement;    
            }
            if (nd && nd.id) {
                for (var i = 0; i < ggSlots.length; i++) {
                    if (ggSlots[i].getSlotElementId() == nd.id) {
                         gptCtr = nd;
                         cnt = 100;
                         break;
                    }
                } //for 
            }
        }// while
        if (!gptCtr) throw new Error("cannot find gpt div");
        let dest;
        if (!config.container) {
        	config.container = gptCtr.id;
          dest = gptCtr; 
        }
        else {
          dest = doc.getElementById(config.container);
        }
        dest.style.height = 'auto';
        dest.style.width = '100%';
        win._jxvwidget = win._jxvwidget || [];
        win._jxvwidget.push(config);

        var newScript = doc.createElement("script");
        newScript.src = widgetScript; 
        gptCtr.appendChild(newScript);
    }
    catch(e) {
        console.log("adops jx video widget GAM snipplet integration issue : " + JSON.stringify(e.stack));
    }
}
)(  
    { 
        "accountid": "test",
        "container": "my_dest_div_id", //<-- optional!! absent then we use the gpt div
        "source": "collection",
        "collection": 1000,
        "widgetid": "my_widget_id",
        "title": "Pakar Nilai Pemindahan Depo Pertamina Berpotensi Ganggu Distribusi BBM",
        "pageurl": "https://abc.com/hello.html",
        "player":{
        "autoplay": "wifi",
        "ads": {
            "unit": "1000xxxx-abc" 
        }
        },
        "floating": {
        "width": 400, // width of floating video
        "position": "bottom-right", // top-left || top-right || top || bottom || bottom-right || bottom-left
        "marginX": 0, // Pixel offset from edge of viewport (left or right depending on the location)
        "marginY": 110, // Pixel offset from edge of viewport (top or bottom depending on the location)
        }
        },
    "https://scripts.jixie.media/jxvwidget.1.0.min.js"
    );


