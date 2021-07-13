  /**
     * 
     * VAST GENERATION IS NOW HERE. FOR THOSE FROM UNIVERSAL.
     * IT IS PRETTY SHORT LAH.
     * 
     */
   const newLineMaybe_ = "\n"; //when developing, easier to see check the output

   /**
    * Utility function
    * @param {*} seconds 
    */
   function formatDuration_(seconds) {
       var d = Number(seconds);
       var h = Math.floor(d / 3600);
       var m = Math.floor(d % 3600 / 60);
       var s = Math.floor(d % 3600 % 60);
       var formatted = ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
       return formatted;
   }

   const vastOpener_ = '<?xml version="1.0" encoding="UTF-8"?><VAST xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="vast.xsd" version="3.0">\n';
   const vastCloser_ = '</VAST>';
   const actionNames_ = ["start", "firstQuartile", "midpoint", "thirdQuartile", "complete", "mute", "unmute", "rewind", "pause", "resume", "fullscreen", "creativeView"];

   /**
    * output blobs for tracking, for impression, for click, for error to insert into the main vast body
    * @param {*} creative 
    * @param {*} stackidx 
    */
   function genPingBlob(creative, stackidx, stackdepth) {
       let tbase = creative.trackers.baseurl;
       let tparams = creative.trackers.parameters;

       let miscEvts = {};
       ['impression', 'click', 'error'].forEach(function(action) {
           let ecMaybe = (action === 'error' ? '&errorcode=[ERRORCODE]' : '');
           miscEvts[action] = `<![CDATA[${tbase}?action=${action}${ecMaybe}&mediaurl=[ASSETURI]&${tparams}&stackidx=${stackidx}&stackdepth=${stackdepth}]]>`;
       });
       let ret = {};
       //TrackingEvent blob
       ret.tracking = actionNames_.map((action) => (`<Tracking event="${action}"><![CDATA[${tbase}?action=${action}&mediaurl=[ASSETURI]&${tparams}&stackidx=${stackidx}&stackdepth=${stackdepth}]]></Tracking>`))
           .join("\n");

       //Impression blob
       ret.impression = `<Impression>${miscEvts.impression}</Impression>`;
       if (creative.impressiontrackers && creative.impressiontrackers.length > 0) {
           ret.impression += creative.impressiontrackers.map((tracker) => `<Impression><![CDATA[${tracker}]]></Impression>`)
               .join("\n");
       }
       //click blob
       ret.click = "";
       if (creative.clickurl) {
           ret.click += `<ClickThrough><![CDATA[${creative.clickurl}]]></ClickThrough>`;
       }
       ret.click += `<ClickTracking>${miscEvts.click}</ClickTracking>`;
       ret.error = `${miscEvts.error}`;
       return ret;
   }

   /**
    * For VPAID or SIMID type
    * @param {*} creative 
    * @param {*} stackidx 
    */
   function genVast(creative, stackidx, stackdepth) {
       //console.log(creative);
       //console.log(`${creative.id}___${creative.subtype}`);
       let pings = genPingBlob(creative, stackidx, stackdepth);

       let adP = {};
       let mediaStr = "";
       switch (creative.subtype) {
           case 'vsimid':
               adP = Object.assign({}, creative.adparameters);
               delete adP.videos;
               mediaStr += `<InteractiveCreativeFile type="text/html" apiFramework="SIMID" variableDuration="true">${creative.url}</InteractiveCreativeFile>`;
               break;
           case 'vvpaid':
           case 'vhybrid':
               adP = creative.adparameters;
               mediaStr = `<MediaFile apiFramework="VPAID" type="application/javascript"><![CDATA[${creative.url}]]></MediaFile>`;
               break;
           case 'vinstream':
               adP = {};
               break;
       }
       if (creative.subtype == 'vsimid' || creative.subtype == 'vinstream') {
           mediaStr += creative.adparameters.videos.map(function(video) {
               let br = (video.bitrate ? `bitrate="${video.bitrate}"` : '');
               let w = (video.width ? `width="${video.width}"` : '');
               let h = (video.height ? `height="${video.height}"` : '');
               return `<MediaFile id="JIXIE" ${br} ${w} ${h} delivery="progressive" type="video/mp4" maintainAspectRatio="true"><![CDATA[${video.url}]]></MediaFile>`
           }).join("\n");
       }

       let json = {
           "Ad": {
               "@attr": `id="JXAD${creative.id}"`,
               "InLine": {
                   "AdSystem": "JXADSERVER",
                   "AdTitle": `${encodeURIComponent(creative.name)}`,
                   "Description": `Hybrid in-stream`,
                   "Error": pings.error,
                   "@none": pings.impression,
                   "Creatives": {
                       "Creative": {
                           "@attr": `id="JXAD${creative.id}" sequence="1"`,
                           "Linear": {
                               "@attr": '', //placeholder
                               "Duration": `${formatDuration_(creative.duration)}`,
                               "TrackingEvents": pings.tracking,
                               "VideoClicks": pings.click,
                               "AdParameters": `<![CDATA[${JSON.stringify(adP)}]]>`,
                               "MediaFiles": mediaStr
                           } //Lin
                       } //creative
                   } //creatives
               } //linline
           } //ad
       };
       if (creative.subtype == 'vinstream') {
           //actually we dun use this subtype at all...
           delete json.Ad.InLine.Creatives.Creative.Linear.AdParameters;
           json.Ad.InLine.Creatives.Creative.Linear['@attr'] = ` skipoffset="${formatDuration_(creative.skipoffset)}"`;
       } else {
           delete json.Ad.InLine.Creatives.Creative.Linear['@attr'];
       }
       return genVastFromJson(json);
   }

   /**
    * For WRAPPER type
    * @param {*} creative 
    * @param {*} stackidx 
    */
   function genWrapperVast(creative, stackidx, stackdepth) {
       let pings = genPingBlob(creative, stackidx, stackdepth);
       let json = {
           "Ad": {
               "@attr": `id="JXAD${creative.id}"`,
               "Wrapper": {
                   "AdSystem": "JXADSERVER",
                   "VASTAdTagURI": `<![CDATA[${creative.url}]]>`,
                   "Error": pings.error,
                   "@none": pings.impression,
                   "Creatives": {
                       "Creative": {
                           "@attr": `id="JXAD${creative.id}" sequence="1"`,
                           "Linear": {
                               "TrackingEvents": pings.tracking,
                               "VideoClicks": pings.click
                           } //Linear
                       } //creative
                   }, //creatives
                   "Extensions": `<Extension type="waterfall" fallback_index="${stackidx}"/>`
               } //Wrapper
           } //ad
       };
       return genVastFromJson(json);
   }

   function genVastFromJson(json) {
       return traverse("", json);
   }

   /**
    * Simple recursive traversal to print out the XML from the JSON encoding of the XML structure:
    * mom is for mother ... coz we only print out the mother when we have looked at the children
    * coz the attribute like <Ad id="xxxxxx">
    * in the  JSON the id="xxxx" is a while. Meaning until we looked into the children of "Ad" node
    * we dunno how to print out the  <Ad...> yet
    * @param {*} mom 
    * @param {*} jsonObj 
    */
   function traverse(mom, jsonObj) {
       let buffer = '';
       if (jsonObj !== null && typeof jsonObj == "object") {
           let replacement = "";
           Object.entries(jsonObj).forEach(([key, value]) => {
               if (key === '@attr') {
                   replacement = " " + value;
               }
           });
           let newmom = mom.replace('%%attr%%', replacement);
           buffer += newmom;
           Object.entries(jsonObj).forEach(([key, value]) => {
               if (key != '@attr') {
                   if (key == '@none') {
                       buffer += value;
                   } else {
                       // key is either an array index or object key
                       buffer += traverse("<" + key + "%%attr%%>" + newLineMaybe_, value);
                       buffer += "</" + key + ">" + newLineMaybe_;
                   }
               }
           });
       } else {
           // jsonObj is a number or string
           let newmom = mom.replace('%%attr%%', '');
           buffer += newmom + jsonObj;
       }
       return buffer;
   }

   function buildVastXml_(arrayOfCreatives) {
       let finalXML = vastOpener_;
       let idx = 0;
       let stackdepth = arrayOfCreatives.length;
       arrayOfCreatives.forEach(function(creative) {
           let normCreative = Object.assign({}, creative); // Normalization
           //as to where to find certain properties: see comment right below:

           if (normCreative.assets) {
               /*
                   if the vast gen buildVastXml_ is called from adserver, 
                   then we are in this case.
                   Otherwise we are from the universal unit and in the json formation 
                   by adserver it would have done this copying already.          
               */
               normCreative.duration = normCreative.assets.duration;
               normCreative.adparameters = normCreative.assets.adparameters;
               if (normCreative.assets.adparameters)
                   normCreative.skipoffset = normCreative.assets.adparameters.skipoffset;
               normCreative.clickurl = normCreative.assets.clickurl;
               normCreative.url = normCreative.assets.url;
               normCreative.impressiontrackers = normCreative.assets.impressionTrackers;
               delete normCreative.assets;
           }
           if (['vinstream', 'vvpaid', 'vhybrid', 'vsimid'].indexOf(creative.subtype) > -1) {
               finalXML += genVast((normCreative), idx, stackdepth);
           } else {
               finalXML += genWrapperVast((normCreative), idx, stackdepth);
           }
           idx++;
       });
       return finalXML + vastCloser_;
   }
   function getEmptyVast_() {
       return vastOpener_ + vastCloser_;
   }

   module.exports.buildVastXml = buildVastXml_;
   
