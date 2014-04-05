define(['base', Base.appBasePath + 'modules/standalone/entities/menu/item'],function(Munch, Item){
    var categoryModel = Munch.Model.extend({
        initialize: function(response) {
            if(response["sub_categories"].length) {
                this.subCategories = new categoryCollection(response["sub_categories"]);
            } else {
                this.itemCollection = new Item.collection(response["category_items"]);
            }
        }
    });

    var categoryCollection = Munch.Collection.extend({
        model: categoryModel,
        url: function(){
            return "/menu.json";
        },
        parse: function(response){
            return response['menu'];
        }
    });
    return {
        model: categoryModel,
        collection: categoryCollection
    }
});