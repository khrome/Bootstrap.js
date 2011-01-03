if(!Function.prototype.bind){
    Function.prototype.bind = function(scope){
        var _function = this;
        return function(){
            return _function.apply(scope, arguments);
        }
    }
}
var Bootstrap = {
    callbacks : {},
    loadedRequirements : 0,
    totalRequirements : 0,
    initCallback : null,
    loaded : {},
    dependsOn : {},
    initialize : function(requirements, func){
        var requirement;
        this.totalRequirements = requirements.length;
        if(func) this.initCallback = func;
        for(var lcv=0; lcv < requirements.length; lcv++){
            requirement = requirements[lcv];
            if(requirement.depends && !Bootstrap.loaded[requirement.depends]){
                if(!this.dependsOn[requirement.depends]) this.dependsOn[requirement.depends] = [];
                 this.dependsOn[requirement.depends][this.dependsOn[requirement.depends].length] = requirement;
            }else{
                var name = requirement.name;
                Bootstrap.JS(requirement.location, function(){
                    Bootstrap.notifyLoad(this);
                }.bind(name));
            }
        }
    },
    notifyLoad : function(name){
        Bootstrap.loadedRequirements++;
        Bootstrap.loaded[name] = true;
        if(this.dependsOn[name]){
            var dependency;
            for(var lcv=0; lcv < this.dependsOn[name].length; lcv++){
                dependency = this.dependsOn[name][lcv];
                console.log(dependency.name+' now ready');
                Bootstrap.JS(dependency.location, function(){
                    Bootstrap.notifyLoad(this);
                }.bind(dependency.name));
            }
        }
        if(this.totalRequirements == this.loadedRequirements){
            if(this.initCallback != null){
                this.initCallback();
            }
        }
    },
    JS : function(script_filename, onload) {
        if(!onload) onload = function(){};
        var thisLoadID = this.uuid();
        this.callbacks['func'+thisLoadID] = onload;
        var head = document.getElementsByTagName('head').item(0);
        var js = document.createElement('script');
        js.setAttribute('type', 'text/javascript');
        js.setAttribute('src', script_filename);
        js.setAttribute('onload', 'Bootstrap.callbacks.func'+thisLoadID+'();');
        head.appendChild(js);
    },
    uuid : function(){
        var s = [];
        var hexDigits = "0123456789ABCDEF";
        for (var i = 0; i < 32; i++)  s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        s[12] = "4";
        s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);
        return s.join("");
    }
}