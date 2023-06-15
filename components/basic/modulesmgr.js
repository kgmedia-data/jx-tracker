/**
 * The way to use require+browserify to really do components!
 * 
 * component so that we can have modules that implement a set of "interface functions"
 * but can do different things depend on context
 * It was more useful for the video/audio player (which were once in this repo..)
 * 
 * Allows us to re-use components and use mix and match to build bundles out of compoennts
 * easiliy
 * See those files in bundles/* to see how this modulesmgr is used.
 */
var theMap_ = new Map();
//console.log('modules manager run and we create the map object ONCE here');
function get_(name) {
    return theMap_.get(name);

}

function set_(name, obj) {
    //console.log(`_DEBUGMODULESMGR addings ${name} to map of size ${theMap_.size}`);
    theMap_.set(name, obj);
}

module.exports.set = set_;
module.exports.get = get_;

/* 
 ************** module: basic/modulesmgr*************************************************

* module.exports:
  - set (function (componentName, object) 
    - "registers" the object under componentName with this manager (for later 'get')
  - get (function (componentName) 
    - returns the object under componentName with this manager (can be null)
    
* requires/dependencies:
  - none
*/