define([], function () {
    var layout = function () {
        this.render = function (router) {
            if(!router || !router instanceof Base.Router){
                throw "Invalid router provided for layout"
            }
            var layout = this.layout = Base.getViewInstance({module: 'home', name: 'layout'});
            if (layout && layout['is_rendered']) {
                router.layoutLoading.resolveWith(router);
            } else {
                Base.getViews([
                        {module: 'standalone', name: 'layout', removeOld: true},
                        {module: 'standalone', name: 'header', removeOld: true}
                    ], this).done(function (layoutView, headerView) {
                        $("#wrapper").html(layoutView.render().el);
                        $("#header").html(headerView.render().el);
                        /**
                         * Tell the view that its rendered!
                         */
                        layoutView['is_rendered'] = true;
                        router.layoutLoading.resolveWith(router);
                    });
            }
        };
    }
    return layout;
});