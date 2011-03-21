/*
---
description: A simple, dependency honoring JS library loader.

license: MIT-style

authors:
- Abbey Hawk Sparrow

provides: [Bootstrap]
...
*/
//simple bind
if(!Function.prototype.bind){
    Function.prototype.bind = function(scope){
        var _function = this;
        return function(){
            return _function.apply(scope, arguments);
        }
    }
}
//bootstrap
var Bootstrap = {
    callbacks : {},
    loadedRequirements : 0,
    totalRequirements : 0,
    initCallback : null,
    checkInterval : 1000,
    loaded : {},
    dependsOn : {},
    logBuffer : [],
    requirements : {},
    log : function (message){ this.logBuffer[this.logBuffer.length] = message; },
    handlers : {},
    setHandler : function(type, handlerFunction){ //handlerFunction(location, callback)
        this.handlers[type.toLowerCase()] = handlerFunction.bind(this);
    },
    load : function(requirements, func){
        var requirement;
        this.totalRequirements += requirements.length;
        if(func) this.initCallback = func;
        Bootstrap.log('Found '+requirements.length+' requirements');
        for(var lcv=0; lcv < requirements.length; lcv++){
            requirement = requirements[lcv];
            this.requirements[requirement.location] = requirement;
            this.requirements[requirement.location].callback = this.createCallback(function(){
                Bootstrap.notifyLoad(this.name);
            }.bind(requirement));
            Bootstrap.log(requirement.name+'('+(lcv+1)+') initializing...');
            if(this.dependenciesSatisfied(requirement)){
                var name = requirement.name;
                Bootstrap.log(requirement.name+' is ready to load, initiating load.');
                Bootstrap.loadFile(requirement.location, requirement.callback.func);
            }else{
                if(typeof(requirement.depends) == 'object' && (requirement.depends instanceof Array)){ //array
                    if(requirement.depends.each){
                        requirement.depends.each(function(dependency){
                            Bootstrap.log(dependency.name+' requires '+requirement.name+' for loading, being queued until then.');
                            if(!this.dependsOn[dependency]) this.dependsOn[dependency] = [];
                            this.dependsOn[dependency][this.dependsOn[dependency].length] = requirement;
                        }.bind(this));
                    }else{
                        for(var lcv2=0; lcv2 < requirement.depends.length; lcv2++){
                            Bootstrap.log(requirement.name+' requires '+requirement.depends[lcv2]+' for loading, being queued until then.');
                            if(!this.dependsOn[requirement.depends[lcv2]]) this.dependsOn[requirement.depends[lcv2]] = [];
                            this.dependsOn[requirement.depends[lcv2]][this.dependsOn[requirement.depends[lcv2]].length] = requirement;
                        }
                    }
                }else{ //string
                    if(!this.dependsOn[requirement.depends]) this.dependsOn[requirement.depends] = [];
                    this.dependsOn[requirement.depends][this.dependsOn[requirement.depends].length] = requirement;
                    Bootstrap.log(requirement.name+' requires '+requirement.depends+' for loading, being queued until then.');
                }
            }
        }
    },
    dependenciesSatisfied : function(requirement){
        var result = true;
        var parts = [];
        var type = 's';
        if(requirement.depends){
            if(typeof(requirement.depends) == 'object' && (requirement.depends instanceof Array)){ //array
                if(requirement.depends.each){
                    result = true;
                    requirement.depends.each(function(dependency){
                        if(!Bootstrap.loaded[dependency]) result = result && false;
                        parts.push(dependency+'('+(result?'T':'F')+')'); type='A';
                    }.bind(this));
                }else{
                    for(var lcv=0; lcv < requirement.depends.length; lcv++){
                        Bootstrap.log('   '+requirement.depends[lcv]+' a-> ?');
                        parts.push(requirement.depends[lcv]+'('+(result?'T':'F')+')'); type='a';
                        if(!Bootstrap.loaded[requirement.depends[lcv]]) result = false;
                    }
                }
            }else{ //string
                Bootstrap.log('   '+requirement.depends+' s-> '+(Bootstrap.loaded[requirement.depends] === true));
                result = Bootstrap.loaded[requirement.depends] === true;
                parts.push(requirement.depends+'('+(result?'T':'F')+')');
            }
            Bootstrap.log('   Testing '+requirement.name+' dependencies ['+type+':'+parts.join(', ')+'] -> '+result);
        }
        return result;
    },
    notifyLoad : function(name){
        Bootstrap.loadedRequirements++;
        Bootstrap.loaded[name] = true;
        if(this.totalRequirements == this.loadedRequirements){
            if(this.initCallback != null){
                var cb = this.initCallback;
                this.initCallback = null;
                cb();
            }
        }
        var remainder = (this.totalRequirements - this.loadedRequirements > 0
                ?(this.totalRequirements - this.loadedRequirements)+' more requirements('+this.remaining().join(', ')+').'
                :'No requirements more remaining.');
        if(this.dependsOn[name]){
            Bootstrap.log(name+' loaded, now notifying dependencies...');
            var dependency;
            for(var lcv=0; lcv < this.dependsOn[name].length; lcv++){
                dependency = this.dependsOn[name][lcv];
                if(this.dependenciesSatisfied(dependency)){
                    Bootstrap.log(dependency.name+'\'s dependencies were fully satisfied by '+name+': initiating load, '+remainder);
                    Bootstrap.loadFile(dependency.location, dependency.callback.func);
                }else{
                    Bootstrap.log(dependency.name+' loaded prerequisite '+name+' but still has not satisfied all prerequisites, '+remainder);
                }
            }
        }else Bootstrap.log(name+' loaded, '+remainder);
    },
    remaining : function(){
        var left = [];
        for(key in this.requirements) if(!this.loaded[this.requirements[key].name]) left.push(this.requirements[key].name);
        return left;
    },
    createCallback : function(callbackFunction){
        var thisLoadID = this.uuid();
        this.callbacks['func'+thisLoadID] = callbackFunction;
        var result = {
            func : this.callbacks['func'+thisLoadID],
            text : 'Bootstrap.callbacks.func'+thisLoadID+'();',
            functionID : 'Bootstrap.callbacks.func'+thisLoadID,
            id : thisLoadID
        };
        return result;
    },
    loadFile : function(filename, onload) {
        var extension = filename.split('.').pop().toLowerCase();
        if(this.handlers[extension] && this.requirements[filename]){
            this.handlers[extension](this.requirements[filename]);
        }else throw('unsupported file type('+extension+') for '+filename+'...');
    },
    uuid : function(){
        var s = [];
        var hexDigits = "0123456789ABCDEF";
        for (var i = 0; i < 32; i++)  s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        s[12] = "4";
        s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);
        return s.join("");
    }
};

