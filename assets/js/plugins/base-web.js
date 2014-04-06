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
    Base.$window = $(window);
    Base.$document = $(document);
    Base.windowLastScrollTop = Base.$window.scrollTop();
    Base.windowScrolledUp = false;
    Base.$window.on('scroll',function(){
        var windowScrollTop = Base.$window.scrollTop();
        if (windowScrollTop > Base.windowLastScrollTop){
            Base.windowScrolledUp = false;
        } else {
            Base.windowScrolledUp = true;
        }
        Base.windowLastScrollTop = windowScrollTop;
    });
    Base.initWindow = function(){
        Base.windowHeight = Base.$window.height();
        Base.documentHeight = Base.$document.height();
    };
    Base.initWindow();
    Base.$window.on('resize',function(){
        Base.initWindow();
    });
    Base.previousDocumentHeight = Base.$document.height();
    setInterval(function(){
        var currentDocumentHeight = Base.$document.height();
        if(currentDocumentHeight != Base.previousDocumentHeight){
            Base.initWindow();
            Base.previousDocumentHeight = currentDocumentHeight;
            Base.trigger('change:document-height');
        }
    },100);

    Base.hashString = function(string){
        if (Array.prototype.reduce){
            return string.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
        }
        var hash = 0;
        if (string.length === 0) return hash;
        for (var i = 0; i < string.length; i++) {
            var character  = string.charCodeAt(i);
            hash  = ((hash<<5)-hash)+character;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
    Base.manageScroll = function(options){
        var selector = typeof options['selector'] != 'undefined'? options['selector']:false;
        var $element = $(selector);
        if(!selector || typeof selector != 'string'|| !$element.length){
            return false;
        }
        var initialTop = $element.offset().top;
        var topStop = typeof options['topStop'] != 'undefined' ? options['topStop']: $element.offset().top;
        var bottomStop = typeof options['bottomStop'] != 'undefined' ? options['bottomStop']: Base.$document.height();
        var hash = Base.hashString(selector);
        var padding = 10;
        hash = hash < 0? ( hash * (-1)): hash;
        var time = (new Date).getTime();

        $element.bottomReached = false;
        $element.topReached = false;
        $element.elementBottomReached = false;

        var scroller = _.throttle(function(){
            var elementTop = $element.offset().top;
            var elementHeight = $element.height();
            var elementBottom = elementTop + elementHeight;
            var windowScrollTop = Base.$window.scrollTop();
            var bottomReached = elementBottom >= bottomStop;
            var topReached = elementTop < topStop;
            Base.windowHeight = $(window).height();
            Base.documentHeight = $(document).height();
            console.log(bottomStop-elementHeight- initialTop);
            if( Base.windowHeight >= $element.height() ){
                if(!$element.bottomReached){
                    if(elementTop <= windowScrollTop){
                        $element.css({position: 'fixed'});
                    }
                    if(topReached){
                        $element.css({position: 'absolute'});
                    }
                } else {
                    if(windowScrollTop - padding < elementTop){
                        $element.css({position: 'fixed',top:0});
                        $element.bottomReached = false;
                    }
                }
            } else {
                if(Base.windowScrolledUp) {

                } else {

                }
                /*if($element.elementTopReached && elementTop >= windowScrollTop && !Base.windowScrolledUp && !topReached) {
                    $element.css({position: 'absolute',top: windowScrollTop - initialTop});
                    $element.elementTopReached = false;
                }
                if(!$element.bottomReached && $element.elementBottomReached && Base.windowScrolledUp){
                    var top = windowScrollTop - (elementHeight - Base.windowHeight);
                    $element.css({position: 'absolute',top:top - initialTop + padding});
                    $element.elementBottomReached = false;
                } else {
                    if(!$element.bottomReached && !$element.elementTopReached){
                        var elementBottomReached = (elementBottom + padding) <= windowScrollTop + Base.windowHeight;
                        if(elementBottomReached) {
                            var fixedTop = Base.windowHeight - elementHeight - padding;
                            $element.css({position: 'fixed',top: fixedTop});
                            $element.elementBottomReached = true;
                        } else {
                            $element.elementBottomReached = false;
                        }
                        if(topReached){
                            $element.css({position: 'absolute'});
                        }
                        if(bottomReached) {
                            $element.css({position: 'absolute',top: bottomStop-elementHeight- initialTop });
                            $element.bottomReached = true;
                        }
                    } else {
                        if(windowScrollTop - padding < elementTop){
                            $element.css({position: 'fixed',top:0});
                            $element.bottomReached = false;
                        }
                    }
                    var elementTopReached = (elementTop) >= windowScrollTop;
                    if(elementTop > topStop && elementTopReached && Base.windowScrolledUp) {
                        $element.css({position: 'fixed',top: 0});
                        $element.elementTopReached = true;
                    } else {
                        $element.elementTopReached = false;
                    }
                }*/
            }
        },10);
        var functionName = 'scroller_' + hash;
        var interval = "interval_" + functionName;
        if(typeof this[functionName] == 'function'){
            Base.$window.off("scroll",this[functionName]);
            clearInterval(this[interval]);
        }
        this[functionName] = scroller;
        Base.$window.off("scroll",this[functionName]);
        Base.$window.on("scroll",this[functionName]);
        var  self = this;
        this[interval] =  setInterval(function(){
            if(!$(selector).length){
                console.log('clearingElement in interval');
                Base.$window.off("scroll",this[functionName]);
                clearInterval(self[interval]);
            }
        },1000);
    };
});