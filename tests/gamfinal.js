//======================== MINIFIED TO GIVE TO PUB AS GAM SNIPPLET:
// Requirement: serve this script in friendly iframe
// The line of params is per publisher
// The minified code above is common to all

(function(t,e,o){try{let s=top,l=top.document,r=0,a=null,d=window.frameElement,c=s.googletag.pubads().getSlots();for(;++r<5;)if(d&&(d=d.parentElement),d&&d.id)for(var n=0;n<c.length;n++)if(c[n].getSlotElementId()==d.id){a=d,r=100;break}if(!a)throw new Error("cannot find gpt div");s._jxosm=s._jxosm||[];let g={unit:t,selectors:["#"+a.id]};Object.assign(g,e),s._jxosm.push(g),a.style.height="auto",a.style.width="100%";var i=l.createElement("script");i.src=o,a.appendChild(i)}catch(t){console.log("adops jx osm GAM snipplet integration issue : "+JSON.stringify(t.stack))}})(
    "1000168-KeeuBaxQKQ",  
    {},  
    "https://scripts.jixie.media/jxosm.1.0.min.js"
);

/* Note: 
the last param:
you can specify the following properties in that object:
 maxheight,
 maxwidth,
 fixedheight
 excludedheight
 */



 //======================== INTERNAL USE ONLY: ORIGINAL WITH COMMENTS:
 // MUST BE CAREFUL WHEN MINIFYING , AS I TRY TO SEPARATE THE PARAMS CLEARLY
 
 // Note: the "OSM" snipplet put in GAM as creative is just a **BOOTSTRAPPER** then
 // It will use back the gpt div and then inject the REAL OSM script onto the main page
 // and then everything per normal
 // let ggSlots = window.googletag.pubads().getSlots();
 
(
    function(jxUnit, whParams, osmScript) { 
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
        //_jxoutstreammgrq
        if (!gptCtr) throw new Error("cannot find gpt div");
        win._jxosm = win._jxosm || [];
        let o = {
            unit: jxUnit, 
            selectors: ['#'+gptCtr.id]
        };
        Object.assign(o, whParams);
        win._jxosm.push(o);
        gptCtr.style.height = 'auto';
        gptCtr.style.width = '100%';
        var newScript = doc.createElement("script");
        newScript.src = osmScript; 
        gptCtr.appendChild(newScript);
    }
    catch(e) {
        console.log("adops jx osm GAM snipplet integration issue : " + JSON.stringify(e.stack));
    }
}
)(  "1000168-KeeuBaxQKQ", 
    {},
    "https://scripts.jixie.media/jxosm.1.0.min.js"
    );


