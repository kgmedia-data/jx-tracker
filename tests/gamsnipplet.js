//======================== MINIFIED TO GIVE TO PUB AS GAM SNIPPLET:
// Requirement: serve this script in friendly iframe
// The line of params is per publisher
// The minified code above is common to all

(function(t,e){try{let i=top,n=top.document,r=window.frameElement.parentElement.parentElement;i._jxoutstreammgrq=i._jxoutstreammgrq||[];let o={unit:t,selectors:["#"+r.id]};Object.assign(o,e),i._jxoutstreammgrq.push(o),r.style.height="auto",r.style.width="100%";var s=n.createElement("script");s.src="https://scripts.jixie.media/jxosm.1.0.min.js",r.appendChild(s)}catch(t){console.log("adops jx osm GAM snipplet integration issue : "+JSON.stringify(t.stack))}})(
    "1000168-KeeuBaxQKQ", {maxheight: 400}
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
 ggSlots.forEach(function(ggOneSlot) {
    legitSlotNames.push(ggOneSlot.getSlotElementId());
});
 
(
    function(jxunit, whParams) { 
    try {
        // Assumption is that this code runs inside friendly iframe created by GAM
        // divA > divB > friendlyiframe
        // The divA was planted by publisher onto the page.
        // The gptCtr below refers to divA
        // Basically the real OSM script will be injected onto the publisher page itself
        // All these stuff will be a child of divA 

        // The divB > friendlyiframe (divB, friendlyiframe created by GAM inside divA)
        //  will just be ignored and continue to have that height of 1 then

        // Here win and doc are the window and document objects of
        // the publisher page respectively (top most)
        let win = top;
        let doc = top.document;
        let gptCtr = window.frameElement.parentElement.parentElement;
        win._jxoutstreammgrq = win._jxoutstreammgrq || [];
        let o = {
            unit: jxunit, 
            selectors: ['#'+gptCtr.id]
        };
        Object.assign(o, whParams);
        win._jxoutstreammgrq.push(o);
        gptCtr.style.height = 'auto';
        gptCtr.style.width = '100%';
        var newScript = doc.createElement("script");
        newScript.src = "https://scripts.jixie.media/jxosm.1.0.min.js";
        gptCtr.appendChild(newScript);
    }
    catch(e) {
        console.log("adops jx osm GAM snipplet integration issue : " + JSON.stringify(e.stack));
    }
}
)("1000168-KeeuBaxQKQ", {maxheight: 400});