// Javascript support
Bootstrap.setHandler('js', function(requirement){
    var head = document.getElementsByTagName('head').item(0);
    var js = document.createElement('script');
    js.setAttribute('type', 'text/javascript');
    js.setAttribute('src', requirement.location);
    js.setAttribute('onload', requirement.callback.text);
    head.appendChild(js);
});

// CSS Support
if(!Bootstrap.checkCSS){
    Bootstrap.checkCSS = function(filename, loadID){ // just checks if it's in the DOM, we should be more thorough
        var requirement = this.requirements[filename];
        var head = document.getElementsByTagName('head').item(0).children;
        var base = filename;
        var found = false;
        if(filename.indexOf('/') == 0){//relative to root
            base = window.location.protocol+'//'+window.location.hostname+filename;
        }else{//relative
            if(false){
                //(todo: support x domain)
            }else{
                var directory = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
                base = window.location.protocol+'//'+window.location.hostname+directory+'/'+filename;
            }
        }
        for(var lcv=0; lcv < head.length; lcv++){
            var requeue = "Bootstrap.checkCSS('"+filename+"', '"+loadID+"');";
            if(head[lcv].type=='text/css' && base==head[lcv].href){ // this is the css file we're looking for
                try{
                    if(head[lcv].getAttribute('onload')){
                        if(eval(requirement.callback.functionID)){
                            requirement.callback.func();
                        }
                    }
                }catch(ex){
                    console.log(['fail', ex, requirement]);
                }
                found = true;
            }
        }
        if(!found) window.setTimeout(requeue ,Bootstrap.checkInterval);
    };
    Bootstrap.checkCSS.bind(Bootstrap);
}
Bootstrap.setHandler('css', function(requirement){
    var head = document.getElementsByTagName('head').item(0);
    var js = document.createElement('link');
    js.setAttribute('type', 'text/css');
    js.setAttribute('rel', 'stylesheet');
    js.setAttribute('href', requirement.location);
    js.setAttribute('onload', requirement.callback.text);
    head.appendChild(js);
    window.setTimeout("Bootstrap.checkCSS('"+requirement.location+"', '"+requirement.callback.id+"' );",Bootstrap.checkInterval);
});

