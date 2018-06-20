
Polymer({
    is: "paper-toolbar",
    hostAttributes: {
        role: "toolbar"
    },
    properties: {
        bottomJustify: {
            type: String,
            value: ""
        },
        justify: {
            type: String,
            value: ""
        },
        middleJustify: {
            type: String,
            value: ""
        }
    },
    attached: function() {
        this._observer = this._observe(this), this._updateAriaLabelledBy()
    },
    detached: function() {
        this._observer && this._observer.disconnect()
    },
    _observe: function(t) {
        var e = new MutationObserver(function() {
            this._updateAriaLabelledBy()
        }.bind(this));
        return e.observe(t, {
            childList: !0,
            subtree: !0
        }), e
    },
    _updateAriaLabelledBy: function() {
        for (var t, e = [], i = Polymer.dom(this.root).querySelectorAll("content"), r = 0; t = i[r]; r++)
            for (var s, o = Polymer.dom(t).getDistributedNodes(), a = 0; s = o[a]; a++)
                if (s.classList && s.classList.contains("title"))
                    if (s.id) e.push(s.id);
                    else {
                        var l = "paper-toolbar-label-" + Math.floor(1e4 * Math.random());
                        s.id = l, e.push(l)
                    }
        e.length > 0 && this.setAttribute("aria-labelledby", e.join(" "))
    },
    _computeBarExtraClasses: function(t) {
        return t ? t + ("justified" === t ? "" : "-justified") : ""
    }
});
