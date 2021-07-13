## basic/moduelsmgr
    -
    -
    -

## basic/ids
* module.exports:
  - get (function)
    - returns an object and this object could contain 'client_id' and/or 'sid' properties 
    - ... if available dependencies:

* requires/dependencies:
    - none
   
        
## basic/pginfo
* module.exports:
    - get (function)
        - returns an object and this object could contain the following, if available:
            - creativeid (from current url)
            - creativeids (from current url)
            - debug (from current url)
            - deltaassets64 (from current url)
            - portal (from curent url)
    
            - domain
            - pageurl
            - p_domain
            - (Renee TODO: write down the way we determine the answer)
  
* requires/dependencies:
    - none