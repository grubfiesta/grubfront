define(['base'],function(Base){
    var v = Base.View.extend({
        className: 'col-xs-12',
        render: function(){
            this.$el.html('<h3>'+ this.model.get('category_name') +'</h3><div class="row"></div>');
            return this;
        },
        renderItems: function(items){
            var def = $.Deferred();
            var container = this.$el.find(".row");
            var  i = 0;
            items.each(function(item){
                var itemViewObj = {
                    module: 'standalone',
                    name: 'menu/item',
                    uname: 'standalone.menu/item' + item.get('id'),
                    removeOld: true,
                    options: {
                        model: item
                    }
                };
                var itemView = Base.getViewInstance(itemViewObj);
                if(!itemView){
                    Base.getViews([itemViewObj],this).done(function(itemView){
                        container.append(itemView.render().el);
                        def.notify("loaded");
                    });
                } else {
                    container.append(itemView.render().el);
                    def.notify("loaded");
                }
            },this);
            def.progress(function(){
                i++;
                if(i == items.length) {
                    def.resolve();
                }
            });
            return def;
        }
    });
    return v;
})