define(['base'],function(Base){
    var v = Base.View.extend({
        className: 'col-xs-12',
        render: function(){
            this.$el.html('<h3>'+ this.model.get('category_name') +'</h3><div class="row"></div>');
            return this;
        },
        renderItems: function(items){
            var container = this.$el.find(".row");
            items.each(function(item){
                var itemViewObj = {
                    module: 'standalone',
                    name: 'menu/item',
                    uname: 'standalone.menu/item' + item.get('id'),
                    removeOld: true
                };
                var itemView = Base.getViewInstance(itemViewObj);
                if(!itemView){
                    Base.getViews([itemViewObj],function(itemView){
                        container.append(itemView.render().el);
                    });
                } else {
                    container.append(itemView.render().el);
                }
            },this);
        }
    });
    return v;
})