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
                    container.append(categoryView.render().el);
                    if(typeof category.itemCollection != "undefined") {
                        
                    }
                });
            },this);
        }
    });
    return v;
});