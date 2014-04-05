define(['base'],function(Base){
    var v = Base.View.extend({
        tagName: "div",
        render: function(){
            this.$el.html(this.renderCategories(this.collection));
            return this;
        },
        renderCategories: function(categories){
            var content = "<ul>";
            categories.each(function(category){
                content +=  "<li>" + category.get('category_name');
                if(typeof category.subCategories != "undefined"){
                    content += this.renderCategories(category.subCategories);
                }
                content += "</li>";
            },this);
            content += "</ul>"
            return content;
        }
    });
    return v;
});