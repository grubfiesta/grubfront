define(['base','text!' + Base.appBasePath + 'modules/standalone/templates/menu/item.html'],function(Base,template){
    var v = Base.View.extend({
        template: _.template(template),
        render: function(){
            this.$el.html(this.template());
            return this;
        }
    });
    return v;
});