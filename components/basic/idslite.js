   
   function getParsedCk_(doc) {
     var coo = {};
     if (doc.cookie && doc.cookie != '') {
       var spl = doc.cookie.split(';');
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
  * it can take an optional namedCookie specified by the caller
  * and try to look it up for the caller
  *  
  * @param {*} coo : a parsed cookie object. (It could be an empty object, but will not be null)
  * @returns an object which has id, sid, cid (read from the cookie). 
  * If the cookie entry for client id (i.e. _jx) is not there, then id property is null
  * If the cookie entry for session id (i.e. _jxs) is not there, then sid property is null
  * If the cookie entry for creative (i.e. _jxcid) is not there, then cid property is null
  */
    
   function get_(namedCookie = null) {
    let ret = {};
    let coo = null; // the parsed cookies object
    try {
        let ls = window.localStorage;
        let id =  ls.getItem('_jxx');
        let sid = ls.getItem('_jxxs');
        let cohort = ls.getItem('_jxcht');
        if (id) {
            //console.log(`### FROM LS1 ${id}`);
            ret.client_id = id;
        }
        if (sid) {
            //console.log(`### FROM LS2 ${sid}`);
            ret.sid = sid;
        }
        if (cohort) {
          //console.log(`### FROM LS3 ${cohort}`);
          ret.cohort = cohort;
        }
        if (namedCookie) {
          coo = getParsedCk_(document);
          if (coo[namedCookie] !== undefined) {
            ret[namedCookie] = coo[namedCookie];
            //console.log(`### FROM COOKIE1 ${ret.client_id}`);
          }
        }
        if (id || sid || cohort) return ret; //i.e. LS is working.
    }
    catch(e) {}
    if (!coo) {
      coo = getParsedCk_(document);
    }
    if (coo['_jxx'] !== undefined) {
        ret.client_id = coo['_jxx'];
        //console.log(`### FROM COOKIE1 ${ret.client_id}`);
    }
    if (coo['_jxxs'] !== undefined) {
        ret.sid = coo['_jxxs'];
        //console.log(`### FROM COOKIE2 ${ret.sid}`);
    }
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