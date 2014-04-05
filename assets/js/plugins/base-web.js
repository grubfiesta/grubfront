define(['base'],function(Base){
    Base.parseDate = function(date){
        var dummyDate = new Date(date);
        if(Object.prototype.toString.call(dummyDate) === "[object Date]" && !isNaN(dummyDate.getTime())){
            return dummyDate;
        }
        if(typeof date == 'string'){
            date = date.replace(/\-/g,'/');
        }
        return new Date(date);
    };

    Base.truncateText = function(text,length){
        if(!length){
            return text;
        }
        if(text.length < length){
            return text;
        }
        return text.slice(0,length) + "...";
    };

    /**
     * Ultimate solution for highlighting
     * http://stackoverflow.com/a/3241437/851354
     * @param text
     * @returns {replace|*|XML|string|void}
     */
    RegExp.escape = function(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };

    Base.highlight = function (term, base) {
        if (!term) return;
        base = base || document.body;
        var re = new RegExp("(" + RegExp.escape(term) + ")", "gi"); //... just use term
        $("*", base).contents().each( function(i, el) {
            if (el.nodeType === 3) {
                var data = el.data;
                var index = data.toLowerCase().indexOf(term.toLowerCase());
                if(index >=0 ){
                    var subData = data.substr(index,term.length);
                    var replacement = "<span class='highlight'>"+subData+"</span>";
                    if (data = data.replace(re, replacement)) {
                        var wrapper = $("<span>").html(data);
                        $(el).before(wrapper.contents()).remove();
                    }
                }
            }
        });
    };

    Base.dehighlight = function (term, base) {
        var text = document.createTextNode(term);
        $('span.highlight', base).each(function () {
            this.parentNode.replaceChild(text.cloneNode(false), this);
        });
    };
    Base.paddLeft = function(str,char,length){
        if(str.length >= length) return str;
        var padding = char + "";
        for(var i =1;i<length;i++){
            padding += char;
        }
        var a = padding + str;
        return a.slice(-length);
    };
    Base.get24HourTime = function(time){
        var date = Base.parseDate('1970-01-01 ' + time,true);
        return Base.paddLeft(date.getHours(),0,2) + ":" + Base.paddLeft(date.getMinutes(),0,2);
    };
    Base.get12HourTime = function(time){
        var date = Base.parseDate('1970-01-01 ' + time);
        var hours = date.getHours();
        var isAM = hours >=12 ? false : true;
        hours = hours > 12 ? hours - 12: hours;
        hours = parseInt(hours,10) == 0 ? 12:hours;
        return Base.paddLeft(hours,0,2) + ":" + Base.paddLeft(date.getMinutes(),0,2) + " " + (isAM? "AM":"PM");
    };
    Base.weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    Base.months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    Base.getAssetsImageUrl = function(){
        return Base.config.globals.protocol + "://" + Base.config.globals.appBaseUrl + "/assets/images/";
    };
    Base.convertToString = function(object){
        var strCodedParams = '';
        _.each(object,function(value,key){
            strCodedParams += key + "=" + value + "&";
        });
        strCodedParams = strCodedParams.substring(0, strCodedParams.length - 1);
        return strCodedParams;
    };
});