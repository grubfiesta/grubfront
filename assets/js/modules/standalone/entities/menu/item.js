define(['base'],function(Base){
    var ItemModel = Base.Model.extend({
        defaults: {
            'desc': ''
        }
    });
    var ItemCollection = Base.Collection.extend({
        model:ItemModel
    });
    return {
        model:ItemModel,
        collection:ItemCollection
    }
});