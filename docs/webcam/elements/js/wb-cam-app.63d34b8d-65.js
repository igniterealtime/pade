
! function() {
    "use strict";
    var t = 1,
        e = 2,
        s = {
            outerScroll: {
                scroll: !0
            },
            shadowMode: {
                standard: e,
                waterfall: t,
                "waterfall-tall": t
            },
            tallMode: {
                "waterfall-tall": !0
            }
        };
    Polymer({
        is: "paper-header-panel",
        properties: {
            mode: {
                type: String,
                value: "standard",
                observer: "_modeChanged",
                reflectToAttribute: !0
            },
            shadow: {
                type: Boolean,
                value: !1
            },
            tallClass: {
                type: String,
                value: "tall"
            },
            atTop: {
                type: Boolean,
                value: !0,
                notify: !0,
                readOnly: !0,
                reflectToAttribute: !0
            }
        },
        observers: ["_computeDropShadowHidden(atTop, mode, shadow)"],
        ready: function() {
            this.scrollHandler = this._scroll.bind(this)
        },
        attached: function() {
            this._addListener(), this._keepScrollingState()
        },
        detached: function() {
            this._removeListener()
        },
        get header() {
            return Polymer.dom(this.$.headerContent).getDistributedNodes()[0]
        },
        get scroller() {
            return this._getScrollerForMode(this.mode)
        },
        get visibleShadow() {
            return this.$.dropShadow.classList.contains("has-shadow")
        },
        _computeDropShadowHidden: function(o, l, a) {
            var r = s.shadowMode[l];
            this.shadow ? this.toggleClass("has-shadow", !0, this.$.dropShadow) : r === e ? this.toggleClass("has-shadow", !0, this.$.dropShadow) : r !== t || o ? this.toggleClass("has-shadow", !1, this.$.dropShadow) : this.toggleClass("has-shadow", !0, this.$.dropShadow)
        },
        _computeMainContainerClass: function(t) {
            var e = {};
            return e.flex = "cover" !== t, Object.keys(e).filter(function(t) {
                return e[t]
            }).join(" ")
        },
        _addListener: function() {
            this.scroller.addEventListener("scroll", this.scrollHandler, !1)
        },
        _removeListener: function() {
            this.scroller.removeEventListener("scroll", this.scrollHandler)
        },
        _modeChanged: function(t, e) {
            var o = s,
                l = this.header,
                a = 200;
            l && (o.tallMode[e] && !o.tallMode[t] ? (l.classList.remove(this.tallClass), this.async(function() {
                l.classList.remove("animate")
            }, a)) : this.toggleClass("animate", o.tallMode[t], l)), this._keepScrollingState()
        },
        _keepScrollingState: function() {
            var t = this.scroller,
                e = this.header;
            this._setAtTop(0 === t.scrollTop), e && this.tallClass && s.tallMode[this.mode] && this.toggleClass(this.tallClass, this.atTop || e.classList.contains(this.tallClass) && t.scrollHeight < this.offsetHeight, e)
        },
        _scroll: function() {
            this._keepScrollingState(), this.fire("content-scroll", {
                target: this.scroller
            }, {
                bubbles: !1
            })
        },
        _getScrollerForMode: function(t) {
            return s.outerScroll[t] ? this : this.$.mainContainer
        }
    })
}();

