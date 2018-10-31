/*
 * jQuery ui dropppable Plugin
 * https://github.com/maxazan/jquery-ui-droppable-iframe
 *
 * Copyright 2015, Pomazan Maksym
 * Licensed under the MIT licenses.
 */

//Save native prepareOffsets method from ddmanager
var nativePrepareOffsets = $.ui.ddmanager.prepareOffsets;

//Overrided prepareOffsets method
$.ui.ddmanager.prepareOffsets = function(t, event) {
    //Call parent method
    nativePrepareOffsets.apply(this, arguments);

    var m = $.ui.ddmanager.droppables[t.options.scope] || [];

    for (i = 0; i < m.length; i++) {

        //Iframe fixes        
        if ((doc = m[i].document[0]) !== document) {
            var iframe = $((doc.defaultView || doc.parentWindow).frameElement);
            var iframeOffset = iframe.offset();
            var el = m[i].element;

            //Check our droppable element is in the viewport of out iframe
            var viewport = {
                top: iframe.contents().scrollTop(),
                left: iframe.contents().scrollLeft()
            };
            viewport.right = viewport.left + iframe.width();
            viewport.bottom = viewport.top + iframe.height();

            var bounds = el.offset();
            bounds.right = bounds.left + el.outerWidth();
            bounds.bottom = bounds.top + el.outerHeight();
            if (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom)) {
                //In view port
                var ytop = bounds.top - iframe.contents().scrollTop();
                ytop = ytop < 0 ? 0 : ytop;
                var xtop = bounds.left - iframe.contents().scrollLeft();
                xtop = xtop < 0 ? 0 : xtop;
                var ybottom = bounds.top + el.height() - iframe.contents().scrollTop();
                ybottom = ybottom > iframe.height() ? iframe.height() : ybottom;
                var xbottom = bounds.left + el.width() - iframe.contents().scrollLeft();
                xbottom = xbottom > iframe.width() ? iframe.width() : xbottom;
                m[i].offset.top = iframeOffset.top + ytop;
                m[i].offset.left = iframeOffset.left + xtop;
                m[i].proportions({
                    width: xbottom - xtop,
                    height: ybottom - ytop,
                });

            } else {
                //Out of view port - skip
                m[i].proportions().height = 0;
                continue;
            }

        }

    }
};

$.ui.plugin.add("draggable", "iframeScroll", {
    drag: function(event, ui, i) {

        var o = i.options;
        var selector = o.iframeFix === true ? "iframe" : o.iframeFix;

        //check if mouse in scroll zone
        i.document.find(selector).each(function() {

            var scrolled = false;
            var iframeDocument;
            var iframe = $(this);
            var offset = iframe.offset();
            offset.width = iframe.width();
            offset.height = iframe.height();
            //Check scroll top
            if (offset.left < event.pageX && event.pageX < offset.left + offset.width) {
                if (offset.top < event.pageY && event.pageY < offset.top + o.scrollSensitivity) {
                    iframeDocument = iframe.contents();
                    scrolled = iframeDocument.scrollTop(iframeDocument.scrollTop() - o.scrollSpeed);
                }
            }
            //Check scroll down
            if (offset.left < event.pageX && event.pageX < offset.left + offset.width) {
                if ((offset.top + offset.height - o.scrollSensitivity) < event.pageY && event.pageY < offset.top + offset.height) {
                    iframeDocument = iframe.contents();
                    scrolled = iframeDocument.scrollTop(iframeDocument.scrollTop() + o.scrollSpeed);
                }
            }
            //Check scroll left
            if (offset.left < event.pageX && event.pageX < offset.left + o.scrollSensitivity) {
                if (offset.top < event.pageY && event.pageY < offset.top + offset.height) {
                    iframeDocument = iframe.contents();
                    scrolled = iframeDocument.scrollLeft(iframeDocument.scrollLeft() - o.scrollSpeed);
                }
            }
            //Check scroll right
            if ((offset.left + offset.width - o.scrollSensitivity) < event.pageX && event.pageX < offset.left + offset.width) {
                if (offset.top < event.pageY && event.pageY < offset.top + offset.height) {
                    iframeDocument = iframe.contents();
                    scrolled = iframeDocument.scrollLeft(iframeDocument.scrollLeft() + o.scrollSpeed);
                }
            }

            if (scrolled !== false && $.ui.ddmanager && !o.dropBehaviour) {
                $.ui.ddmanager.prepareOffsets(i, event);
            }

            clearTimeout(i.scrollTimer);
            if (i._mouseStarted) {
                i.scrollTimer = setTimeout(function() {
                    //call drag trigger
                    i._trigger("drag", event);
                    //update offsets
                    if ($.ui.ddmanager) {
                        $.ui.ddmanager.drag(i, event);
                    }
                }, 10);
            }


        });
    },
    stop: function(event, ui, i) {
        clearInterval(i.scrollTimer);
    }
});
