/**
 * What you need to do is to copy this file and make a file in the same dir
 * called config-keys.js
 * Then you fill in awsKey and awsSecret
 * You can change the awsBucket
 * This is for the gulp options DEPLOY-DEVELOPER* built commands
 * i.e. it will push your files to s3 as a convenience for you
 * This is only for development and testing purposes.
 * The real deployments are MANUAL
 * Read the top 30 lines of gulpfile and all will be clear
 */
var configKeys = {
    awsKey: "",
    awsSecret: "",
    awsBucket: "jx-demo-creatives",
    awsRegion: "ap-southeast-1"
};
module.exports = function(){
    return configKeys;
};


