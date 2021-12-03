//======================== MINIFIED TO GIVE TO PUB AS GAM SNIPPLET:
// Requirement: serve this script in friendly iframe
// The line of params is per publisher
// The minified code above is common to all


(function(t,e,s){try{let o=top,i=top.document,a=i.getElementById(e.gamcontainer);o._jxosm=o._jxosm||[];let c={unit:t,selectors:["#"+e.gamcontainer]};Object.assign(c,e),a.style.height="auto",a.style.width="100%",o._jxosm.push(c);var n=i.createElement("script");n.src=s,a.appendChild(n)}catch(t){console.log("adops jx osm GAM snipplet integration issue : "+JSON.stringify(t.stack))}})(
    "1000168-KeeuBaxQKQ",    
    {"gamcontainer": "div-gpt-ad-1567743321543-0"},
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
        let gptCtr = doc.getElementById(whParams.gamcontainer);
        win._jxosm = win._jxosm || [];
        let o = {
            unit: jxUnit, 
            selectors: ['#'+whParams.gamcontainer]
        };
        Object.assign(o, whParams);
        gptCtr.style.height = 'auto';
        gptCtr.style.width = '100%';
        win._jxosm.push(o);
        var newScript = doc.createElement("script");
        newScript.src = osmScript; 
        gptCtr.appendChild(newScript);
    }
    catch(e) {
        console.log("adops jx osm GAM snipplet integration issue : " + JSON.stringify(e.stack));
    }
}
)(  "1000168-KeeuBaxQKQ",    
    {"gamcontainer": "div-gpt-ad-1567743321543-0"},
    "https://scripts.jixie.media/jxosm.1.0.min.js"
  );


