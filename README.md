Bootstrap.js
===========

Bootstrap is a dependency honoring js loader for injecting library dependencies in an already running page environment (such as a bookmarklet). It could also be used as a minimilist harness for bringing up a complex environment outside head.

How to use
----------

Just use it like so:

    Bootstrap.initialize(
        [
            {
                name : 'MooTools',
                signature : 'document.id',
                location : 'http://domain.com/js/mootools-1.2.4-core.js'
            },
            {
                name : 'MooTools.More',
                location : 'http://domain.com/js/mootools-1.2.4.2-more.js',
                depends : 'MooTools'
            },
            {
                name : 'MyLib',
                location : 'http://domain.com/js/MyLib.js',
                depends : 'MooTools.More'
            }
        ],
        function(){
            // you are now loaded, do your stuff here
        }
    );
    
simple enough, no frills..