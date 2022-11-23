/**
 * This piece of code is to be called by the various front end scripts
 * e.g. video, osm.
 * so they have to just COPY this....
 * 
 * THIS IS NOT BUILT INTO THE tracker script
 */
 

 var jxIdName_                    = '_jxx';
 var jxSidName_                   = '_jxxs';
 
 const twentyMinSec_              = 20*60; //validity (based on last interaction)
 const twelveHrSec_               = 12*60*60; // validity (based on creation)
 
 const sidTTLMins_                = 20; //<-- Confirm? was 30
  
  
 // Helper function to look up cookie store . look for the following cookies: 
 // jxIdName_ jxSidName_ (the constants defined see above)
 // and perhaps a namedCookie
 //
 // Output: object with potentially these fields 
 //  id, sid and namedCookie (whatever the string is.)
 function getIdsObjC(namedCookie = null) {
     let idsObjsC = {};
     let coo = {};
     if (document.cookie && document.cookie != '') {
       let spl = document.cookie.split(';');
       for (var i = 0; i < spl.length; i++) {
         var nv = spl[i].split('=');
         nv[0] = nv[0].replace(/^ /, '');
         coo[decodeURIComponent(nv[0])] = decodeURIComponent(nv[1]) + (nv.length > 2 ? '=' + nv.slice(2).map((k) => decodeURIComponent(k)).join("="):'');
       }
     }
     if (coo[jxIdName_]) {
         idsObjsC.id = coo[jxIdName_];
     }
     if (coo[jxSidName_]) {
         idsObjsC.sid = coo[jxSidName_];
     }
     if (namedCookie) {
         idsObjsC[namedCookie] = coo[namedCookie];
     }
     return idsObjsC;
 }
 
 //Helper function to write to cookie store
 //parameter: array of objects. each element of array is:
 //  n: cookie name
 //  v: value
 //  d: the expiry date
 function writeC(ids) {
     var dd = window.location.hostname.match(/[^.]*\.[^.]{2,3}(?:\.[^.]{2,3})?$/mg);
     //console.log("JIXIE - The location for the cookie is " + dd);
     ids.forEach(k=>{
       var ex = 'expires=' + k.d.toUTCString();
       var c1 = k.n + '=' + k.v + ';' + ex + ';secure;';
       document.cookie = c1 + 'path=/';
       if (dd) {
         document.cookie = c1 + 'domain=.' + dd + ';secure;SameSite=None;path=/';
       }
     });
 } 
 
 // Helper function:
 // tries to parse a session ID string into an object
 // with ts, v (value) and li (last interaction) fields
 // if the session ID string is without the last interaction section, will set li same as ts.
 //
 // If cannot parse into such at all:
 // ts-<clientID>~li or ts-<clientID>
 // then we return null
 function sidStr2Obj(sidstr, nowsec) {
     const min = 2;
     if (!sidstr) {
         return null;
     }
     let li = 0;
 
     let idx = sidstr.lastIndexOf('~');
     if (idx == sidstr.length - 11) {
         //this is it then.
         li = sidstr.substr(idx+1);    
         sidstr = sidstr.substring(0, idx);
         if (!isNaN(li)) {
             li = parseInt(li);
         }
 
     }
 
     if (sidstr.length > 9){ // below 10 chars it doesn't contain any unix timestamp 
         let parts = sidstr.split('-');
         if (parts.length > 1){ // We need at least 2 parts otherwise it cannot be valid
             // We have enough parts to consider it is a good one (light check I agree)
             let ts = parts.shift(); // we remove the first element of the array which is the timestamp,
             if (!isNaN(ts)) {
                 ts = parseInt(ts);
                 if (parts.length >= min){
                     if (li < ts) { 
                         li = ts; //li not possible to be earlier than the ts mah!
                     }
                     let fresh = (nowsec - ts < twelveHrSec_ && nowsec - ls < twentyMinSec_);
                     //we do not do big time checking on the v...
                     return {ts:ts, v: parts.join('-'), li: li, fresh: fresh}          
                 }
             }
         }  
     }
     return null;       
 }
 
 // this is the chief item we expose to be called:
 function get_(namedCookie = null) {

     let ret = {};
     try {
         let client_id   = null;
         let sid         = null;
         let idsObjsLS   = {};
         //If we can avoid it, then we dun look up the cookie store at this point in time.
         //But if namedCookie is set in the param, then we need to look for sure so do it now:
         let idsObjsC    = namedCookie ? getIdsObjs(namedCookie): null; 
         let ls = window.getLocalStorage;
         if (ls) {
             tmp = ls.getItem(jxIdName_);
             if (tmp) {
                 idsObjsLS.id = tmp;
             }
             tmp = ls.getItem(jxSidName_);
             if (tmp) {
                 idsObjsLS.sid = tmp;
             }
             tmp = ls.getItem('_jxcht');
             if (tmp) {
                 ret.cohort = tmp;
             }
         }
 
         //TRY TO GET A client ID: (consider LS first, then cookie)
         client_id = idsObjsLS.id;
         if (!client_id) {
             if (!idsObjsC) {
                 idsObjsC = getIdsObjC();
             }
             client_id = idsObjsC.id;
         }
         ret.client_id = client_id;
 
         //TRY TO GET A session ID : Dig from LS and Cookie and whichever one is still 
         // "fresh" (within the 12min, 12hour limit) we extend it (and write back to LS/CK)
         // Else we regenerate another session ID (*if* there is some client id we 
         // can salvage - else sid will not be geenrated.
         if (!idsObjsC) {
             idsObjsC = getIdsObjC(); //actually the cookie one is better
             //coz in theory, if you can still find the session id in the cookie
             //then it should be fresh already. no need check again
         }
         let sid1 = idsObjsC.sid;
         if (!sid1) {
             sid2 = idsObjsLS.sid;
         }
 
         let usableId = null;//something we can use to generate the sesison id , if we need to
         let nowsec = parseInt(Date.now() / 1000);
 
         if (!sid && sid1) { //First, sid1 string which was read from cookie
             let sidO = sidStr2Obj(sid1, nowsec);
             if (sidO) {
                 if (sidO.fresh) 
                     sid = sidO.ts +  '-' + sidO.v + '~' + Math.floor((Date.now()/1000));
                 else 
                     usableId = sidO.v;                    
             }
         }
         if (!sid && sid2) {//still no sid, so second, sid2 string which was from LS
             let sidO = sidStr2Obj(sid2, nowsec);
             if (sidO) {
                 if (sidO.fresh) //we just advance the LI
                     sid = sidO.ts +  '-' + sidO.v + '~' + Math.floor((Date.now()/1000));
                 else 
                     usableId = sidO.v;                    
             }
         }
         if (!sid) {
             // still dun have session ID then we try to generate
             // the expired session IDs or the client_id
             if (!usableId) {
                 usableId = client_id;
             }
             if (usableId) { //generate one from scratch using the usableId
                 sid = Math.floor((Date.now()/1000000)) * 1000 + '-' + usableId + '~' + Math.floor((Date.now()/1000));
             }
         }
 
         if (namedCookie) {
             if (idsObjsC[namedCookie]) {
                 ret[namedCookie] = idsObjsC[namedCookie];
             }
         }
         ret.sid = sid;
 
         if (sid) { //it was not clear from Vincent's stuff, but I guess we will have to write this thing 
             // back then.
             console.log(`___ JX OUTPUT !! ${sid} MIOW COMMENTED OUT`);
             //MIOW ls.setItem(jxSidName_, sid);
             //MIOW writeC([{n:jxSidName_, v:sid, d: new Date(new Date().setMinutes(new Date().getMinutes() + sidTTLMins_))}]);
         }
         //cohort is already written into ret when we read the LS.
     }
     catch(e) {}
     console.log(`___ JX OUTPUT !! ${JSON.stringify(ret)}`);
     return ret;
 }

 module.exports.get = get_;

 /* 
  ************** module: basic/ids **************************************************
 
 * module.exports:
   - get (function)
     - returns an object and this object could contain 'client_id' and/or 'sid' properties 
     - ... if available dependencies:
 
 * requires/dependencies:
   - none
 */
     