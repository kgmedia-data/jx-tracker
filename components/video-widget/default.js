const ran = Math.floor(Math.random() * 99999 + 1);
const allClasses = [
  "carouselW",
  "playerW",
  "playerCtr",
  "carouselBtn",
  "vList",
  "vItem",
  "vImg",
  "vDuration",
  "vBoxBot",
  "vTitle",
  "vDate",
  "arrowIcn",
  "carouselDisabled",
  "closeBtn",
  "hide",
  "float"
];

function makeCssClsnames_(hash) {
  var css_ = {};
  allClasses.forEach(function (name) {
    css_[name] = name + hash;
  });
  return css_;
}

function makeCssString_(css_, stylesSetName, o) {
  if (stylesSetName == "default") {
    return makeCssDefault_(css_);
  }
  return "";
}
function makeCssDefault_(css_) {
  return [
    `@import url("https://fonts.googleapis.com/css?family=Roboto");`,
    `.${css_.hide}{display:none !important;}`,
    `.${css_.playerCtr}{position:relative;width:100%;}`,
    `.${css_.playerW}{position:absolute;inset:0;}`,
    `.${css_.carouselW}{position:relative;width:100%;}`,
    `.${css_.carouselW}.${css_.carouselDisabled}{filter:grayscale(1);opacity:.5;cursor:not-allowed;}`,
    `.${css_.carouselBtn} {width:40px;height:40px;top:50%;border:1px solid #e5e5e5;position:absolute;z-index:2;border-radius: 35px;background:#fff;display:flex !important;justify-content:center;align-items:center;transition: all .2s ease;font-family:Roboto, sans-serif;transform:translate(0px, -50%);}`,
    `.${css_.carouselBtn}.left{left:0;box-shadow:3px 0 6px rgb(0 0 0 / 30%);}`,
    `.${css_.carouselBtn}.right{right:4px;box-shadow:-3px 0 6px rgb(0 0 0 / 30%);}`,
    `.${css_.arrowIcn}{position:relative;display:block;width:1rem;height:1rem;}`,
    `.${css_.arrowIcn}:after{content:"";position:absolute;width:12px;height:12px;border-top:2px solid #3ca5dd;border-left:2px solid #3ca5dd;top:50%;left:50%;transform:translate(-50%,-50%);}`,
    `.${css_.arrowIcn}.right{margin-right:3px;transform:rotate(135deg);}`,
    `.${css_.arrowIcn}.left{margin-left:5px;transform:rotate(-40deg);}`,
    `.${css_.vList}{background:#fff;padding-top:10px;}`,
    `.${css_.vItem}{padding:0 3px;position:relative;cursor:pointer;}`,
    `.${css_.vItem}.active:before{border-top:5px solid #1b63d4;}`,
    `.${css_.vItem}:before{content:"";position:absolute;top:0;left:3px;width:calc(100% - 6px);z-index:2;}`,
    `.${css_.carouselDisabled} .${css_.vItem}, .${css_.carouselDisabled} .${css_.carouselBtn}{cursor:not-allowed;pointer-events:none;}`,
    `.${css_.vImg}{position:relative;width:100%;padding-top:56.25%;overflow:hidden;}`,
    `.${css_.vDuration}{position:absolute;bottom:7px;right:7px;z-index:2;background:#000;padding:5px;font-size:12px;line-height:1;color:#fff;font-family:Roboto, sans-serif;}`,
    `.${css_.vImg} img{position:absolute;top:50%;left:50%;z-index:1;width:100%;transform:translate(-50%,-50%);}`,
    `.${css_.vBoxBot}{position:relative;background:#fff;padding:8px 8px 8px 0;transition:all .2s ease;}`,
    `.${css_.vTitle}{position:relative;white-space:normal;text-transform:capitalize;font-size:15px!important;line-height:1.3!important;color:#1a1a1a!important;height:40px;max-height:40px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;margin-bottom:0!important;font-family:Roboto, sans-serif;margin:0;}`,
    `.${css_.vDate}{padding-top:5px;font-size:10px;line-height:1;color:#000;font-family:Roboto, sans-serif;}`,
    `.${css_.closeBtn}{position:absolute;cursor:pointer;top:4px;right:4px;z-index:3;appearance:none;border:1px solid transparent;width:30px;height:30px;background:transparent;display:flex !important;justify-content:center;align-items:center;padding:0;}`,
    `.${css_.closeBtn} span{position:relative;display:block;width:18px;height:18px;text-indent:-70px;overflow:hidden;transform:rotate(45deg);}`,
    `.${css_.closeBtn} span:before, .${css_.closeBtn} span:after{content:"";position:absolute;width:100%;height:3px;background:#fff;left:50%;top:50%;transform:translate(-50%,-50%);}`,
    `.${css_.closeBtn} span:after{transform:translate(-50%,-50%) rotate(90deg);}`,
    `.${css_.float}{position:fixed;right:0;box-shadow: 0 4px 8px rgb(0 0 0 / 16%);z-index:2;}`,
  ].join("\n");
}

module.exports.makeCssClsnames = makeCssClsnames_;
module.exports.makeCssString = makeCssString_;
