//just add the test cases for theplayers: naked and the scripts type.
//also add the script type.
const tdOpen_ = '<td>';
const tdClose_ = '</td>';
const trOpen_ = '<tr>';
const trClose_ = '</tr>';

const video = 'video';
const display = 'display';
const dpa = 'dpa';
const script = 'script';
const outstream = 'outstream';

const demoCases_ = [
    {
        name: 'Teads Demo',
        types: [outstream],
        id: 897,
        tests: []
    },
    {
        name: 'Unruly Demo',
        types: [outstream],
        id: 893,
        tests: []
    },
    {
        name: 'Video ad (pure) 16:9',
        types: [video],
        id: 1286,
        width: 640,
        height: 360,
        tests: []
    },
    {
        name: 'Video ad (hybrid: whole)',
        id: 969,
        width: 640,
        height: 360,
        types: [video],
        tests: []
    },
    {
        name: 'Video ad (hybrid: right vert)',
        id: 943,
        width: 640,
        height: 360,
        types: [video],
        tests: []
    },
    {
        name: 'Video ad (instream) sq w loop',
        id: 690,
        //width: 320,
        //height: 320,
        types: [video],
        tests: []
    },
    {
        name: 'Banner + Video + Banner',
        id: 724,
        width: 320,
        height: 520,
        types: [video, display], //yep
        tests: []
    },
    {
        name: 'Video ad (instream) vertical',
        id: 686,
        //width: 300,
        //height: 250,
        types: [video],
        tests: []
    },
    {
        name: 'Video ad recommendation',
        renee: 'https://megapolitan.kompas.com/read/2021/05/28/05334261/update-27-mei-bertambah-15-kasus-covid-19-di-tangsel-kini-totalnya-11257?creativeids=530&jxadtagurl=https%3A%2F%2Fad.jixie.io%2Fv1%2Fvideo%3Fsource%3Dosm%26unit%3D1000008-iT3q5Ci4Ry%26client_id%3D52471830-e2f4-11ea-b5e9-f301ddda9414%26sid%3D1630122685-98eaca70-973f-11eb-bced-2faf96bca39d%26creativeids%3D530%26pageurl%3Dhttps%253A%252F%252Fmegapolitan.kompas.com%252Fread%252F2021%252F05%252F28%252F05334261%252Fupdate-27-mei-bertambah-15-kasus-covid-19-di-tangsel-kini-totalnya-11257%253Fcreativeid%253D530%26domain%3Dmegapolitan.kompas.com%26fixedheight%3D400%26maxwidth%3D546%0A',
        id: 1015,
        width: 640,
        height: 360,
        types: [video],
        tests: []
    },
    {
        name: 'Display: 3rd party script DFP',
        id: 388,
        width: 300,
        height: 250,
        types: [display, script],
        adUnitCodeM: "div-gpt-ad-Zone_2",
        tests: []
    },
    {
        name: 'Display: 3rd party script Amazon',
        id: 765,
        width: 300,
        height: 520,
        types: [display, script],
        tests: []
    },
    {
        name: 'Display: 3rd party script IQOS',
        id: 1090,
        width: 300,
        height: 600,
        types: [display, script],
        tests: []
    },
    {
        name: 'Display: simple image 300x600',
        id: 683,
        width: 300,
        height: 600,
        types: [display],
        adUnitCodeD: "div-gpt-ad-Giant",
        adUnitCodeM: "div-gpt-ad-flying_carpet_mobile",
        tests: []
    },
    {
        name: 'Display: simple image 320x100',
        id: 1174,
        width: 320,
        height: 100,
        types: [display],
        adUnitCodeM: "div-gpt-ad-Zone_1",
        tests: []
    },
    {
        name: 'Display: simple image 320x50',
        id: 1155,
        width: 320,
        height: 50,
        types: [display],
        adUnitCodeM: "div-gpt-ad-Horizontal_Ad",
        tests: []
    },
    {
        name: 'Display: simple image 300x250',
        id: 1253,
        width: 300,
        height: 250,
        types: [display],
        adUnitCodeM: "div-gpt-ad-Zone_2",
        tests: [
        ]
    },
    {
        name: 'LITE!!! (cid=1132) 970x250',
        types: [display, dpa],
        demoorg: 'Rumah',
        adUnitCodeD: "div-gpt-ad-Top_1-1",
        width: 970,
        height: 250,
        id: 1132
    },
    {
        name: 'LITE!!! (cid=1027) 300x250 2 Rotating Products with Brand Background (img slanted at 45 deg)',
        file: '300x250/2pdt_rot_brandbg_45deg',
        types: [display, dpa],
        demoorg: 'Tokopedia',
        adUnitCodeD: "div-gpt-ad-Right_4",
        adUnitCodeM: "div-gpt-ad-Zone_2",
        width: 300,
        height: 250,
        id: 1027
    },
    {
        name: 'LITE!!! (cid=1033) 640x360 3 Products (WE DO 9 HERE!), Fade In/Out, 2 prices, Standard button',
        file: '640x360/3pdt_fade_2pr_stdb',
        notes: 'To look like the live Shopee',
        demoorg: 'Shopee (existing converted)',
        types: [display, dpa],
        width: 640,
        height: 360,
        id: 1033

    },
    {
        name: 'LITE!!! (cid=1165) 300x600 2 Product Rotating',
        file: '300x600/2pdt_rot',
        demoorg: 'Tokopedia',
        types: [display, dpa],
        width: 300,
        height: 600,
        adUnitCodeD: "div-gpt-ad-Giant",
        adUnitCodeM: "div-gpt-ad-flying_carpet_mobile",

        id: 1165
    },
    {
        name: 'LITE!!! (cid=1166) 300x600 2 Product Rotating (as hotspot in HYBRID VIDEO AD)',
        file: '300x600/2pdt_rot',
        demoorg: 'Tokopedia',
        types: [dpa, video],
        width: 300,
        height: 600,
        adUnitCodeD: "div-gpt-ad-Giant",
        adUnitCodeM: "div-gpt-ad-flying_carpet_mobile",

        id: 1166
    },
    {
        name: '300x600 2 Product Rotating',
        file: '300x600/2pdt_rot',
        demoorg: 'Tokopedia',
        types: [display, dpa],
        width: 300,
        height: 600,
        adUnitCodeD: "div-gpt-ad-Giant",
        adUnitCodeM: "div-gpt-ad-flying_carpet_mobile",

        id: 613
    },
    {
        name: '300x600 2 Product',
        file: '300x600/2pdt',
        demoorg: 'Tokopedia',
        types: [display, dpa],
        width: 300,
        height: 600,
        adUnitCodeD: "div-gpt-ad-Giant",
        adUnitCodeM: "div-gpt-ad-flying_carpet_mobile",

        id: 576
    },

    {
        name: '300x600 1 Product',
        file: '300x600/1pdt',
        demoorg: 'Tokopedia',
        types: [display, dpa],
        width: 300,
        height: 600,
        adUnitCodeD: "div-gpt-ad-Giant",
        adUnitCodeM: "div-gpt-ad-flying_carpet_mobile",

        id: 536
    },
    {
        name: '300x600 2 Products SCALED TO 150x300',
        file: '300x600/2pdt_rot_brandbg',
        notes: 'Shopee',
        types: [video, dpa],
        demoorg: 'Shopee (hybrid instream)',
        width: 300,
        height: 600,
        adUnitCodeD: "div-gpt-ad-Giant",
        adUnitCodeM: "div-gpt-ad-flying_carpet_mobile",

        id: 542
    },
    {
        name: '300x600 2 Products (rotating) with Brand Background',
        file: '300x600/2pdt_rot_brandbg',
        notes: 'Shopee',
        types: [display, dpa],
        demoorg: 'Shopee (existing converted)',
        width: 300,
        height: 600,
        adUnitCodeD: "div-gpt-ad-Giant",
        adUnitCodeM: "div-gpt-ad-flying_carpet_mobile",

        id: 531
    },
    {
        name: '640x360 2 Products With BrandBackground',
        file: '640x360/2pdt_brandbg',
        demoorg: 'Shopee',
        types: [display, dpa],
        width: 640,
        height: 360,
        
        id: 533
    },
    {
        name: '640x360 3 Rotating Products',
        file: '640x360/3pdt_rot',
        demoorg: 'Shopee',
        types: [display, dpa],
        width: 640,
        height: 360,
        id: 532
    },
    {
        name: '640x360 3 Fade In/out, 2 Prices, Round button',
        file: '640x360/3pdt/fade_2pr_round',
        demoorg: 'Shopee',
        types: [display, dpa],
        width: 640,
        height: 360,
        id: 574
    },
    {
        name: '640x360 3 Products, Fade In/Out, 2 prices, Standard button',
        file: '640x360/3pdt_fade_2pr_stdb',
        notes: 'To look like the live Shopee',
        demoorg: 'Shopee (existing converted)',
        self: '519 need fix',
        types: [display, dpa],
        width: 640,
        height: 360,
        id: 539
    },
    {
        name: '640x360 6 Products, TADA, 2 prices, Square button',
        file: '640x360/6pdt_tada_2pr_sqb',
        notes: 'Blibli',
        self: 518,
        demoorg: 'Blibli',
        types: [display, dpa],
        width: 640,
        height: 360,
        id: 541
    },
    {
        name: '640x360 6 Products, TADA, 2 prices, Flat button',
        file: '640x360/6pdt_tada_2pr_flatbutton',
        notes: 'To look like the live Lazada',
        self: 518,
        demoorg: 'Lazada (existing converted)',
        types: [display, dpa],
        width: 640,
        height: 360,
        id: 538
    },

    {
        name: '640x360 6 Products, Fade In/out, 1 price, Standard button',
        file: '640x360/6pdt_fade_1pr_stdb',
        notes: 'To look like the live Tokopedia',
        demoorg: 'Tokopedia (existing converted)',
        types: [display, dpa],
        width: 640,
        height: 360,
        id: 540
    },
    {
        name: '300x250 1  Product',
        file: '300x250/1pdt',
        demoorg: 'Tokopedia',
        types: [display, dpa],
        width: 300,
        height: 250,
        adUnitCodeD: "div-gpt-ad-Right_4",
        adUnitCodeM: "div-gpt-ad-Zone_2",

        id: 534
    },
    {
        name: '300x250 2 Products',
        file: '300x250/3pdt',
        demoorg: 'Tokopedia',
        types: [display, dpa],
        width: 300,
        height: 250,
        adUnitCodeD: "div-gpt-ad-Right_4",
        adUnitCodeM: "div-gpt-ad-Zone_2",

        id: 784
    },
    {
        name: '300x250 3 Products',
        file: '300x250/3pdt',
        demoorg: 'Tokopedia',
        types: [display, dpa],
        width: 300,
        height: 250,
        adUnitCodeD: "div-gpt-ad-Right_4",
        adUnitCodeM: "div-gpt-ad-Zone_2",

        id: 535
    },
    {
        name: '300x250 2 Rotating Products with Brand Background (img level)',
        file: '300x250/2pdt_rot_brandbg_0deg',
        demoorg: 'Tokopedia',
        types: [display, dpa],
        width: 300,
        height: 250,
        adUnitCodeD: "div-gpt-ad-Right_4",
        adUnitCodeM: "div-gpt-ad-Zone_2",

        id: 882
    },
    {
        name: '300x250 2 Rotating Products with Brand Background (img slanted at 45 deg)',
        file: '300x250/2pdt_rot_brandbg_45deg',
        demoorg: 'Tokopedia',
        types: [display, dpa],
        width: 300,
        height: 250,
        adUnitCodeD: "div-gpt-ad-Right_4",
        adUnitCodeM: "div-gpt-ad-Zone_2",

        id: 883
    },
    //Now Players of all sorts
    {
        name: 'Jx demo Bayer CDR YouTube',
        types: [player],
        width: 640,
        height: 360,
        id: 22
    },
    {
        name: 'Trial Pijaru YouTube',
        types: [player],
        width: 640,
        height: 400,
        id: 26
    },

    {
        name: 'Trial Digital ADV Kompascom YouTube',
        types: [player],
        width: 640,
        height: 400,
        id: 27
    },
    {
        name: 'Trial - Stylo.id - Makeup untuk Pemula',
        types: [player],
        width: 640,
        height: 400,
        id: 40
    },
    {
        name: 'Youtube - playing an IMA ad',
        types: [player],
        width: 640,
        height: 360,
        id: 295
    },
    {
        name: 'Essai of youtube player',
        types: [player],
        id: 954
    },
    {
        name: 'New YT Player integration with IMA (plays an ad)',
        types: [player],
        id: 335
    },
    {
        name: 'TBN IVS Player (pscript) in jxfriendly.1.3.min.js already broken (No CV, IMP)',
        types: [player],
        id: 72
    },
    {
        name: 'TBN YT Player (pscript)',
        types: [player],
        id: 73
    },
    {
        name: 'TBN DM Player (pscript)',
        types: [player],
        id: 74
    },
    {
        name: 'Kompasiana DM (pscript)',
        types: [player],
        id: 99
    },
    {
        name: 'Kompasiana IVS (pscript) - in jxfriendly.1.3.min.js already broken (No CV, IMP)',
        types: [player],
        id: 151
    },
    {
        name: 'New Kompasiana DM (pscript)',
        types: [player],
        id: 262
    },
    {
        name: 'DailyMotionPlayer (non-script)',
        types: [player],
        id: 851
    }
];


