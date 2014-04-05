define(['backbone', 'backbone-query', 'jstorage'], function (Backbone, Backbone_Query, jStorage) {
    /**
     * Emulate json so that the request sent is in form of form-data
     * @type {boolean}
     */
    //Backbone.emulateHTTP = true;
    //Backbone.emulateJSON = true;
    /**
     * Enable support for cross domain
     * @type {boolean}
     */
    $.support.cors = true;
    /**
     * OVERRIDE THE DEFAULT SYNC PROTOCOL OF BACKBONE TO
     * -- ADD TOKEN IN EVERY REQUEST
     *
     * @type {Function}
     */
    var originalSync = Backbone.sync;
    var originAjax = $.ajax;
    $(document).ajaxError(function(event, request, settings){
        if(request.status == 403 &&
            typeof request.responseJSON.message != "undefined" &&
            request.responseJSON.message == 'Invalid/Expired token'
            ){
            Base.trigger("expire:token");
        }
    });
    $(document).ajaxSuccess(function(event, request, settings){
        if(request.status == 200){
            Base.trigger("update:token-ttl");
        }
    });
    Backbone.ajax = function() {
        if(arguments[0]['type'] == "GET" || arguments[0]['type'] == "DELETE") {
            arguments[0].data = arguments[0].data || {};
            arguments[0].data["token"] = Base.apiToken;
            if(arguments[0]['type'] == "DELETE") {
                arguments[0].url = arguments[0].url + "?token=" + Base.apiToken;
            }
        }
        return originAjax.apply(Backbone,arguments);
    };
    Backbone.sync = function () {
        if( arguments[0] == "create" || arguments[0] == "update" || arguments[0] == "delete") {
            if(arguments[2] && arguments[2].data !== null && arguments[2].data !== undefined){
                arguments[2].contentType = 'application/json';
                arguments[2].data["token"] = Base.apiToken;
                arguments[2].data = JSON.stringify(arguments[2].data);
            } else if( arguments[1] instanceof Base.Model){
                arguments[1].set("token",Base.apiToken);
            }
        }
        return originalSync.apply(Backbone, arguments);
    };
    //var originalNavigate = Backbone.history.navigate;
    Backbone.history.navigate = function(fragment, options) {
        if (!Backbone.History.started) return false;
        if (!options || options === true) options = {trigger: !!options};

        var url = this.root + (fragment = this.getFragment(fragment || ''));
        var pathStripper = /[#].*$/;
        // Strip the fragment of the query and hash for matching.
        fragment = fragment.replace(pathStripper, '');

        if (this.fragment === fragment) return;
        this.fragment = fragment;

        // Don't include a trailing slash on the root.
        if (fragment === '' && url !== '/') url = url.slice(0, -1);

        // If pushState is available, we use it to set the fragment as a real URL.
        if (this._hasPushState) {
            this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

            // If hash changes haven't been explicitly disabled, update the hash
            // fragment to store history.
        } else if (this._wantsHashChange) {
            this._updateHash(this.location, fragment, options.replace);
            if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
                // Opening and closing the iframe tricks IE7 and earlier to push a
                // history entry on hash-tag change.  When replace is true, we don't
                // want this.
                if(!options.replace) this.iframe.document.open().close();
                this._updateHash(this.iframe.location, fragment, options.replace);
            }

            // If you've told us that you explicitly don't want fallback hashchange-
            // based history, then `navigate` becomes a page refresh.
        } else {
            return this.location.assign(url);
        }
        if (options.trigger) return this.loadUrl(fragment);
    };
    Backbone.history.getFragment = function(fragment, forcePushState) {
        var trailingSlash = /\/$/;
        var routeStripper = /^[#\/]|\s+$/g;
        if (fragment == null) {
            if (this._hasPushState || !this._wantsHashChange || forcePushState) {
                fragment = this.location.pathname + this.location.search;
                var root = this.root.replace(trailingSlash, '');
                if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
            } else {
                fragment = this.getHash();
            }
        }
        return fragment.replace(routeStripper, '');
    };

    /**
     * Router Overrides as we need to add baseURL for the routers
     * @type {*|void|extend|extend|extend|extend}
     */
    Base.Router = Backbone.Router.extend({
        route: function (route, name, callback) {
            if (typeof this.baseUrl != 'undefined') {
                route = route != '' ? '/' + route : route;
                route = this.baseUrl + route;
            }

            if (!_.isRegExp(route)) route = this._routeToRegExp(route);
            if (_.isFunction(name)) {
                callback = name;
                name = '';
            }
            if (!callback) callback = this[name];
            var router = this;
            Backbone.history.route(route, function (fragment) {
                var args = router._extractParameters(route, fragment);
                callback && callback.apply(router, args);
                router.trigger.apply(router, ['route:' + name].concat(args));
                router.trigger('route', name, args);
                Backbone.history.trigger('route', router, name, args);
            });
            return this;
        },
        loadLayout: function (name) {
            if (!name) {
                throw ":: Please specify a layout to be loaded";
            }
            var router = this;
            router.layoutLoading = $.Deferred();
            require([ Base.appBasePath + 'layouts/' + name], function (layout) {
                var layout = new layout();
                layout.render(router);
            });
        }
    });

    /**
     * Defining Base Collection to default BackboneQuery
     * @type {*}
     */
    Base.Collection = Backbone_Query;
    var originalFetch = Base.Collection.prototype.fetch;
    Base.Collection.prototype.fetch = function(){
        this.trigger('before:fetch');
        return originalFetch.apply(this, arguments);
    };
    /**
     * Extending Backbone View to support the SubView functionality
     * @type {*|void|extend|extend|extend}
     */
    Base.View = Backbone.View.extend({
        hasSubView: function (name) {
            if (typeof name == 'string' && this.subViews instanceof Object && typeof this.subViews[name] != 'undefined' && this.subViews[name] instanceof Base.View) {
                return true;
            }
            return false;
        },
        getSubView: function (name) {
            if (this.hasSubView(name)) {
                return this.subViews[name];
            }
            return false;
        },
        setSubView: function (name, view) {
            if (typeof name != 'string' || typeof view == 'undefined' || !(view instanceof Base.View)) {
                return false;
            }
            if (this.hasSubView(name)) {
                this.getSubView(name).remove();
            }
            this.subViews[name] = view;
            return this;
        },
        removeAll: function () {
            if (typeof this.subViews != 'undefined' && this.subViews instanceof Object && _.keys(this.subViews).length) {
                _.each(this.subViews, function (view) {
                    if (typeof view.beforeRemove == 'function'){
                        view.beforeRemove.apply(view);
                    }
                    if (typeof view.removeAll == 'function') {
                        view.removeAll();
                    } else {
                        view.remove();
                    }
                });
            }
            this.remove();
        }
    });
    _.extend(Base.View.prototype, Backbone.Model.prototype);

    Base.Model = Backbone.Model.extend({
        localSave: function (key, data, ttl) {
            var localSaveName = this["localSaveName"];
            if (!localSaveName) {
                throw "Please set the localSaveName for the model";
            }
            var previousSaved = $.jStorage.get(localSaveName, false);
            try {
                if (typeof key == "undefined") {
                    key = "";
                }
                if (typeof data == "undefined") {
                    data = this;
                }
                $.jStorage.set(localSaveName + key, data);
                if (!previousSaved) {
                    var timeToLive = parseInt(ttl, 10) ? parseInt(ttl, 10) * 1000 : 3600000;
                    $.jStorage.setTTL(localSaveName, timeToLive);
                }
            } catch (ex) {
                return false;
            }
            return this;
        },
        localGet: function (key, defaultValue) {
            if (!this["localSaveName"]) {
                throw "Please set the localSaveName for the model";
            }
            if (typeof key == "undefined") {
                key = "";
            }
            defaultValue = defaultValue || false;
            return $.jStorage.get(this["localSaveName"] + key, defaultValue);
        },
        localDelete: function (key) {
            if (!this["localSaveName"]) {
                throw "Please set the localSaveName for the model";
            }
            if (typeof key == "undefined") {
                key = "";
            }
            $.jStorage.deleteKey(this["localSaveName"] + key);
            return this;
        }
    });

    /**
     * Initialize Base Controller as View Type Object
     * that has the functionality of constructor
     * @constructor
     */
    Base.Controller = function () {
        this.preDispatch.apply(this, arguments);
        this.initialize.apply(this, arguments);
    };
    Base.preserveViews = function(views){
        var toBePreservedViewNames = [];
        _.each(views, function (view) {
            toBePreservedViewNames.push(Base.getUname(view));
        });
        _.each(Base.ViewStack, function (stack) {
            var preserve = false;
            _.each(toBePreservedViewNames, function (preserve_name) {
                if (preserve_name == stack["name"]) {
                    preserve = true;
                    return true;
                }
            });
            if(!preserve){
                Base.deleteView({uname: stack["name"]});
            }
        });
    };
    Base.preserveControllers = function(controllers){
        var toBePreservedControllersNames = [];
        _.each(controllers, function (controller) {
            toBePreservedControllersNames.push(Base.getUname(controller));
        });
        _.each(Base.ControllerStack, function (stack) {
            var preserve = false;
            _.each(toBePreservedControllersNames, function (preserve_name) {
                if (preserve_name == stack["name"]) {
                    preserve = true;
                    return;
                }
            });
            if(!preserve){
                Base.deleteController({uname: stack["name"]});
            }
        });
    };
    /**
     * Extending the controller with initialize function and
     * assigning it Backbone Events With Model Prototype
     */
    _.extend(Base.Controller.prototype, Backbone.Events, {
        preDispatch: function(){},
        initialize: function () {},
        dispatch: function(){},
        beforeRemove: function(){},
        preserveViews: Base.preserveViews
    });
    /**
     * Giving the ability to controller to be extended as Backbone.View.extend
     * @type {Function|extend|extend|extend}
     */
    Base.Controller.extend = Backbone.View.extend;

    /**
     * Finally allowing Base to have Backbone Events
     */
    _.extend(Base, Backbone.Events);

    /**
     * Custom Stack for Controllers, View and Models
     */
    Base.ControllerStack = new Array();
    Base.ViewStack = new Array();
    Base.ModelStack = new Array();
    Base.CollectionStack = new Array();
    Base.scroll=false;

    Base.getUname = function (obj) {
        var module = _.isString(obj["module"]) ? obj["module"] : '';
        var _name = _.isString(obj["name"]) ? obj["name"] : '';
        var uname = _.isString(obj["uname"]) ? obj["uname"] : ( (module && _name) ? (module + '.' + _name) : false);
        return uname;
    };

    /**
     *
     * @param controllers
     * @param context
     * @returns {*}
     */
    Base.getControllers = function (controllers, context) {
        var controllerDeferred = $.Deferred();
        var paths = [];
        _.each(controllers, function (cont) {
            var module = cont.module,
                controller_name = cont.name;
            paths.push( Base.appBasePath + 'modules/' + module + "/controllers/" + controller_name);
        });
        require(paths, function () {
            var returnData = [];
            for (var i = 0; i < arguments.length; i++) {
                var options = typeof controllers[i]['options'] == 'object' ? controllers[i]['options'] : {};
                var removeOld = controllers[i] && typeof controllers[i]['removeOld'] == 'boolean' ? controllers[i]['removeOld'] : false;
                if(removeOld){
                    Base.deleteController(controllers[i]);
                }
                var controllerInstance = new arguments[i](options);
                var uname = Base.getUname(controllers[i]);
                var controllerObj = {
                    'name': uname,
                    'instance': controllerInstance
                };
                returnData.push(controllerInstance);
                Base.ControllerStack.push(controllerObj);
            }
            controllerDeferred.resolve.apply(context, returnData);
        });
        return controllerDeferred;
    };
    Base.getControllerInstance = function (obj) {
        var uname = Base.getUname(obj);
        if (!uname) {
            throw "Invalid Parameters. Please provide Module & Controller name OR uname";
        }
        var existingControllers = _.where(Base.ControllerStack, {'name': uname});
        if (existingControllers.length == 1) {
            return _.first(existingControllers)["instance"];
        } else if (existingControllers.length > 1) {
            throw "Multiple Instance of the required controller exists. Please try getControllerInstances for all controllers";
        }
        return false;
    };
    Base.getControllerInstances = function (obj) {
        var uname = Base.getUname(obj);
        if (!uname) {
            throw "Invalid Parameters. Please provide Module & Controller name OR uname";
        }
        var existingControllers = _.where(Base.ControllerStack, {'name': uname});
        if (existingControllers.length) {
            return _.pluck(existingControllers, 'instance');
        }
        return false;
    };
    Base.deleteController = function (obj) {
        var uname = Base.getUname(obj);
        var controllersToBeRemoved = _.where(Base.ControllerStack,{name: uname});
        Base.ControllerStack = _.reject(Base.ControllerStack, function (stack) {
            return stack.name == uname;
        });
        var removeStackObject = function(stackObject){
            stackObject["instance"].off();
            for( var properties in stackObject['instance']){
                if(
                    typeof stackObject['instance'][properties].promise !="undefined"
                        && typeof stackObject['instance'][properties].resolve != 'undefined') {
                    stackObject['instance'][properties].reject();
                }
            }
            if(stackObject['instance'].stopListening){
                stackObject['instance'].stopListening();
            }
            stackObject['instance'] = null;
            delete stackObject['instance'];
            delete stackObject;
        };
        _.each(controllersToBeRemoved, function (stackObject) {
            var returnValue = stackObject['instance'].beforeRemove.apply(stackObject['instance']);
            if(returnValue &&
                typeof returnValue == "object" &&
                returnValue.promise !="undefined" &&
                returnValue.resolve != 'undefined'
            ) {
                returnValue.done(function(){
                    removeStackObject(stackObject);
                });
            } else {
                removeStackObject(stackObject);
            }
        });
        return true;
    };
    Base.getAllControllers = function () {
        return _.pluck(Base.ControllerStack, "instance");
    }

    /**
     *
     * @param views
     * @param context
     * @returns {*}
     */
    Base.getViews = function (views, context) {
        var viewDeferred = $.Deferred();
        var paths = [];
        _.each(views, function (vie) {
            var module = vie.module,
                view_name = vie.name;
            if (vie["removeOld"]) {
                Base.deleteView(vie);
            }
            paths.push( Base.appBasePath + 'modules/' + module + "/views/" + view_name);
        });
        require(paths, function () {
            var returnData = [];
            for (var i = 0; i < arguments.length; i++) {
                var name = Base.getUname(views[i]);
                var options = typeof views[i]['options'] == 'object' ? views[i]['options'] : {};
                var viewInstance = new arguments[i](options);
                var removeOld = views[i] && typeof views[i]['removeOld'] == 'boolean' ? views[i]['removeOld'] : false;
                if(removeOld){
                    Base.deleteView(views[i]);
                }
                viewInstance.subViews = {};
                returnData.push(viewInstance);
                if (!views[i].subView) {
                    var viewObj = {
                        name: name,
                        instance: viewInstance
                    };
                    Base.ViewStack.push(viewObj);
                }
            }
            viewDeferred.resolve.apply(context, returnData);
        });
        return viewDeferred;
    };
    /**
     *
     * @param Array
     * @returns {*}
     */
    Base.getViewInstance = function (obj) {
        var uname = Base.getUname(obj);
        if (!uname) {
            throw "Invalid Parameters. Please provide Module & View name OR uname";
        }
        var existingViews = _.where(Base.ViewStack, {'name': uname});
        if (existingViews.length == 1) {
            return _.first(existingViews)["instance"];
        } else if (existingViews.length > 1) {
            throw "Multiple Instance of the required view exists. Please try getControllerInstances for all controllers";
        }
        return false;
    };
    Base.getViewInstances = function (obj) {
        var uname = Base.getUname(obj);
        if (!uname) {
            throw "Invalid Parameters. Please provide Module & View name OR uname";
        }
        var existingViews = _.where(Base.ViewStack, {'name': uname});
        if (existingViews.length) {
            return _.pluck(existingViews, 'instance');
        }
        return false;
    };
    Base.deleteView = function (obj) {
        var uname = Base.getUname(obj);
        var viewsToBeRemoved = _.where(Base.ViewStack, {name: uname});
        Base.ViewStack = _.reject(Base.ViewStack, function (stack) {
            return stack.name == uname;
        });
        var removeStackObject = function(stackObject){
            if (typeof stackObject["instance"].removeAll == 'function') {
                stackObject["instance"].removeAll.apply(stackObject["instance"]);
            }
            stackObject["instance"].stopListening();
            delete stackObject;
        };
        _.each(viewsToBeRemoved, function (stackObject) {
            if (typeof stackObject["instance"].beforeRemove == 'function') {
                var returnValue = stackObject["instance"].beforeRemove.apply(stackObject["instance"]);
                if(returnValue &&
                    typeof returnValue == "object" &&
                    returnValue.promise !="undefined" &&
                    returnValue.resolve != 'undefined'
                ){
                    returnValue.done(function(){
                        removeStackObject(stackObject);
                    });
                } else {
                    removeStackObject(stackObject);
                }
            } else {
                removeStackObject(stackObject);
            }
        });
        return true;
    };
    Base.getAllViews = function () {
        return _.pluck(Base.ViewStack, "instance");
    };

    /**
     * Create the model stack to monitor number of models asked for
     * @param models
     * @param context
     * @returns {*}
     */
    Base.getModels = function (models, context) {
        var modelDeferred = $.Deferred();
        var paths = [];
        _.each(models, function (mod) {
            var module = mod.module,
                model_name = mod.name;
            if (mod["removeOld"]) {
                Base.deleteModel(mod);
            }
            paths.push(Base.appBasePath + 'modules/' + module + "/entities/" + model_name);
        });
        require(paths, function () {
            var returnData = [];
            for (var i = 0; i < arguments.length; i++) {
                var name = Base.getUname(models[i]);
                if (!arguments[i]["model"]) {
                    throw "Requested Entity: MODULE-" + models[i]['module'] + " NAME:-" + models[i]['name'] + " does not contain model reference";
                }
                var options = typeof models[i]['options'] == 'object' ? models[i]['options'] : {};
                var removeOld = models[i] && typeof models[i]['removeOld'] == 'boolean' ? models[i]['removeOld'] : false;
                if(removeOld){
                    Base.deleteModel(models[i]);
                }
                var modelClass = arguments[i]["model"];
                var modelInstance = new modelClass(options);
                returnData.push(modelInstance);
                var modelObj = {
                    name: name,
                    instance: modelInstance
                };
                Base.ModelStack.push(modelObj);
            }
            modelDeferred.resolve.apply(context, returnData);
        });
        return modelDeferred;
    };
    /**
     * Get Model Instance
     * @param {}
     * @returns {*}
     */
    Base.getModelInstance = function (obj) {
        var uname = Base.getUname(obj);
        if (!uname) {
            throw "Invalid Parameters. Please provide Module & View name OR uname";
        }
        var existingModels = _.where(Base.ModelStack, {'name': uname});
        if (existingModels.length == 1) {
            return _.first(existingModels)["instance"];
        } else if (existingModels.length > 1) {
            throw "Multiple Instance of the required model (uanme: '"+ uname +"')exists. Please try getModelInstances for all models";
        }
        return false;
    };
    Base.getModelInstances = function (obj) {
        var uname = Base.getUname(obj);
        if (!uname) {
            throw "Invalid Parameters. Please provide Module & View name OR uname";
        }
        var existingModels = _.where(Base.ModelStack, {'name': uname});
        if (existingModels.length) {
            return _.pluck(existingModels, 'instance');
        }
        return false;
    };
    Base.deleteModel = function (obj) {
        var uname = Base.getUname(obj);
        var modelsToBeRemoved = _.where(Base.ModelStack, {name: uname});
        Base.ModelStack = _.reject(Base.ModelStack, function (stack) {
            return stack.name == uname;
        });
        _.each(modelsToBeRemoved, function (stackObject) {
            modelsToBeRemoved.stopListening();
            delete stackObject;
        });
        return true;
    };
    Base.getAllModels = function () {
        return _.pluck(Base.ModelStack, "instance");
    };

    /**
     *
     * @param collections
     * @param context
     * @returns {*}
     */
    Base.getCollections = function (collections, context) {
        var collectionDeferred = $.Deferred();
        var paths = [];
        _.each(collections, function (col) {
            var module = col.module,
                collection_name = col.name;
            if (col["removeOld"]) {
                Base.deleteCollection(col);
            }
            paths.push(Base.appBasePath + 'modules/' + module + "/entities/" + collection_name);
        });
        require(paths, function () {
            var returnData = [];
            for (var i = 0; i < arguments.length; i++) {
                var name = Base.getUname(collections[i]);
                if (!arguments[i]["collection"]) {
                    throw "Requested Entity: MODULE-" + collections[i]['module'] + " NAME:-" + collections[i]['name'] + " does not contain collection reference";
                }
                var options = typeof collections[i]['options'] == 'object' ? collections[i]['options'] : [];
                var removeOld = collections[i] && typeof collections[i]['removeOld'] == 'boolean' ? collections[i]['removeOld'] : false;
                if(removeOld){
                    Base.deleteCollection(collections[i]);
                }
                var collectionClass = arguments[i]["collection"];
                var collectionInstance = new collectionClass(options);
                returnData.push(collectionInstance);
                var collectionObj = {
                    name: name,
                    instance: collectionInstance
                };
                Base.CollectionStack.push(collectionObj);
            }
            collectionDeferred.resolve.apply(context, returnData);
        });
        return collectionDeferred;
    };
    /**
     * Get Collection Instance
     * @param {}
     * @returns {*}
     */
    Base.getCollectionInstance = function (obj) {
        var uname = Base.getUname(obj);
        if (!uname) {
            throw "Invalid Parameters. Please provide Module & View name OR uname";
        }
        var existingCollections = _.where(Base.CollectionStack, {'name': uname});
        if (existingCollections.length == 1) {
            return _.first(existingCollections)["instance"];
        } else if (existingCollections.length > 1) {
            throw "Multiple Instance of the required collection exists. Please try getCollectionInstances for all collections";
        }
        return false;
    };
    Base.getCollectionInstances = function (obj) {
        var uname = Base.getUname(obj);
        if (!uname) {
            throw "Invalid Parameters. Please provide Module & View name OR uname";
        }
        var existingCollections = _.where(Base.CollectionStack, {'name': uname});
        if (existingCollections.length) {
            return _.pluck(existingCollections, 'instance');
        }
        return false;
    };
    Base.deleteCollection = function (obj) {
        var uname = Base.getUname(obj);
        var collectionsToBeRemoved = _.where(Base.CollectionStack, {name: uname});
        Base.CollectionStack = _.reject(Base.CollectionStack, function (stack) {
            return stack.name == uname;
        });
        _.each(collectionsToBeRemoved, function (stackObject) {
            delete stackObject;
        });
        return true;
    };
    Base.getAllCollections = function () {
        return _.pluck(Base.CollectionStack, "instance");
    };

    Base.urlSerializer = function (obj) {
        var str = [];
        for (var p in obj)
            if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        return str.join("&");
    };
    Base.getBaseUrl = function(){
        return Backbone.history.location.protocol + "//" + Backbone.history.location.host;
    };
    Base.getAPIUrl = function(url){
        return Base.config.globals.protocol + "://" + Base.config.globals.apiUrl + url;
    };
    Base.getUrl = function (obj) {
        var module = typeof obj['module'] != "undefined" && typeof obj['module'] === 'string' ? obj['module'] : false;
        var route = typeof obj['route'] != "undefined" && typeof obj['route'] === 'string' ? obj['route'] : false;
        var params = typeof obj['params'] != "undefined" && typeof obj['params'] === 'object' ? obj['params'] : {};
        var add_host = typeof obj['add_host'] != "undefined" && typeof obj['add_host'] === "boolean" ? obj['add_host'] : true;
        var newParams = {};
        for(value in params){
            if(params[value]!=""){
                newParams[value] = params[value];
            }
        }
        params = newParams;
        if (!module) {
            throw "Invalid Module/Route-Name Provided";
        }
        var moduleRouter = _.where(Base.RouterStack, {name: module});
        if (!moduleRouter) {
            throw ":: MODULE:" + module + " does not exists.";
        }
        moduleRouter = _.first(moduleRouter);
        var routerBase = '';
        if (typeof moduleRouter.instance.baseUrl == 'string') {
            var routerBase = String(moduleRouter.instance.baseUrl);
        }
        var protocol = Base.config.globals.protocol;
        var host = Backbone.history.location.host;
        var query = Base.urlSerializer(params);
        var url = '';
        if(add_host) {
            url += protocol + "://" + host;
        }
        url += ( routerBase !== "" ? "/" + routerBase : "" ) + ( route !== "" ? "/" + route : "" ) + ( query !== "" ? "?" + query : "" );
        return url;
    };

    /**
     *  Get Modal for showing a popupbox
     * @param view
     * @param selfResize
     * @param context
     * @returns {*}
     */
    Base.getModal = function (view, selfResize, context) {
        var selfResize = selfResize ? Boolean(selfResize) : false;
        var def = $.Deferred();
        context = context ? context : Base;
        if (!view instanceof Base.View) {
            throw "Invalid View Provided for Modal Box";
        }
        var modalObj = {module: 'standard', name: 'modal', removeOld: true, options:{self_resize:selfResize}};
        var modalView = Base.getViewInstance(modalObj);
        if(!modalView){
            Base.getViews([
                    modalObj
                ], Base).done(function (modalView) {
                    modalView.setView(view);
                    def.resolveWith(context, [modalView]);
                });
        } else {
            modalView.setView(view);
            def.resolveWith(context, [modalView]);
        }
        return def;
    };
    Base.BrowserDetect =
    {
        init: function () {
            this.browser = this.searchString(this.dataBrowser) || "Other";
            this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "Unknown";
        },

        searchString: function (data) {
            for (var i = 0; i < data.length; i++) {
                var dataString = data[i].string;
                this.versionSearchString = data[i].subString;

                if (dataString.indexOf(data[i].subString) != -1) {
                    return data[i].identity;
                }
            }
        },

        searchVersion: function (dataString) {
            var index = dataString.indexOf(this.versionSearchString);
            if (index == -1) return;
            return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
        },
        dataBrowser: [
            { string: navigator.userAgent, subString: "Chrome", identity: "Chrome" },
            { string: navigator.userAgent, subString: "MSIE", identity: "Explorer" },
            { string: navigator.userAgent, subString: "Firefox", identity: "Firefox" },
            { string: navigator.userAgent, subString: "Safari", identity: "Safari" },
            { string: navigator.userAgent, subString: "Opera", identity: "Opera" }
        ]
    };
    Base.BrowserDetect.init();

    /**
     * EXTRA METHODS NOT INCLUDED FOR FUTURE USE
     */
    Base.niceScroll = function(element){
        if(typeof element != 'object'){
            element = $(element);
        }
        var niceScroll = element.getNiceScroll();
        if(niceScroll && niceScroll.length){
            niceScroll.hide();
            niceScroll.remove();

        }
        element.niceScroll({
            autohidemode: false
        });
    };
    Base.MessageStack = new Array();
    Base.setMessage = function(key, value, options){
        options= options || {};
        var replace = typeof options['replace'] != "undefined" ? Boolean(options['replace']) : false;
        var obj = _.where(Base.MessageStack,{key: key});
        if(obj.length){
            if(!replace){
                throw "Error key: " + key + " already exists. To replace its value please use format" +
                    " setMessage(key,value,{replace:true})";
            }
            obj[0].value = value;
        } else {
            obj = {key: key,value: value};
            Base.MessageStack.push(obj);
        }
        return true;
    };
    Base.getMessage = function(key, defaultValue){
        defaultValue = typeof defaultValue != "undefined" ? defaultValue : false;
        var obj = _.where(Base.MessageStack,{key: key});
        if(obj.length){
            return obj[0].value;
        }
        return defaultValue;
    };
    Base.deleteMessage = function(key){
        var obj = _.where(Base.MessageStack,{key: key});
        if(obj.length){
            Base.MessageStack = _.filter(Base.MessageStack, function(stackItem){
                stackItem.key != key;
            });
            return true;
        }
        return false;
    };
    return Base;
});