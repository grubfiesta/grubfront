define(['base'],function(Base){
    var v = Base.View.extend({
        tagName: "div",
        className: 'row',
        render: function(){
            return this;
        },
        renderCategories: function(categories,container){
            categories.each(function(category){
                var categoryViewObj = {
                    module: 'standalone',
                    name: 'menu/item-category',
                    uname: 'standalone.menu/item-category' + category.get('category_id'),
                    options: {
                        model: category
                    },
                    removeOld: true
                }
                Base.getViews([categoryViewObj],this).done(function(categoryView){
                    categoryView.render();
                    container.append(categoryView.render().el);
                    if(typeof category.itemCollection != "undefined") {
                        categoryView.renderItems(category.itemCollection).done(function(){
                            container.append(categoryView.el);
                        });
                    } else {
                        this.renderCategories(category.subCategories,categoryView.$el);
                        container.append(categoryView.el);
                    }
                });
            },this);
        }
    });
    return v;
});