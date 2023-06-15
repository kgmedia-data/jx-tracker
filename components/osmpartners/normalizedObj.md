## Normalized Object explained
- this is an object made (you will see makeNormalizedObj in the code) so that the osm generic waterfall layer can handle each layer generically without caring what specific partner it really it. 
- So we absorb the peculiarity of each partner into osmpartners/<partnerName>.js
- So that the engine can be generic in terms of injecting code fragments into the DOM (partner script etc) etc

## What are the properties in the normalized object ?
```
        timeout (So we throw them out if still no ad after timeout sec)
        
        partner (string e.g. teads, unruly)
        
        trackers: trackers object to use to do firing of trackers
        
        stackidx: 0, 1, 2 (0 for first tag tried, 1 for second etc)
        
        stackdepth: how many layers is the waterfall (e.g. 3)
        
        instID: some unique string
        
        valid: boolean 
        
        createslot: {  <-- for the osm core when creating the div for the script
            parent: {
                - the HTML element to attach the created slot to
                node - if node is present, corejs uses code, else use selector
                selector
            },
            div: { 
                id: id to give to the div to create
                css: any special css to add
            }
        }
        
        msgs : an object of the messages to expect from partner script to inform of
            noad, hasad, impression   
            core js uses this to map incoming messages to 'noad', 'imp' etc and act accordingly            
        
            noad, hasad, impression   <-- this does not apply to jixie ads (since the ad already finalized when we reach this stage)
    
        customfcns  : {
            inview <-- for e.g. unruly when the visibiltyslot comes inview we will run a function
            
        }

        visibilityslot : {
            //the visilibyt measurement done by core.js , which container should it monitor?:
            selector: 
        }

        scriptb: the script to inject (string)
           a partner must have either scriptb or scriptcfg! Unruly case there is scriptb
        scriptcfg: the module's runCreative function, if any, will be called with this cfg.

        scriptdiv = {
            inject the unruly script into a div of this id and style
            id: 
            style:
        }
        scriptselector - the selector to describe the parent to which to hang the script div

        floating - boolean - float or not is not managed by us but by the partner. 
           we just need to know for the sake of creative view events generation
    ```