// bundles rwidget.js

(
    function() {
      const modulesmgr = require('../components/basic/modulesmgr');
      const createObject = require('../components/recwidget/recwidget-factory');
      var instMap = new Map();
  
      var JxEventsQ = function () {
        this.push = function () {
            for (var i = 0; i < arguments.length; i++) {
                try {
                  start_(arguments[i]);
                } catch (e) {}
            }
        }
    };
  var ourSigQ = '_jxrwidget';
  var _old_eventsq = window[ourSigQ];
  window[ourSigQ] = new JxEventsQ(); //actually no need object, just cloned from some website's snipplet .. :-)
  
  // execute all of the queued up events - apply() turns the array entries into individual arguments
  if (_old_eventsq)
      window[ourSigQ].push.apply(window[ourSigQ], _old_eventsq);
  
    var instMap = new Map();
  
  function start_(options) {
      let hashStr = btoa(JSON.stringify(options));
      let instMaybe = instMap.get(hashStr);
      if (instMaybe) {
          return;
      }
      let widgetInst = createObject(options);
      instMap.set(hashStr, widgetInst);
  }}
  
  )();
  
  
