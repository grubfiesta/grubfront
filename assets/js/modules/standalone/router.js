define(['base'], function (Base) {
    var Route = Base.Router.extend({
        routes: {
            '': 'menu'
        },
        menu: function () {
            this.loadLayout('standalone');
            this.layoutLoading.done(function () {
                Base.getControllers([{module: 'standalone',name: 'index'}],this).done(function(indexController){
                    indexController.dispatch().done(function(){
                        this.loadMenu();
                    });
                });
            });
        }
    });
    return Route;
});