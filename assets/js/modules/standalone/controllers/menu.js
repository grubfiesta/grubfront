define(['base'],function(Base){
    var c = Base.Controller.extend({
        dispatch: function() {
            this.loadMenuCollection().done(function(menuCollection){
                this.loadContainer().done(function(){
                    this.loadLeftMenu(menuCollection);
                    this.loadCenterMenu(menuCollection);
                });
            });
        },
        loadMenuCollection: function(){
            var menuCollectionObj = {
                module: 'standalone',
                name: 'menu/category',
                removeOld: true
            };
            var self = this;
            var def = $.Deferred();
            var categoryCollection = Base.getCollectionInstance(menuCollectionObj);
            if(!categoryCollection) {
                Base.getCollections([menuCollectionObj],this).done(function(categoryCollection){
                    categoryCollection.fetch().done(function(){
                        def.resolveWith(self,[categoryCollection]);
                    });
                });
            } else {
                def.resolveWith(self,[categoryCollection]);
            }
            return def;
        },
        loadContainer: function(){
            var containerObj = {
                    module: 'standalone',
                    name: 'menu/container',
                    removeOld: true
                },
                containerView = Base.getViewInstance({module: 'standalone', name: 'menu/container'}),
                def = $.Deferred();
            if (!containerView) {
                Base.getViews([containerObj], this).done(function (containerView) {
                    $(".menu-container").html(containerView.render().el);
                    def.resolveWith(this);
                });
            } else {
                $(".menu-container").html(containerView.render().el);
                def.resolveWith(this);
            }
            return def;
        },
        loadLeftMenu: function(categoryCollection){
            var leftViewObj = {
                    module: 'standalone',
                    name: 'menu/category-panel',
                    removeOld: true,
                    subView: true,
                    options: {
                        collection: categoryCollection
                    }
                },
                layout = Base.getViewInstance({module: 'standalone', name: 'menu/container'}),
                categoryPanel = layout.getSubView('category-panel');
            if (!categoryPanel) {
                Base.getViews([leftViewObj], this).done(function (categoryPanel) {
                    layout.setSubView(categoryPanel, 'category-panel');
                    layout.$('.category-panel').html(categoryPanel.render().el);
                    Base.manageScroll({
                        selector: '.category-panel'
                    })

                });
            } else {
                layout.$('.menu-left').html(categoryPanel.render().el);
            }
        },
        loadCenterMenu: function(categoryCollection){
            var centerViewObj = {
                    module: 'standalone',
                    name: 'menu/item-panel',
                    removeOld: true,
                    subView: true,
                    options: {
                        collection: categoryCollection
                    }
                },
                layout = Base.getViewInstance({module: 'standalone', name: 'menu/container'}),
                itemPanel = layout.getSubView('item-panel');
            if (!itemPanel) {
                Base.getViews([centerViewObj], this).done(function (itemPanel) {
                    layout.setSubView(itemPanel, 'item-panel');
                    layout.$('.items-panel').html(itemPanel.render().el);
                    itemPanel.renderCategories(itemPanel.collection,itemPanel.$el);

                });
            } else {
                layout.$('.items-panel').html(itemPanel.render().el);
                itemPanel.renderCategories(itemPanel.collection,itemPanel.$el);
            }
        }
    });
    return c;
});