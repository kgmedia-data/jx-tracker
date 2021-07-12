 /**
 *  This will export a class CJixieIdCommon (package jixie-ids-common)
 *
 * This will be used by at least 2 scripts
 * jixietracker.min.js (repo =jixie-event-script) and
 * the universal unit (jxOutstream*js) (repo =universal-ad-unit)
 *
 * This method of inclusion is by the consumer modules
 * installing our this package from github repositories.
 *
 * npm install bitbucket:jixie/jixie-ids-common
 *      (so in their package.json there is this entry
 *      "jixie-ids-common": "bitbucket:jixie/jixie-ids-common")
 * The caller script will use require('jixie-ids-common')
 * This is of course not supported by the browser as this is a nodejs thing.
 * We use browserify to provide make this work.
 * All the gymnastics are in the respective gulpfile.js in the consumer modules
 */
/**
 * on a new page, there could potentially be a race condition between the jixietracker and the outstream
 * though very unlikely.
 * Very unlikely but we will make provision.
 *
 */
 

    const defaultNoValueClientId_       = '';
    const defaultNoValueSessionId_      = '';
    const defaultValueDoTrack_          = true;
    const postApiUrl_                   = 'https://tra.jixie.io/sync/{env}';
    const uId_                          = 'https://id.jixie.io/api/';
    const debug_                        = 'no';
    const creativeidTTL_                = 30*24*60*60 + 2; //num of seconds in 30 days. (creative id: keep for 30 days)
    const creativeidTTLHours_           = 30*24;
    const sidTTLMins_                   = 30;
    const pTTL_                         = 86400; // TTL for profile and master ID --> 1 day
    const external_ids_conf_            = {
                                            tdid:{
                                                  u:"https://match.adsrvr.org/track/rid?ttd_pid=xuz42kb&fmt=json",
                                                  n:"_jxtdid",
                                                  f:"TDID",
                                                  t:"ttd"
                                            }
                                          }; 
    
    
    //Sometimes just want to visible assurance esp when testing stuff on mobile.
    /*
    function slackIt_(trackerUrl) {
        try {
            let subj = 'JixieTracker sent: ' + (new Date()).toISOString();
            let data = JSON.stringify({text: subj + " url="+trackerUrl});
            let xhr = new XMLHttpRequest();
            xhr.open("POST", "https://hooks.slack.com/services/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?text=xxxxxyyyyyzzzzz");
            //Note: CANNOT HAVE THIS: xhr.setRequestHeader("Content-Type", "application/json"); //else cannot send
            //idea borrowed from https://stackoverflow.com/questions/41042786/cors-issue-using-axios-with-slack-api
            xhr.send(data);
        }
        catch (error) {
        }
    }
    */
    
    var consoleLogIt_ = (function() {
      if (debug_ !== 'yes') return function() {};
      return function() {
          let args = Array.prototype.slice.call(arguments); // make real array from arguments
          args.unshift((new Date()).toISOString() + ' jixie-ids-common');
          Function.prototype.apply.call(console.log, console, args);
      };
    })();
    
    
    function getQueryStringValue_ (src, key) {
      if (!src) return null;
      return decodeURIComponent(src.replace(
        new RegExp('^(?:.*[&\\?]' + encodeURIComponent(key).replace(/[\.\+\*]/g, '\\$&') + '(?:\\=([^&]*))?)?.*$', 'i'), '$1'));
    }
    
    /**
     * Function to execute an AJAX call based on an object describing the query:
     * {
     *    "url": <url>,
     *    "type": <GET or POST>,
     *    "withCredentials": <true/false>, // default true if not set
     *    "contentType": <the content type requested>,
     *    "success": <callback function executed when success>,
     *    "error": <callback function executed when error>
     * }
     * 
     * @param {*} obj url, type (GET or POST), withCredentials (true or false, default is true), success and error callbacks are optional,
     * content-Type optional
     */
    function doAjax_ (obj) {
      var xhr = (window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP'));
    
      xhr.open(obj.type, obj.url, true);
      xhr.withCredentials = (obj.withCredentials != undefined ? obj.withCredentials: true);
      if (obj.contentType) {
        xhr.setRequestHeader('Content-Type', obj.contentType);
      }
      xhr.crossDomain = true;//got such a property?!
      
    
      // Call a function when the state changes.
      if (obj.success || obj.error) {
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            // Get the raw header string
            // var headers = xhr.getAllResponseHeaders();
            // console.log("response header" + xhr.getResponseHeader("Access-Control-Allow-Origin"));
            if (xhr.status === 200 || xhr.status === 204) {
              if (obj.success) obj.success(xhr.response);
              //consoleLogIt_("Call to " + obj.url + " made with success");
            } else if (obj.error){
              obj.error(xhr.status, xhr.response);
              consoleLogIt_("Call to " + obj.url + " made with error: " + xhr.status + ' ' + xhr.response);
            }
          }
        }
      }
      if (obj.error) {
        xhr.onerror = function (msg) {
          // Cross-domain request denied
          if (xhr.status === 0) {
            obj.error(msg);
          }
        }
      }
      xhr.send(obj.type === 'POST' ? obj.data : null);
    }
    
    /**
     * This function write the different IDs in the cookies and the local storage.
     * It stores the client_id, the session_id, the augmented creative ID (with timestamp of creation)
     * in both cookie and localstorage.
     * However, the list of IDs is only stored in the local storage
     * 
     * @param {object} win 
     * @param {object} doc 
     * @param {string} id : the client_id
     * @param {string} sid : the session_id
     * @param {string} cid : the creativeid if any
     * @param {array} ids : the list of IDs of the user (when present)
     * @param {boolean} track : indicates if we got the autorization from the user to track him
     */
    function write_(win, doc, id, sid, cid, last_master_id_update, last_profile_update, interests, intends, track, eid) {
      /*console.log("JIXIE - Starting write_ function");
      console.log("JIXIE - write_ parameter id: " + id);
      console.log("JIXIE - write_ parameter sid: " + sid);
      console.log("JIXIE - write_ parameter cid: " + cid);
      console.log("JIXIE - write_ parameter last_master_id_update: " + last_master_id_update);
      console.log("JIXIE - write_ parameter last_profile_update: " + last_profile_update);
      console.log("JIXIE - write_ parameter interests: " + JSON.stringify(interests));
      console.log("JIXIE - write_ parameter intends: " + JSON.stringify(intends));
      console.log("JIXIE - write_ parameter track: " + track);
      console.log("JIXIE - write_ parameter eid: " + JSON.stringify(eid));*/
      if (!track) {
        return;
      }
    
      var idsC_ = [];
      //console.log("JIXIE - Preparing Jixie cookies");
      if (id) idsC_.push({n:'_jx', v:id, d: new Date(new Date().setFullYear(new Date().getFullYear() + 1))});
      if (sid) idsC_.push({n:'_jxs', v:sid, d: new Date(new Date().setMinutes(new Date().getMinutes() + sidTTLMins_))});
      if (cid){
        let exp = getEntryExpireTime(cid, creativeidTTL_);
        exp = ( exp ? new Date(1000*exp) : new Date(new Date().setHours(new Date().getHours() + creativeidTTLHours_)));
        idsC_.push({n:'_jxcid', v:cid, d: exp});
      }
      //console.log("JIXIE - Adding the external IDs cookie");
      if (eid){
        for (var key in eid) {
          if (eid.hasOwnProperty(key)) {
            idsC_.push({n:external_ids_conf_[key].n, v:eid[key], d: new Date(new Date().setMonth(new Date().getMonth() + 2))});
          }
        }
      }
      //console.log("JIXIE - Writing cookies with " + JSON.stringify(idsC_));
      writeC_(win, doc, idsC_);
      //console.log("JIXIE - Writing local storage");
      let res = writeLS_(win, doc, id, sid, cid, last_master_id_update, last_profile_update, interests, intends);
      return res;
    }
    
    //some entries already has the expiry time built-in xxxxxx-theData
    function getEntryExpireTime(itemStr, plusSec = 0) {
      let parts = itemStr.split('-');
      if (parts && parts.length >= 2) { 
        if (!isNaN(parts[0])) {
          let timesec = parseInt(parts[0]) + plusSec;
          //sanity check: it is a future time, or?
          const now = parseInt((Date.now() / 1000));
          return (timesec > now ? timesec: null);
        }
      }
      return null;
    }      
    
    /**
     * Checks if the timestamp is still valid
     * 
     * @param {integer} ts 
     * @param {integer} plusSec 
     */
    function isTSv(ts, plusSec = 0){
        let timesec = parseInt(ts) + plusSec;
        const now = parseInt((Date.now() / 1000));
        return (timesec > now ? timesec: false);
    }
    
    /**
     * Function to read the local storage. It reads the values:
     * _jx (client_id), _jxs (session_id), _jxcid (creative ID)
     * 
     * Returns an object like:
     * {
     *    "id": <client_id>,
     *    "sid": <session_id>,
     *    "cid": <augmented creative ID>,
     *    "ids": <array of IDs>
     * }
     * 
     * 
     * @param {object} win 
     * @param {object} doc 
     */
    function readLS_(obj) {
      var idsObjLS = {};
      try {
        ls = obj.win.localStorage;
        idsObjLS.id =  ls.getItem('_jx');
        //with the sid we cannot use this same trick (of using the timestamp segment to expire it...) 
        //coz the LOAD api is capable of taking an SID
        //which has been born 25 mins ago (sitting in Jixie domain cookie store) and then return it as SID 
        //(and then it will be set to expire in 30mins, meaning 30mn of no use)
        //and we will do that too over here, when we deal with saving it as first party cookie
        
        //i.e. the LOAD api returns SIDs - which - based on the timestamp alone - should not have been around
        //but yet the truth is they are around.
        //so here we also cannot be over clever and use that timestamp to expire SID!! 
        idsObjLS.sid = ls.getItem('_jxs');
        //if expired (need a calculation), then remove the item and return null:
        idsObjLS.cid = getLSWithTTL(ls, '_jxcid', creativeidTTL_);
    
        // Retrieving the last master ID update
        idsObjLS.mts = ls.getItem('_jxmu');
        var mts = parseInt(idsObjLS.mts);
        if (isNaN(mts)) idsObjLS.mts = 0;
        else{
          idsObjLS.mts = mts;
          if (parseInt((Date.now() / 1000)) - mts > pTTL_){ // last update is too long
            idsObjLS.mts = 0;
          }
        }
        //consoleLogIt_("JIXIE - We read the last master ID refresh: " + idsObjLS.mts);
    
        // Retrieving Interests and Intends information
        idsObjLS.It = ls.getItem('_jxIt');
        var lt = parseInt(idsObjLS.It);
        if (isNaN(lt)) idsObjLS.It = 0;
        else idsObjLS.It = lt;
        //consoleLogIt_("JIXIE - We read the last profile refresh: " + idsObjLS.mts);
    
        try{
          idsObjLS.itr = [];
          idsObjLS.itr = JSON.parse(ls.getItem('_jxitr'));
          idsObjLS.itd = [];
          idsObjLS.itd = JSON.parse(ls.getItem('_jxitd'));  
        }catch(e){idsObjLS.It = 0;} // if error of parsing we consider we need to refresh the data
    
        // Retrieving the list of IDs and parsing it. Don't do anything if cannot parse.
        try{
          idsObjLS.ids = JSON.parse(ls.getItem('_jxids'));
        }catch(e){}
      } 
      catch (e) {}
      return idsObjLS;
    }
    
    /**
     * Function to write in the local storage. It will write in properties _jx<type>.
     * For example _jx for client_id, _jxs for session_id, ...
     * 
     * Don't do anything in case of error (if cannot access the local storage).
     * 
     * 
     * @param {*} win 
     * @param {*} doc 
     * @param {*} id 
     * @param {*} sid 
     * @param {*} cid 
     * @param {*} ids 
     */
    function writeLS_(win, doc, id, sid, cid, last_master_id_update, last_profile_update, interests, intends) {
      var profileUpdate = false;
      try{
        var ls = win.localStorage;
        if (id) ls.setItem("_jx", id);
        if (sid) ls.setItem("_jxs", sid);
        if (cid) ls.setItem("_jxcid", cid);
        if (last_master_id_update && last_master_id_update > 0) ls.setItem("_jxmu", last_master_id_update);
        if (last_profile_update && last_profile_update > 0) ls.setItem("_jxIt", last_profile_update);
        if (interests && interests.length > 0){
          try{
            var itr = JSON.parse(get.getItem("_jxitr"));
            if (!itr) itr = [];
            itr = interests.concat(itr.filter((item) => interests.indexOf(item) < 0));
            ls.setItem("_jxitr", JSON.stringify(itr));  
          }catch(e){
            ls.setItem("_jxitr", JSON.stringify(interests));  
          }
          profileUpdate = true;
        }
        if (intends && intends.length > 0){
          try{
            var itd = JSON.parse(get.getItem("_jxitd"));
            if (!itd) itd = [];
            itd = intends.concat(itd.filter((item) => intends.indexOf(item) < 0));
            ls.setItem("_jxitd", JSON.stringify(itd));  
          }catch(e){
            // We just replace the intends
            ls.setItem("_jxitd", JSON.stringify(intends));  
          }
          profileUpdate = true;
        }
        return {up: profileUpdate};
      }
      catch(e){
          console.log("Local storage cannot be accessed: " + e.message);
          return {up: profileUpdate};
      }
    }
    
    /**
     * Function to write the IDs in the cookie. 
     * We create cookies:
     * - valid for 1 year for client id
     * - valid sidTTLMins_ minutes for session_ID and creative ID
     * 
     * 
     * Note: we don't store the list of IDs which is stored in the local storage only.
     * 
     * @param {object} win 
     * @param {object} doc 
     * @param {array} ids: an array of ids to store as cookie like [{n: <name of cookie>, v: <value of cookie>, d: <expiration date>}]
     * @param {string} id : the client_id
     * @param {string} sid : the session id
     * @param {string} cid : the creative id
     * @param {string} pid : the creative id
     */
    function writeC_ (win, doc, ids) {
      var dd = win.location.hostname.match(/[^.]*\.[^.]{2,3}(?:\.[^.]{2,3})?$/mg);
      //console.log("JIXIE - The location for the cookie is " + dd);
      ids.forEach(k=>{
        var ex = 'expires=' + k.d.toUTCString();
        var c1 = k.n + '=' + k.v + ';' + ex + ';secure;';
        doc.cookie = c1 + 'path=/';
        if (dd) {
          doc.cookie = c1 + 'domain=.' + dd + ';secure;SameSite=None;path=/';
        }
      });
      
    } 
     
    /**
     * (NOTE: This code is separated out into a function, so it can be reused: 
     * Called in both readC_ and getIdsIfAvail)
     * Get Parsed Cookie
     * @param {*} obj : the main object. just for accessing the doc property 
     * @returns a parsed cookie object
     */
    function getParsedCk_(obj) {
        var coo = {};
        if (obj.doc.cookie && obj.doc.cookie != '') {
          var spl = obj.doc.cookie.split(';');
          for (var i = 0; i < spl.length; i++) {
            var nv = spl[i].split('=');
            nv[0] = nv[0].replace(/^ /, '');
            coo[decodeURIComponent(nv[0])] = decodeURIComponent(nv[1]);
          }
        }
        return coo;
    }
     
    /**
     * (NOTE: This code is separated out into a function, so it can be reused: 
     * Called in both readC_ and getIdsIfAvail)
     * 
     * Extract Core Cookies (extract our JX core cookie entries )
     * 
     * @param {*} coo : a parsed cookie object. (It could be an empty object, but will not be null)
     * @returns an object which has id, sid, cid (read from the cookie). 
     * If the cookie entry for client id (i.e. _jx) is not there, then id property is null
     * If the cookie entry for session id (i.e. _jxs) is not there, then sid property is null
     * If the cookie entry for creative (i.e. _jxcid) is not there, then cid property is null
     */
    function extractCoreCk_(coo) {
        let out = {};
        out.id = (coo['_jx'] !== undefined ? coo['_jx']: null);
        out.sid = (coo['_jxs'] !== undefined ? coo['_jxs']: null);
        out.cid = (coo['_jxcid'] !== undefined ? coo['_jxcid']: null);
        return out;
    }
     
    /**
     * Function reading only our cookies (_jx, _jxs,  _jxcid, <partner_cookie name if any>).
     * 
     * This function will also check if the external IDs we work with are present. If not, then it will generate them.
     * 
     * Returns an object like:
     * {
     *    "id": <client_id>,
     *    "sid": <session_id>,
     *    "cid": <augmented creative ID>,
     *    "pid": <partner_cookie if a cookie name has been provided>
     * }
     * 
     * @param {object} win 
     * @param {object} doc 
     */
     function readC_ (obj, params, idsObjLS, callback) {
      var coo = getParsedCk_(obj);
      var idsObjC = extractCoreCk_(coo);
      //console.log("JIXIE - We check if there is the cookie " + partner_cookie + " which is supposed to contain the partner ID");
      idsObjC.pid = (coo[obj.pc] !== undefined ? coo[obj.pc]: null);
      idsObjC.eid = null; // not nice to have it undefined. If got stuff it will be an object.
      
      var instantCall = true;
      if (obj.eid && obj.eid.length > 0){
        var countDown = obj.eid.length; // we use this countdown to call the function afterReadClever_ after all external ID managers have been called
        if (!idsObjC.eid) idsObjC.eid = {};
        obj.eid.forEach(k=>{
          if (external_ids_conf_[k] && external_ids_conf_[k].u){
            if (coo[external_ids_conf_[k].n] !== undefined){
              idsObjC.eid[k] = coo[external_ids_conf_[k].n];
              countDown --;
            }else{
              // We need to query the external partner to get the ID back 
              instantCall = false;
              doAjax_({
                type: 'GET',
                url: external_ids_conf_[k].u,
                success: function (res) {
                  try {
                    res = JSON.parse(res);
                    countDown --;
                    if (!res.error && res[external_ids_conf_[k].f]) {
                      idsObjC.eid[k] = res[external_ids_conf_[k].f];
                    }else{
                      console.log("JIXIE - Cannot decode the result from partner " + k);
                    }
                  } catch (e) {
                    console.log("JIXIE - Error while processing the result from partner " + k + ": " + err);
                  }
                  //console.log("JIXIE - the countdown is " + countDown + " and then we check if we can call the afterReadClever_ function");
                  if (countDown <= 0) {
                    let idsO = makeIdsObj_(obj, idsObjLS, idsObjC);
                    callback(obj, idsO, params);
                  }
                },
                error: function (err) {
                  countDown --;
                  if (countDown <= 0) {
                    let idsO = makeIdsObj_(obj, idsObjLS, idsObjC);
                    callback(obj, idsO, params);
                  }
                  console.log("JIXIE - Error while calling the partner " + k + ": " + err);
                }
              });//doAjax_
            }
          }
        })
      }
      
      if (instantCall){
        //console.log("JIXIE - We call directly afterReadClever_ function as there is no external managwer to call (either retrieved from cookies, either none)");
        let idsO = makeIdsObj_(obj, idsObjLS, idsObjC);
        callback(obj, idsO, params);
      }
    }
     
     /**
     * Extract the creative id from the augmented creative id (having the creation time in front)
     * 
     * Returns null if none or the creative ID
     * 
     * @param {string} cidAug 
     */
    function getCidFromAug(cidAug) {
      if (cidAug && typeof(cidAug) == 'string') {
        let parts = cidAug.split('-');
        if (parts && parts.length == 2) { 
          return parts[1];
        }
        if (parts) {
          if (parts.length == 2) { 
            return parts[1];
          }
          else if (parts.length == 1 && isValidCID(parts[0])) { 
            return parts[0];
          }
        }
      }
      return null;
    }
    
    /**
     * This function assume a key stored in the local storage like <timestamp>-realContent.
     * we extract the timestamp portion
     * then we see if it should have expired or not
     * if yes, then we return null (before that we remove the item from the LS)
     * if not yet expired, all good, we return the item (with the timestamp!)
     * 
     * In case of error (no access to local storage for example) it returns null
     * 
     * @param {object} ls : the local storage
     * @param {string} key : the key of the property we try to get from local storage
     * @param {integer} ttl : the ttl, or said otherwise the validity duration of the property
     */
    function getLSWithTTL(ls, key, ttl) {
      try{
        const itemStr = ls.getItem(key)
        if (!itemStr) {
          return null;
        }
        if (itemStr && typeof(itemStr) == 'string') {
          let parts = itemStr.split('-');
          if (parts && parts.length >= 2) { 
            let timepart = parts.shift();
            if (!isNaN(timepart)) {
              let timesec = parseInt(timepart);
              let nowsec = Math.round(new Date().getTime() / 1000);
              if (nowsec > timesec && nowsec - timesec < ttl) {
                return itemStr; 
              }
            }
          }
        }
        //if we come here it means the result is not useful. Remove it from LS:
        if (itemStr) {
          ls.removeItem(key);
        }
        return null;  
      }catch(e){
        return null;
      }
    }
    
    /**
     * Simple function to add the current timestamp in fron of a value. Returns the created value.
     * @param {string} value 
     */
    function addTSPrefix(value) {
      return parseInt((Date.now()/1000)) + "-" + value;
    }
    
    /**
     * We check if a creative ID given is valid (integer) or not.
     * 
     * @param {string} str 
     */
    function isValidCID(str) {
        var n = Math.floor(Number(str));
        return n !== Infinity && String(n) === str && n > 0;
    }
    
    /**
     * Function to check if the first element is a TS and send the remaining part of the string if more parts than min, other null 
     * 
     * returns an object like:
     * {
     *  ts: <timestamp>,
     *  v: <value> // remaining part of the stuff
     * }
     * 
     * @param {string} str
     * @param {integer} min
     *  
     */
    function splitTS(str, min){
      if (str && str.length > 9){ // below 10 chars it doesn't contain any unix timestamp 
        let parts = str.split('-');
        if (parts.length > 1){ // We need at least 2 parts otherwise it cannot be valid
            // We have enough parts to consider it is a good one (light check I agree)
            let ts = parts.shift(); // we remove the first element of the array which is the timestamp,
            if (parts.length >= min){
              return {ts:ts, v: parts.join('-')}          
            }
        }  
      }
      return false;
    
    }
    
    /**
     * Why readClever_
     * currently use both LS and C if possible
     * -info from LS takes precedence (LS does not have a self-expiry mechansim, so a little bit of gymnastics there)
     * -if the 2 are saying different things, we will try to make them say the same thing
     * 
     * if id (clientid) is there, but the sid is outdated, we will get rid of it. We will generate another one and save it
     *
     * Returns an object like:
     * {
     *    id: <client_id>,
     *    sid: <session_id>,
     *    cid: <creative id>, // NOT the augmented one
     *    ids: <array of ids>,
     *    It: <timestamp>, the last time the interests and intends have been updated
     *    itr: <string>, the list of interests
     *    itd: <string>, the list of intends
     *    ids: <string>, the list of ids
     * }
     * 
     * What it does not do is, it cannot create a client id . browser side we dun do such thing. That rule has not changed
     * @param {object} win 
     * @param {object} doc 
     * @param {boolean} track: indicates if we should track the user or not 
     */
    
    function readClever_(obj, params, callback) {
      if (!obj.tr) {
        callback({
          id: '00000000-0000-0000-0000-000000000000',
          sid: '000000000-00000000-0000-0000-0000-000000000000'
        }, params);
      }
    
      // 1- reading the content of cookies and local storage
      //readLS will take care to return only those stuff that has not 'expired'
      //expired entries would have been deleted from the LS:
      let idsObjLS = readLS_(obj);
      readC_(obj, params, idsObjLS, callback);
    
      // 2- the rest of the processing is done is afterReadClever_, which is called as a call back of readC_
    }
     
     /**
      * This function is a callback after we read the cookies: when reading the cookies, if we are supposed
      * to sync with external ID, then we retrieve that external ID if not present first (then AJAX call).
      * Then we need to split as a function to be in the callback of the AJAX function.
      * 
      * @param {*} obj: the ID helper which called the readClever_ function 
      * @param {*} idsObjLS: the ids retrieved from the Local Storage
      * @param {*} idsObjC: the ids retrieved from the cookies (and the id manager partners)
      */
    function makeIdsObj_(obj, idsObjLS, idsObjC) { 
     
      //console.log("Starting afterReadClever_ function");
     
      let idlist = [];
    
      // 2- processing the client_id and session_id
      let idFinal = null;
      let sidFinal = null;
     
      // Verifying the session IDs (will be used later)
      idsObjLS.sid = splitTS(idsObjLS.sid, 2);
      idsObjC.sid = splitTS(idsObjC.sid, 2);
      let sid = splitTS(getQueryStringValue_(obj.doc.location.href, 'jxsid'), 2); // we try to retrieve also from the query string
    
      // For the client ID, we check if different between cookie and local storage, and we add the different ids to the list
    
      // Priority to the client_id given as query parameter as more chance to be multi domain or click tracking
      // We consider it only if the session has not expired (otherwise can be old stuff not legit)
      if (sid && sid.v){
        idFinal = sid.v;
        sidFinal = sid.ts + '-' + sid.v;
        idlist.push(sid.v);
      }
    
    
      // Second priority is the local storage
    
      /*
      To check if the SID is valid, then we need to check if availablke in cookie. If yes then valid. 
      If not then we check the LS. If the LS is still valid we keep it, if nopt we regenerate one
      */
    
      // We set the ID from the LocalStorage if available
      if (idsObjLS.id && idsObjLS.id !== idFinal){
        idlist.push(idsObjLS.id);
        if (!idFinal){
          idFinal = idsObjLS.id;
        }
      }
    
      // Last resort, we try to find the ID from a first party cookie
      if (idsObjC.id && idsObjC.id !== idFinal){
        idlist.push(idsObjC.id);
        if (!idFinal) {
          idFinal = idsObjC.id;
        }
      }
    
      // Now processing the session ID. IMPORTANT: the session ID in that case is not necessarily using the same client ID than the one selected.
      // However we keep that session ID for tracking purpose.
      // if found already, it means that it comes from the parameters. Then it is the priority (for click tracking)
      // then we keep this one. 
      // Second we try to see if there is one from the cookies. Indeed, the cookie lifetime is extended by 30mn each
      // time the user is seen. 
      // Last, we check if available in LS. If available, then we check its validity. If valid, then we take it.
      // If not, then we generate a new one (line 672)
      if (!sidFinal){
        if (idsObjC.sid && idsObjC.sid.v) sidFinal = idsObjC.sid.ts + '-' + idsObjC.sid.v;
        else{
          if (idsObjLS.sid && idsObjLS.sid.v && !isNaN(idsObjLS.sid.ts)){
            let timesec = parseInt(idsObjLS.sid.ts) + sidTTLMins_*60;
            const now = parseInt((Date.now() / 1000));
            if (timesec > now) sidFinal = idsObjLS.sid.ts + '-' + idsObjLS.sid.v
            else sidFinal = now + '-' + idsObjLS.sid.v
          }
        }
      }
    
      // even if a previous session was existing somewhere, we restart one as it was not associated with
      // the selected client_id, or it was obsolete. 
      if (idFinal && !sidFinal) sidFinal = addTSPrefix(idFinal); 
    
      // 3- Processing the creative ID if any
      let cidFinal            = getQueryStringValue_(obj.doc.location.href, 'jxcid');
      cidFinal                = (isValidCID(cidFinal) ? addTSPrefix(cidFinal): null); //enrich it
      if (!cidFinal) {
        cidFinal              = (idsObjLS.cid ? idsObjLS.cid : ( idsObjC.cid ? idsObjC.cid: null));
      }
    
      // At this stage we have our 3 values idFinal, sidFinal and cidFinal. We write them in local storage and cookie
      // We systematically write, the cost of writing being low
      if (idFinal || sidFinal || cidFinal)   {
        write_(obj.win, obj.doc, idFinal, sidFinal, cidFinal, null, null, null, null, obj.tr, idsObjC.eid);
      }  
    
      // Preparing the output
      var out = {
        client_id: idFinal,
        sid: sidFinal,
        cid: getCidFromAug(cidFinal),
        idlist: idlist,
        eid: idsObjC.eid,
        mts: idsObjLS.mts
      };
       // Adding the other informations that we have read from the cookies
      if (idsObjC.pid) out.pid = idsObjC.pid;
      if (idsObjLS.It) out.It = idsObjLS.It;
      if (idsObjLS.itd) out.itd = idsObjLS.itd;
      if (idsObjLS.ids) out.ids = idsObjLS.ids;
    
      return out;
    }//function end
      
      
    /**
     * Ids helper object
     *
     * NOTE: it is currently our deliberate design that this object does NOT keep the client and sid
     *
     * Because it is not always available - need the consumer code to call certain functions, only then the info will become
     * available. (i.e. if we provide a GET function, the info may not always be meaningful anyway)
     * So better the consumer be conscious of that and call the function getIdsAsync at a time suitable to them
     * and keep that info themselves.
     */
    class CIdsCommon {
      /**
         * Constructor
         * @param {*} initBlob
         *  expect 3 properties in the initBlob object: window = window object, document = document object, track = boolean whether should track the user or not
         */
      constructor (initBlob) {
        this.doc = (initBlob.document ? initBlob.document : document);
        this.win = (initBlob.window ? initBlob.window : window);
        this.tr = (initBlob.track !== undefined ? initBlob.track : defaultValueDoTrack_); // hopefully it is boolean.
        this.pc = (initBlob.p_cookie !== undefined ? initBlob.p_cookie : null); // Stores the partner cookie
        this.eid = (initBlob.ext_ids !== undefined ? initBlob.ext_ids : null); // Stores the external IDs to retrieve
      }
     
      /**
       * Just a replicate of doAjax above
       * 
       * @param {object} obj 
       */
      doAjax (obj) {
        return doAjax_(obj);
      }
     
     
      /**
       * If cannot get the ad from the local storage cookie etc. just return null.
       * Don't call serve (this is its difference from getIdsAsync)
       * 
       * USED BY UNIVERSDAL UNIT
       * 
       */
       getIdsIfAvail() {
            /*
            The very original. Here for reference
            var thisobj = this;
            var ids = readClever_(thisobj.win, thisobj.doc, thisobj.tr);
            if (!ids.id) {
              return null;
            }
            else  
              return({ client_id: ids.id, sid: ids.sid, cid: ids.cid });
            */
           let thisobj = this;          
           let idsObjLS = readLS_(thisobj);
           let idsObjC = extractCoreCk_(getParsedCk_(thisobj));
           
           let ids = makeIdsObj_(thisobj, idsObjLS, idsObjC);  
           if (!ids.client_id) {
             return null;
           }
           else  
               return({ client_id: ids.client_id, sid: ids.sid, cid: ids.cid, mts: ids.mts });
       }
      /**
         *
         * This will fetch the client id and session id of the user and return the results thru the argument to the
         * success callback - There is a possibility the success callback may be called asynchronously if a call to the
         * server turns out to be necessary
         *
         * @param {*} successCB An optional caller provided function. A parameter will be passed to this function which is an object
         * This object has 2 properties currently: client_id and sid.
         * This is called when we have a legi client_id, sid pair to return to the caller
         * @param {*} failureCB An optional caller provided function. No parameter will be passed to this funcion
         */
      getIdsAsync (withProfile, email, partner_id, successCB, failureCB) {
        var thisobj = this;
        var params = {wp: withProfile, e: email, pid: partner_id, scb: successCB, fcb: failureCB};
        readClever_(thisobj, params, afterReadAsync); // callback if out of the object (because need in any case the reference to the object)
      }
    
      /**
       * Function to sync a client_id with email and partner_id
       * At least email or partner_id should be set.
       * 
       * @param {string} client_id 
       * @param {string} email 
       * @param {string} partner_id 
       */
      syncIDs(client_id, email, partner_id){
          var idlist = client_id + ':jx';
          if (email) idlist = idlist + ',' + email + ':email';
          if (partner_id) idlist = idlist + ',' + partner_id + ':partner';
          doAjax_({
            type: 'GET',
            url: uId_ + 'load?' + 'idlist=' + idlist
          });//doAjax_
      }
    
    }
    
      /**
       * This function is called after the data is read or retrieved from the ID providers if not present already in cookies. 
       * 
       * It is necessary to split the initial function getIdsASync in 2 as now when reading cookies it is possible that we have 
       * to call an external service to retrieve some external IDs based on some partners (at first from TTD)
       * 
       * @param {object} ids: the list of IDs read or retrieved 
       * @param {object} params: the initial parameters used to call getIdsAsync
       */
      
      function afterReadAsync(thisobj, ids, params){
        if (!ids.client_id || (!ids.mts || (ids.mts && parseInt((Date.now() / 1000)) - ids.mts > pTTL_)) || (params.wp && ((ids.It && parseInt((Date.now() / 1000)) - ids.It > pTTL_)||!ids.It)) || (ids.idlist && ids.idlist.length > 1)) {
            // If there is no ID or if we are supposed to retrieve the profile of user and it is too old or not existent or there is more than a single client_id
            // Then we will have to query the id syn point
            var idlist = [];
    
    
            //consoleLogIt_("JIXIE - The ID we get is: " + JSON.stringify(ids));
              
            // Building the list of IDs
            ids.idlist.forEach(k => {
              idlist.push(k + ':jx');
            });
            if (ids.pid) idlist.push(ids.pid + ':partner');
            if (params.e) idlist.push(params.e + ':email');
            //Does not seem to need the second part if (params.pid || (params.pid && ids.pid && partner_id !== ids.pid)){
            //anyway, there is no partner_id var here.
            if (params.pid){
              idlist.push(params.pid + ':partner');
            }
            // Processing the external ID manager Ids from ids.eid
            for (var key in ids.eid) {
              if (ids.eid.hasOwnProperty(key)) {
                idlist.push(ids.eid[key] + ':' + external_ids_conf_[key].t);
              }
            }
            var url2call = uId_ + (params.wp ? 'user?info=interests-short,intends-short&':'load?') + 'idlist=' + idlist.join(',');
            if (ids.sid) url2call += '&sid=' + ids.sid;
    
            //consoleLogIt_("JIXIE - calling the URL: " + url2call);
    
            doAjax_({
              type: 'GET',
              url: url2call,
              success: function (res) {
                //console.log("JIXIE - the call has been made with success, now we write the results and we prepare to call the success callback: " + res);
                try {
                  res = JSON.parse(res);
                  if (!res.error && res.client_id) {
                    // REMOVED -  coz another script may also be doing the LOAD ... so... --> rare enough, removing that part
    
                    // setting a ts of refresh if we requested the profile (if doesn't exist then no point of asking again)
                    ids.mts = parseInt(Date.now() / 1000)
                    var ts = params.wp ? ids.mts : null;
    
                    /*console.log("JIXIE - starting write with the following parameters:");
                    console.log("client_id: " + res.client_id);
                    console.log("session_id: " + res.session_id);
                    console.log("cid: null");
                    console.log("last_master_id_update: " + ids.mts);
                    console.log("last_profile_update: " + ts);
                    console.log("interests: " + JSON.stringify(res.interest));
                    console.log("intends: " + JSON.stringify(res.intend));
                    console.log("track: " + thisobj.tr);
                    console.log("eid: " + JSON.stringify(ids.eid));*/
                    write_(thisobj.win, thisobj.doc, res.client_id, res.session_id, null, ids.mts, ts, res.interest, res.intend, thisobj.tr, ids.eid);
                    //console.log("JIXIE - write done");
    
                    // Checking if there was a difference in client_id
                    var merged = false;
                    if (ids.client_id && ids.client_id !== res.client_id) merged = true;
    
                    if (params.scb) {
                      //console.log("JIXIE - there is a success callback that we call");
                      var su = false;
                      if (res.interest || res.intend) su = true;
                      params.scb({ client_id: res.client_id, 
                                  sid: res.sid, 
                                  cid: (ids && ids.cid?  ids.cid: null),
                                  pid: (ids && ids.pid?  ids.pid: null),
                                  itr: (res.interest?  res.interest: null),
                                  itd: (res.intend?  res.intend: null),
                                  ids: (res.ids?  res.ids: null),
                                  email: (params.e?params.e:null),
                                  merged: merged,
                                  su: su
                                });
                    }else{
                      console.log("JIXIE - NO success callback that we call")
                    }
                    return;
                  }else{
                    console.log("JIXIE - Error, no client");
                    if (params.fcb) params.fcb();
                  }
                } catch (e) {
                  console.log("JIXIE - Error while parsing the JSON: " + e);
                  if (params.fcb) params.fcb();
                }
              },
              error: function (err) {
                if (params.fcb) params.fcb();
              }
            });//doAjax_
            return;
        } else {//have id then all good:
            if (params.scb) {
              params.scb(ids);
            }
            return;
        }
      } // function end

   

function get_() {
                    let idsHelper = new CIdsCommon({
                        track: true, //?? TODO
                        window: window,
                        document: document
                        //since we are using the default-no-value- representation for client_id and sid, no need do anything else
                    });
                    let idsObj = idsHelper.getIdsIfAvail(); //the idsObj could be null
    let ret = {};
                    
    if (idsObj && idsObj.client_id) ret.client_id = idsObj.client_id;
    if (idsObj && idsObj.sid) ret.sid = idsObj.sid;
    return ret;
};
module.exports.get = get_;