//We prepare a few links
//
//UNIV LITE OSM HB         
function makeTable(cases, flag) {
    let buf = '';
    cases.forEach(function(oneRow) {
        let uUrl = `https://universal.jixie.io/demos/portal/hybrid.html?creativeid=${oneRow.id}`;
        let uliteUrl = `https://jx-demo-creatives.s3-ap-southeast-1.amazonaws.com/osmtest/test_ulite_renee.html?creativeid=${oneRow.id}`;
        let osmUrl = `https://jx-demo-creatives.s3-ap-southeast-1.amazonaws.com/osmtest/test_osm.html?creativeids=${oneRow.id}`;
        let osmDUrl = `https://jixieamptest.kompas.com/api/testpagegen?filename=osm400pxdesktop&creativeids=${oneRow.id}`;
        let osmMUrl = `https://jixieamptest.kompas.com/api/testpagegen?filename=osm400pxmobile&creativeids=${oneRow.id}`;
        let hbDUrl = null;
        if (oneRow.adUnitCodeD) {
            hbDUrl = `https://jixieamptest.kompas.com/api/testpagegen?filename=kompashbdesktop&jxhbadunitcode=${oneRow.adUnitCodeD}&jxhbcreativeid=${oneRow.id}&jxhbwidth=${oneRow.width}&jxhbheight=${oneRow.height}`;
            console.log(`
                \ndesktop ${oneRow.width}x${oneRow.height}
                ${oneRow.adUnitCodeD}
                ${hbDUrl}
            `);
            
        }

        let hbMUrl = null;
        if (oneRow.adUnitCodeM) {
            hbMUrl = `https://jixieamptest.kompas.com/api/testpagegen?filename=kompashbmobile&jxhbadunitcode=${oneRow.adUnitCodeM}&jxhbcreativeid=${oneRow.id}&jxhbwidth=${oneRow.width}&jxhbheight=${oneRow.height}`;
            console.log(`
                \nmobile ${oneRow.width}x${oneRow.height}
                ${oneRow.adUnitCodeM}
                ${hbMUrl}
            `);
        }
        let ampUrl = `https://jixieamptest.kompas.com/api/testpagegen?filename=ampad1&creativeid=${oneRow.id}`;

        buf += trOpen_;
        let extra = (oneRow.extra ? "( " + oneRow.extra + " )" : "");

        buf += tdOpen_ + `${oneRow.name}${extra}` + tdClose_;
        buf += tdOpen_ + `${oneRow.width?oneRow.width:"?"}x${oneRow.height?oneRow.height:"?"}` + tdClose_;

        if (oneRow.types[0] == outstream) {
            uUrl = null; 
            uliteUrl = null;
            hbDUrl = null;
            hbMUrl = null;
        }
        realLink = uUrl ? `<a href="${uUrl}" xtarget="_blank">univ</a>` : '';
        buf += tdOpen_ + realLink + tdClose_;

        realLink = uliteUrl ? `<a href="${uliteUrl}" xtarget="_blank">new-univ</a>` : '';
        buf += tdOpen_ + realLink + tdClose_;

        realLink = osmUrl ? `<a href="${osmUrl}" xtarget="_blank">-</a>` : '';
        buf += tdOpen_ + realLink + tdClose_;

        realLink = osmDUrl ? `<a href="${osmDUrl}" xtarget="_blank">OSM-D</a>` : '';
        buf += tdOpen_ + realLink + tdClose_;

        realLink = osmMUrl ? `<a href="${osmMUrl}" xtarget="_blank">OSM-M</a>` : '';
        buf += tdOpen_ + realLink + tdClose_;

        realLink = ampUrl ? `<a href="${ampUrl}" xtarget="_blank">amp_ad</a>` : '';
        buf += tdOpen_ + realLink + tdClose_;

        realLink = hbDUrl ? `<a href="${hbDUrl}" xtarget="_blank">HB-D</a>` : '';
        buf += tdOpen_ + realLink + tdClose_;

        realLink = hbMUrl ? `<a href="${hbMUrl}" xtarget="_blank">HB-M</a>` : '';
        buf += tdOpen_ + realLink + tdClose_;


        buf += trClose_;
    });
    return buf;
}



