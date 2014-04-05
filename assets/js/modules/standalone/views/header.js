define(['base','text!' + Base.appBasePath +'modules/standalone/templates/header.html'],function(Base, template){
    var v = Base.View.extend({
        template: _.template(template),
        className: "row",
        render: function(){
            this.$el.html(this.template());
            return this;
        }
    });
    return v;
});