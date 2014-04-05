define([], function () {
    return {
        require: {
            baseUrl: "/",
            waitSeconds: 300,
            paths: {
                'jquery': Base.appBasePath  + 'libs/jquery-2.1.0.min',
                'underscore': Base.appBasePath  + 'libs/underscore-min',
                'text': Base.appBasePath  + 'libs/text',
                'backbone': Base.appBasePath  + 'libs/backbone-min',
                'backbone-query': Base.appBasePath  + 'libs/backbone-query.min',
                'jstorage': Base.appBasePath  + 'libs/jstorage.min',
                'messages': Base.appBasePath  + 'plugins/messages',
                'cajax': Base.appBasePath  + 'libs/jquery.xdomainrequest.min',
                'isotope': Base.appBasePath  + 'libs/jquery.isotope.min'
            },
            shim: {
                'underscore': {
                    exports: "_"
                },
                'backbone': {
                    deps: ['underscore', 'jquery', 'cajax'],
                    exports: "Backbone"
                },
                'cajax': {
                    deps: ['jquery']
                },
                'backbone-query': {
                    deps: ['backbone']
                },
                'jstorage': {
                    deps: ['jquery'],
                    exports: 'jStorage'
                }
            }
        },
        globals: {
            'protocol': 'http',
            //'apiUrl': 'services.munchado.biz/wapi',
            //'apiUrl': 'munchapi.hungrybuzz.info/wapi',
            'apiUrl': 'munch-local.com/wapi',
            'searchImageBaseUrl': '',
            'appBaseUrl': window.appBaseUrl
        }
    };
});