// AJAX support
if(!Bootstrap.http){
    Bootstrap.files = {};
    Bootstrap.http = function(file, callback){
        var req = new XMLHttpRequest();
        req.onreadystatechange = function(response){
            if (req.readyState == 4) {
                if (req.status == 200) {
                    if(response.srcElement) response = response.srcElement;
                    this.files[file] = response.responseText;
                    Bootstrap.log('file '+file+' fetched.');
                    callback(response.responseText);
                } else {
                    Bootstrap.log('There was an error fetching the file: '+filename);
                }
            }
        }.bind(this);
		req.open('GET', file, true);
		req.send('');
    };
}
if(!XMLHttpRequest){ //simple XMLHttpRequest wrapper
    XMLHttpRequest.onsend = null;
    XMLHttpRequest.prototype.send = function (data) {
        if(this.constructor.onsend) this.constructor.onsend.apply(this, arguments);
        this.object.send(data);
    }
    if (window.xXMLHttpRequest && xXMLHttpRequest.wrapped) XMLHttpRequest.wrapped	= xXMLHttpRequest.wrapped; //firebug
    //if (self.readyState == self.constructor.DONE) self.object.onreadystatechange	= new Function; //IE
    XMLHttpRequest.UNSENT = 0;
    XMLHttpRequest.OPENED = 1;
    XMLHttpRequest.HEADERS_RECEIVED = 2;
    XMLHttpRequest.LOADING = 3;
    XMLHttpRequest.DONE = 4;
}

// JSON support
Bootstrap.data = {};
Bootstrap.setHandler('json', function(requirement){
    this.http(requirement.location, function(text){
        try{
            //todo: make sure we are executing arbitrary code
            eval('var json = '+text+';');
            Bootstrap.data[requirement.location] = json;
            if(requirement.callback.func) requirement.callback.func(json);
        }catch(ex){
            var type = (''+ex).split(':').shift();
            //if(type == ){}
            console.log(['ERROR', ex, type, ex.type]);
            throw(ex);
        }
    });
});

