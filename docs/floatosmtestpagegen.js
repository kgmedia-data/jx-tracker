/**
 * use this to generate a little html page to test float cases 
 */
/*
    {
        "floating": "always",
        "floatparams": {
            "start": "init",
            "position": "bottom-left",
            "marginX": 3,
            "marginY": 19,
            "background": "transparent"
        }
    }
    then change into string then do the url encoding:
    use with any page with OSM
    Together with creativeids to force your ids
    jxoptions=%7B%22floating%22%3A%22always%22%2C%22floatparams%22%3A%7B%22position%22%3A%22bottom-left%22%2C%22marginX%22%3A3%2C%22marginY%22%3A19%2C%22background%22%3A%22transparent%22%7D%7D
    */


var cases_ = [
{ 
    dim: "300x250 (or slightly scaled up)",
    list: [1387, 1381, 1027]
},
{
    dim: "320x480",
    list: [1405]
},
{
    dim: "320x100",
    list: [617, 1080]
},
{
    dim: "320x50",
    list: [1317, 616]
},
{
    dim: "728x90",
    list: [71]
},
{
    dim: "sq video",
    list: [923]
},
{
    dim: "vertical video: 9x16",
    list: [686]
},
{
    dim: "standard video ad: 16x9",
    list: [23]
}];

var buf = "";
const position = 'bottom-left';
const floating = 'always';
const marginX = 0;
const marginY = 0;
const start = 'init';
cases_.forEach(function(oneBlob) {
    buf += (`\n<h1>${oneBlob.dim}</h1>`);
    oneBlob.list.forEach(function(cid) {
        buf += ('\n<p><a href="' + `https://megapolitan.kompas.com/read/2021/05/28/05334261/update-27-mei-bertambah-15-kasus-covid-19-di-tangsel-kini-totalnya-11257?jxoptions=%7B%0A%20%20%20%20%20%20%20%20%22floating%22%3A%20%22${floating}%22%2C%0A%20%20%20%20%20%20%20%20%22floatparams%22%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%22start%22%3A%20%22${start}%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22position%22%3A%20%22${position}%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22marginX%22%3A%20${marginX}%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22marginY%22%3A%20${marginY}%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22background%22%3A%20%22transparent%22%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D&creativeids=${cid}` + `">${cid}</a></p>`);
    });
});
//%7B%0A%20%20%20%20%20%20%20%20%22floating%22%3A%20%22always%22%2C%0A%20%20%20%20%20%20%20%20%22floatparams%22%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%22type%22%3A%20%22view%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22position%22%3A%20%22bottom-left%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22marginX%22%3A%203%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22marginY%22%3A%2019%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22background%22%3A%20%22transparent%22%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D
console.log(`
<!DOCTYPE html>
<html>
<head>
<style>
/* Sets paragraph text to be very large */
p { font-size: xx-large; }

/* Sets <h1> text to be 2.5 times the size
   of the text around it */
h1 { font-size: 250%; }
</style>
</head>
<body>

${buf}
</body>
</html>`);

/*
select width, height, count(*) from creatives 
where NOT (width = 640 and height = 360) AND NOT (width = 1280 and height = 720) AND NOT (width = 640 and height = 0)
AND NOT (width = height) and NOT (width = 720 and height > 1000) and NOT (width = 0) AND not (height = 0)
and not (width = 300 and height = 600)
GROUP BY width, height 
*/