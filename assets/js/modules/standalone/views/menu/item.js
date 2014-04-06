define(['base','text!' + Base.appBasePath + 'modules/standalone/templates/menu/item.html'],function(Base,template){
    var v = Base.View.extend({
        template: _.template(template),
        events: {
            'click' : 'addToCart'
        },
        render: function(){
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },
        addToCart: function(){
            alert("I know you want to EAT ME! but can you please wait till the chef make me?");
        }
    });
    return v;
});