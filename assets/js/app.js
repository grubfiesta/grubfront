window.Base = window.Base || {};
/**
 * Default ENV for which the configurations would be loaded
 * @type {string}
 */
Base.ENV = typeof window["ENV"] != "undefined" ? window["ENV"]:'local';
Base.appBasePath = "/assets/js/";
require.config({
    //baseUrl: "/assets/js",
    paths: {
        'base': Base.appBasePath  + 'plugins/base',
        'base-web': Base.appBasePath  + 'plugins/base-web'
    },
    shim: {
        'base': {
            exports: 'Base'
        }
    }
});
/**
 * Modules to be loaded
 * @type {Array}
 */
Base.modules = ['standalone'];

if (Base.ENV == "local") {
    require.config({
        urlArgs: "bust=" + (new Date()).getTime()
    });
}
/**
 *  MERGING CONFIGURATIONS BASED ON DEPENDENCY (ENVIRONMENT)
 *  @todo: Add recursive environment dependency.
 */
Base.config = {};

/**
 * Transmitted configuration files' count
 * @type {number}
 */
Base.envTransmitted = 0;
Base.transLimit = 1000;

/**
 * Some default functions of Base
 */
Base.stopScript = function (message) {
    var message = '<!DOCTYPE html><html lang="en"><head><title>Restaurant Reservations, Online Food Orders &amp; Reviews | Base Ado</title></head><body><div id="container"><p id="preloadArea" style="text-align:center;padding:40px;font-family:Arial,Helvetica,sans-serif;font-size:13px;">' + message + '</p></div></body></html>';
    document.write(message);
    return true;
}


/**
 * As Deferred is not loaded or we don't have any other means to init modules
 * after the loading of all configurations we are using Interval
 * @type {number}
 */
Base.transInterval = setInterval(function () {
    if (Base.envTransmitted == Base.transLimit) {
        require.config(Base.config.require);
        initApp();
        clearInterval(Base.transInterval);
    }
}, 100);

require(['config/' + Base.ENV], function (conf) {
    Base.config = conf;
    /**
     * Check if the dependentENV is a defined or not! If yes then loop it for merging
     */
    if (typeof conf.dependentENV == 'object') {
        Base.transLimit = conf.dependentENV.length;
        for (var i = 0; i < Base.transLimit; i++) {
            require(['config/' + conf.dependentENV[i]], function (depConf) {
                Base.envTransmitted++;
                Base.config = Base.merge(Base.config, depConf);
            });
        }
    } else {
        if (typeof Base.config['dependentENV'] == 'undefined' && Base.transInterval) {
            require.config(Base.config.require);
            initApp();
            clearInterval(Base.transInterval);
        }
    }
});
/**
 * Recursive merge of two objects
 * *NOTE: we don't have default functions as underscore to do the task or jquery
 * so we are only left with basic merge
 * @param obj1
 * @param obj2
 * @returns {{}}
 */
Base.merge = function(b,c){var d={},a;for(a in b)d[a]=a in c&&"object"===typeof b[a]&&null!==a?Base.merge(b[a],c[a]):b[a];for(a in c)a in d||(d[a]=c[a]);return d};
/**
 * LOAD MODULES DEFINED IN THE MODULES ARRAY
 */
Base.loadModules = function (modules, def) {
    var paths = [];
    Base.RouterStack = [];
    for (var i = 0; i < modules.length; i++) {
        var modPath = Base.appBasePath + 'modules/' + modules[i] + "/router";
        paths.push(modPath);
    }
    require(paths, function () {
        var j = 0;
        _.each(arguments, function (router) {
            var routerInstance = new router;
            var name = modules[j];
            Base.RouterStack.push({
                name: name,
                instance: routerInstance
            });
            require.config({
                paths: {
                    name: Base.appBasePath + "" + name
                }
            });
            j++;
        });
        def.resolve();
        //load user details after defining paths
        //Base.loadUser(def);
    });
};

function initApp() {
    require(['base', 'base-web'], function (Base) {
        require(['backbone', 'jquery', 'messages'], function (Backbone) {
            var def = $.Deferred();
            //passing a chainable deferred object in the global namespace
            Base.loadModules(Base.modules, def);
            def.done(function () {
                Backbone.history.start({pushState: true}); //starting backbone history after the routers have loaded
            });
        });
    });
}