Bootstrap.js
===========

Bootstrap is a dependency honoring js loader for injecting library dependencies in an already running page environment (such as a bookmarklet). While other bootloaders are doing a circle jerk over how small they can make a head insertion with a callback, this one focuses on supporting the diverse array of formats needed in a web app, while being as conservative as possible with resources.

What it can do for you:
Compact, but also full featured, it provides:
    -signature detection (detect if the library you are loading is already loaded), useful for bookmarklets
    -asyncronous load
    -dependencies: single or multiple, cascading... the freedom to load as you please
    -pluggable, add support for your own formats (includes built-in support for many formats if it detects Midas.js)
        -Smarty
        -Properties
        -INI
        -XHTML (construct a full DOM without touching the browser's DOM tree)
    -supports many formats natively:
        -CSS
        -Javascript
        -JSON
        -Text
    -does not get confused after loaded libraries extend the Array(MooTools, jQuery and Prototype)
    -internal event log may be accessed after run or piped into an existing logger system
    -includes both a simple bind function as well as an XMLHttpRequest wrapper
    -callbacks, both at the process and file level

How to use
----------

Just use it like so:

    //In this example, we'll load a base environment first
    Bootstrap.load(
        [
            {
                name : 'MooTools',
                signature : 'document.id',
                location : '/js/mootools-core-1.3-full-nocompat.js'
            },
            {
                name : 'MooTools.More',
                location : '/js/mootools-more.js',
                depends : ['MooTools']
            },
            {
                name : 'DebugLogger',
                location : '/js/ba-debug.js'
            },
            {
                name : 'GlobalStyle',
                location : '/styles/style.css'
            },
            {
                name : 'GlobalData',
                location : '/global.json'
            },
            {
                name : 'Midas',
                location : '/js/Midas.min.js'
            }
        ],
        function(){
            // now we have our base environment, let's now load some more resources for our app
            Bootstrap.log(['Simple environment loaded', Bootstrap.logBuffer]);
            Midas.enableBootstrapHandlers(); //enable midas extensions
            Bootstrap.load(
                [
                    {
                        name : 'NewsFeed',
                        location : '/templates/news.tpl',
                        depends : ['NewsData']
                    },
                    {
                        name : 'NewsData',
                        location : '/data/news.json'
                    },
                    {
                        name : 'NewsFeed',
                        location : '/templates/news.tpl',
                        depends : ['NewsData']
                    },
                    {
                        name : 'UserData',
                        location : '/data/user.json'
                    }
                ],
                function(){
                    // we have everything to build our page, use the resources to make it happen
                    console.log(['Load Complete, check out the resources: ', Bootstrap.logBuffer]);
                }
            );
            // do something here to make things pretty and zoomy while the advanced environment comes up
        }
    );
    
More to come.