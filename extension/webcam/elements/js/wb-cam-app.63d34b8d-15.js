
! function() {
    "use strict";

    function e(e) {
        var t = [];
        for (var i in e) e.hasOwnProperty(i) && e[i] && t.push(i);
        return t.join(" ")
    }
    var t = null;
    Polymer({
        is: "paper-drawer-panel",
        behaviors: [Polymer.IronResizableBehavior],
        properties: {
            defaultSelected: {
                type: String,
                value: "main"
            },
            disableEdgeSwipe: {
                type: Boolean,
                value: !1
            },
            disableSwipe: {
                type: Boolean,
                value: !1
            },
            dragging: {
                type: Boolean,
                value: !1,
                readOnly: !0,
                notify: !0
            },
            drawerWidth: {
                type: String,
                value: "256px"
            },
            edgeSwipeSensitivity: {
                type: Number,
                value: 30
            },
            forceNarrow: {
                type: Boolean,
                value: !1
            },
            hasTransform: {
                type: Boolean,
                value: function() {
                    return "transform" in this.style
                }
            },
            hasWillChange: {
                type: Boolean,
                value: function() {
                    return "willChange" in this.style
                }
            },
            narrow: {
                reflectToAttribute: !0,
                type: Boolean,
                value: !1,
                readOnly: !0,
                notify: !0
            },
            peeking: {
                type: Boolean,
                value: !1,
                readOnly: !0,
                notify: !0
            },
            responsiveWidth: {
                type: String,
                value: "768px"
            },
            rightDrawer: {
                type: Boolean,
                value: !1
            },
            selected: {
                reflectToAttribute: !0,
                notify: !0,
                type: String,
                value: null
            },
            drawerToggleAttribute: {
                type: String,
                value: "paper-drawer-toggle"
            },
            drawerFocusSelector: {
                type: String,
                value: 'a[href]:not([tabindex="-1"]),area[href]:not([tabindex="-1"]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]):not([tabindex="-1"]),textarea:not([disabled]):not([tabindex="-1"]),button:not([disabled]):not([tabindex="-1"]),iframe:not([tabindex="-1"]),[tabindex]:not([tabindex="-1"]),[contentEditable=true]:not([tabindex="-1"])'
            },
            _transition: {
                type: Boolean,
                value: !1
            }
        },
        listeners: {
            tap: "_onTap",
            track: "_onTrack",
            down: "_downHandler",
            up: "_upHandler",
            transitionend: "_onTransitionEnd"
        },
        observers: ["_forceNarrowChanged(forceNarrow, defaultSelected)", "_toggleFocusListener(selected)"],
        ready: function() {
            this._transition = !0, this._boundFocusListener = this._didFocus.bind(this)
        },
        togglePanel: function() {
            this._isMainSelected() ? this.openDrawer() : this.closeDrawer()
        },
        openDrawer: function() {
            requestAnimationFrame(function() {
                this.toggleClass("transition-drawer", !0, this.$.drawer), this.selected = "drawer"
            }.bind(this))
        },
        closeDrawer: function() {
            requestAnimationFrame(function() {
                this.toggleClass("transition-drawer", !0, this.$.drawer), this.selected = "main"
            }.bind(this))
        },
        _onTransitionEnd: function(e) {
            var t = Polymer.dom(e).localTarget;
            if (t === this && ("left" !== e.propertyName && "right" !== e.propertyName || this.notifyResize(), "transform" === e.propertyName && (requestAnimationFrame(function() {
                    this.toggleClass("transition-drawer", !1, this.$.drawer)
                }.bind(this)), "drawer" === this.selected))) {
                var i = this._getAutoFocusedNode();
                i && i.focus()
            }
        },
        _computeIronSelectorClass: function(t, i, r, n, a) {
            return e({
                dragging: r,
                "narrow-layout": t,
                "right-drawer": n,
                "left-drawer": !n,
                transition: i,
                peeking: a
            })
        },
        _computeDrawerStyle: function(e) {
            return "width:" + e + ";"
        },
        _computeMainStyle: function(e, t, i) {
            var r = "";
            return r += "left:" + (e || t ? "0" : i) + ";", t && (r += "right:" + (e ? "" : i) + ";"), r
        },
        _computeMediaQuery: function(e, t) {
            return e ? "" : "(max-width: " + t + ")"
        },
        _computeSwipeOverlayHidden: function(e, t) {
            return !e || t
        },
        _onTrack: function(e) {
            if (!t || this === t) switch (e.detail.state) {
                case "start":
                    this._trackStart(e);
                    break;
                case "track":
                    this._trackX(e);
                    break;
                case "end":
                    this._trackEnd(e)
            }
        },
        _responsiveChange: function(e) {
            this._setNarrow(e), this.selected = this.narrow ? this.defaultSelected : null, this.setScrollDirection(this._swipeAllowed() ? "y" : "all"), this.fire("paper-responsive-change", {
                narrow: this.narrow
            })
        },
        _onQueryMatchesChanged: function(e) {
            this._responsiveChange(e.detail.value)
        },
        _forceNarrowChanged: function() {
            this._responsiveChange(this.forceNarrow || this.$.mq.queryMatches)
        },
        _swipeAllowed: function() {
            return this.narrow && !this.disableSwipe
        },
        _isMainSelected: function() {
            return "main" === this.selected
        },
        _startEdgePeek: function() {
            this.width = this.$.drawer.offsetWidth, this._moveDrawer(this._translateXForDeltaX(this.rightDrawer ? -this.edgeSwipeSensitivity : this.edgeSwipeSensitivity)), this._setPeeking(!0)
        },
        _stopEdgePeek: function() {
            this.peeking && (this._setPeeking(!1), this._moveDrawer(null))
        },
        _downHandler: function(e) {
            !this.dragging && this._isMainSelected() && this._isEdgeTouch(e) && !t && (this._startEdgePeek(), e.preventDefault(), t = this)
        },
        _upHandler: function() {
            this._stopEdgePeek(), t = null
        },
        _onTap: function(e) {
            var t = Polymer.dom(e).localTarget,
                i = t && this.drawerToggleAttribute && t.hasAttribute(this.drawerToggleAttribute);
            i && this.togglePanel()
        },
        _isEdgeTouch: function(e) {
            var t = e.detail.x;
            return !this.disableEdgeSwipe && this._swipeAllowed() && (this.rightDrawer ? t >= this.offsetWidth - this.edgeSwipeSensitivity : t <= this.edgeSwipeSensitivity)
        },
        _trackStart: function(e) {
            this._swipeAllowed() && (t = this, this._setDragging(!0), this._isMainSelected() && this._setDragging(this.peeking || this._isEdgeTouch(e)), this.dragging && (this.width = this.$.drawer.offsetWidth, this._transition = !1))
        },
        _translateXForDeltaX: function(e) {
            var t = this._isMainSelected();
            return this.rightDrawer ? Math.max(0, t ? this.width + e : e) : Math.min(0, t ? e - this.width : e)
        },
        _trackX: function(e) {
            if (this.dragging) {
                var t = e.detail.dx;
                if (this.peeking) {
                    if (Math.abs(t) <= this.edgeSwipeSensitivity) return;
                    this._setPeeking(!1)
                }
                this._moveDrawer(this._translateXForDeltaX(t))
            }
        },
        _trackEnd: function(e) {
            if (this.dragging) {
                var i = e.detail.dx > 0;
                this._setDragging(!1), this._transition = !0, t = null, this._moveDrawer(null), this.rightDrawer ? this[i ? "closeDrawer" : "openDrawer"]() : this[i ? "openDrawer" : "closeDrawer"]()
            }
        },
        _transformForTranslateX: function(e) {
            return null === e ? "" : this.hasWillChange ? "translateX(" + e + "px)" : "translate3d(" + e + "px, 0, 0)"
        },
        _moveDrawer: function(e) {
            this.transform(this._transformForTranslateX(e), this.$.drawer)
        },
        _getDrawerContent: function() {
            return Polymer.dom(this.$.drawerContent).getDistributedNodes()[0]
        },
        _getAutoFocusedNode: function() {
            var e = this._getDrawerContent();
            return this.drawerFocusSelector ? Polymer.dom(e).querySelector(this.drawerFocusSelector) || e : null
        },
        _toggleFocusListener: function(e) {
            "drawer" === e ? this.addEventListener("focus", this._boundFocusListener, !0) : this.removeEventListener("focus", this._boundFocusListener, !0)
        },
        _didFocus: function(e) {
            var t = this._getAutoFocusedNode();
            if (t) {
                var i = Polymer.dom(e).path,
                    r = (i[0], this._getDrawerContent()),
                    n = i.indexOf(r) !== -1;
                n || (e.stopPropagation(), t.focus())
            }
        },
        _isDrawerClosed: function(e, t) {
            return !e || "drawer" !== t
        }
    })
}();
