define(['base'],function(Base){
    var c = Base.Controller.extend({
        dispatch: function() {
            var def = $.Deferred();
            def.resolveWith(this);
            return def;
        },
        loadMenu: function(){
            Base.getControllers([{
                module: "standalone",
                name: "menu"
            }],this).done(function(menuController){
                    menuController.dispatch();
                });
        }
    });
    return c;
});