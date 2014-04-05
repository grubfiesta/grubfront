define(['base'],function(Base){
    var ItemModel = Base.Model.extend();
    var ItemCollection = Base.Collection.extend({
        model:ItemModel
    });
    return {
        model:ItemModel,
        collection:ItemCollection
    }
});