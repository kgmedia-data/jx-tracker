/**
 * The way to use require+browserify to really do components!
 * To be explained in detail
 */
var theMap_ = new Map();
//console.log('modules manager run and we create the map object ONCE here');
function get_(name) {
    console.log()
    let tmp = theMap_.get(name);
    //if (tmp) {
      //  console.log(`_DEBUGMODULESMGR retrieved ${name} from map of size ${theMap_.size}`);
    //}
    //else {
      //  console.log(`_DEBUGMODULESMGR unable to retrieve ${name} from map of size ${theMap_.size}`);
    //}
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