/*|--------------------------------{MIDAS.JS ADDITIONS}----------------------------------------|*/
if(!window.Midas) window.Midas = {};
Midas.enableBootstrapHandlers = function(){
    // CSS support
    /* Midas.js CSS Parser off by default, add a slash to the front of this line to enable it
    if(Midas.CSSParser){ //we can safely assume MooTools, because Midas requires it.
        Bootstrap.setHandler('css', function(requirement) {
            var styleParser = new Midas.CSSParser();
            var myRequest = new Request({
                url: requirement.location,
                onSuccess: function(data){
                    styleParser.apply(data);
                    requirement.callback.func(data);
                }
            }).send();
        });
    }
    //*/
    
    // SCSS support
    if(Midas.SCSSParser){ //we can safely assume MooTools, because Midas requires it.
        Bootstrap.setHandler('scss', function(requirement){
            var styleParser = new Midas.SCSSParser();
            var myRequest = new Request({
                url: requirement.location,
                onSuccess: function(data){
                    styleParser.apply(data);
                    requirement.callback.func(data);
                }
            }).send();
        });
    }
    
    // Properties support
    if(Midas.PropertiesParser){ //we can safely assume MooTools, because Midas requires it.
        var handlerFunction = function(requirement){
            var propsParser = new Midas.PropertiesParser();
            var myRequest = new Request({
                url: requirement.location,
                onSuccess: function(data){
                   requirement.callback.func(propsParser.parse(data));
                }
            }).send();
        };
        Bootstrap.setHandler('properties', handlerFunction);
        Bootstrap.setHandler('props', handlerFunction);
    }
    
    // INI support
    if(Midas.INIParser){ //we can safely assume MooTools, because Midas requires it.
        var handlerFunction = function(requirement){
            var iniParser = new Midas.INIParser();
            var myRequest = new Request({
                url: requirement.location,
                onSuccess: function(data){
                   requirement.callback.func(iniParser.parse(data));
                }
            }).send();
        };
        Bootstrap.setHandler('ini', handlerFunction);
        Bootstrap.setHandler('conf', handlerFunction);
    }
    
    // Smarty support
    if(Midas.Smarty){ //we can safely assume MooTools, because Midas requires it.
        Bootstrap.smarty = {
            templates :{},
            render :{}
        };
        Bootstrap.objectSize = function(object){
            var count = 0;
            for(key in object) count++;
            return count;
        };
        Bootstrap.setHandler('tpl', function(requirement){
            var directory = requirement.location.substring(0, requirement.location.lastIndexOf('/'));
            var filename = requirement.location.substring(requirement.location.lastIndexOf('/'));
            var smartyInstance = new Midas.Smarty({ template_directory : directory });
            if(requirement.data){
                requirement.dataID = requirement.data;
                requirement.data = this.data[requirement.data];
                if(typeOf(requirement.data) == 'array'){
                    var result = [];
                    requirement.data.each(function(row){
                        if(typeof requirement.data != 'object') throw('classes required to be nested inside complex data! ('+(typeof requirement.data)+' found.)');
                        try{
                        for(key in row) smartyInstance.assign(key, row[key]);
                        smartyInstance.fetch(filename, function(renderedTemplate){
                            result.push(renderedTemplate);
                            if(result.length == Bootstrap.objectSize(row)){ //we're done!
                                Bootstrap.smarty.render[requirement.name] = result;
                                Bootstrap.smarty.templates[requirement.name] = smartyInstance.runtimeCache[requirement.location];
                                requirement.callback.func(result);
                            }
                        }.bind(this));
                        }catch(ex){
                            console.log(['EXX', ex]);
                        }
                        //smartyInstance = new Midas.Smarty({ template_directory : directory });
                    }.bind(this));
                }else{ //it's a class
                    for(key in requirement.data) smartyInstance.assign(key, requirement.data[key]);
                    smartyInstance.fetch(filename, function(renderedTemplate){
                        Bootstrap.smarty.render[requirement.name] = renderedTemplate;
                        Bootstrap.smarty.templates[requirement.name] = smartyInstance.runtimeCache[requirement.location];
                        requirement.callback.func(renderedTemplate);
                    }.bind(this));
                }
            }else{
                //we must just be pre-fetching the template for later renders
                smartyInstance.fetch(filename, function(renderedTemplate){
                    Bootstrap.smarty.templates[requirement.name] = smartyInstance.runtimeCache[requirement.location];
                    requirement.callback.func(renderedTemplate);
                }.bind(this));
            }
        });
    }
};
if(Midas.Smarty || Midas.INIParser || Midas.SAXParser || Midas.PropertiesParser) Midas.enableBootstrapHandlers();