function finalOutput() {
    let demoCasesStr_ = makeTable(demoCases_, "");
    let filledTemplate = `
	<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="">
        <meta name="author" content="">
        <title>Jixie Ads Demo/Tests</title>
        <!-- Bootstrap core CSS -->
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
        <!-- Custom styles for this template -->
        <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
  
    </head>
    <body>
		<div class="container">
		<!--
            <div class="masthead">
                <h3 class="text-muted">Jixie</h3>
			</div>
		-->
         <h2>Jixie Ad Rendering TestPage</h2>
         
            <div class="row">
                <div style="width:100%" class="textwrapper">
                    <textarea style="width:100%" rows="5" id="hbinfo">
                To view in HB context: RESOURCE OVERRIDE is needed! 
                (So for mobile, pls do on desktop browser with mobile-emulation)
                FROM and TO URL-patterns as follows:
                https://securepubads.g.doubleclick.net/gampad/ads?gdfp_req=1&pvsid=*hb_adid_jixie* 
                https://jixieamptest.kompas.com/api/jsongen?gdfp_req=1&pvsid=*hb_adid_jixie*
                    </textarea></div>
            </div>
            <div class="row">
                <table style="width:100%">
                    ${demoCasesStr_}
              </table>
			</div>
			<hr>`;
    filledTemplate += `<!-- Site footer -->
			<!--
            <footer class="footer">
                <p>&copy; Company 2014</p>
			</footer>
			-->
        </div>         

        <!-- /container -->
        <!-- Bootstrap core JavaScript
    ================================================== -->
        <!-- Placed at the end of the document so the pages load faster -->
        <script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script> 
        <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous"></script>
    </body>
</html>

	`;

    return filledTemplate;
}

function main() {
    let out = finalOutput();
    var fs = require('fs');
    var wstream = fs.createWriteStream('jixie_adtest.html');
    wstream.write(out);
    wstream.end();
}
main();