/**
 * Bundle built to make Video Recommendation Widget
 * 
 * Documentation: refer to recvwidget.md file in this same dir
 */

(
    function() {
      const modulesmgr = require('../components/basic/modulesmgr');
      const cssmgr = require('../components/video/cssmgr');
      modulesmgr.set('video/cssmgr', cssmgr);
      const createObject = require('../components/video-widget/widget-factory');
      const stylesSet = require('../components/video-widget/default');
  
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
  var ourSigQ = '_jxvwidget';
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
      cssmgr.init(options.container, stylesSet, {controls: {cachebuster: 1}}, []);
      let widgetInst = createObject(options);
      instMap.set(hashStr, widgetInst);
  }}
  
  )();
  
  