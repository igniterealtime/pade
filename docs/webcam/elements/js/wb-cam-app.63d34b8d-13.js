
! function() {
    "use strict";
    Polymer({
        is: "iron-overlay-backdrop",
        properties: {
            opened: {
                reflectToAttribute: !0,
                type: Boolean,
                value: !1,
                observer: "_openedChanged"
            }
        },
        listeners: {
            transitionend: "_onTransitionend"
        },
        created: function() {
            this.__openedRaf = null
        },
        attached: function() {
            this.opened && this._openedChanged(this.opened)
        },
        prepare: function() {
            this.opened && !this.parentNode && Polymer.dom(document.body).appendChild(this)
        },
        open: function() {
            this.opened = !0
        },
        close: function() {
            this.opened = !1
        },
        complete: function() {
            this.opened || this.parentNode !== document.body || Polymer.dom(this.parentNode).removeChild(this)
        },
        _onTransitionend: function(e) {
            e && e.target === this && this.complete()
        },
        _openedChanged: function(e) {
            if (e) this.prepare();
            else {
                var t = window.getComputedStyle(this);
                "0s" !== t.transitionDuration && 0 != t.opacity || this.complete()
            }
            this.isAttached && (this.__openedRaf && (window.cancelAnimationFrame(this.__openedRaf), this.__openedRaf = null), this.scrollTop = this.scrollTop, this.__openedRaf = window.requestAnimationFrame(function() {
                this.__openedRaf = null, this.toggleClass("opened", this.opened)
            }.bind(this)))
        }
    })
}();


Polymer.IronOverlayManagerClass = function() {
    this._overlays = [], this._minimumZ = 101, this._backdropElement = null, Polymer.Gestures.add(document.documentElement, "tap", null), document.addEventListener("tap", this._onCaptureClick.bind(this), !0), document.addEventListener("focus", this._onCaptureFocus.bind(this), !0), document.addEventListener("keydown", this._onCaptureKeyDown.bind(this), !0)
}, Polymer.IronOverlayManagerClass.prototype = {
    constructor: Polymer.IronOverlayManagerClass,
    get backdropElement() {
        return this._backdropElement || (this._backdropElement = document.createElement("iron-overlay-backdrop")), this._backdropElement
    },
    get deepActiveElement() {
        for (var e = document.activeElement || document.body; e.root && Polymer.dom(e.root).activeElement;) e = Polymer.dom(e.root).activeElement;
        return e
    },
    _bringOverlayAtIndexToFront: function(e) {
        var t = this._overlays[e];
        if (t) {
            var r = this._overlays.length - 1,
                a = this._overlays[r];
            if (a && this._shouldBeBehindOverlay(t, a) && r--, !(e >= r)) {
                var n = Math.max(this.currentOverlayZ(), this._minimumZ);
                for (this._getZ(t) <= n && this._applyOverlayZ(t, n); e < r;) this._overlays[e] = this._overlays[e + 1], e++;
                this._overlays[r] = t
            }
        }
    },
    addOrRemoveOverlay: function(e) {
        e.opened ? this.addOverlay(e) : this.removeOverlay(e)
    },
    addOverlay: function(e) {
        var t = this._overlays.indexOf(e);
        if (t >= 0) return this._bringOverlayAtIndexToFront(t), void this.trackBackdrop();
        var r = this._overlays.length,
            a = this._overlays[r - 1],
            n = Math.max(this._getZ(a), this._minimumZ),
            o = this._getZ(e);
        if (a && this._shouldBeBehindOverlay(e, a)) {
            this._applyOverlayZ(a, n), r--;
            var i = this._overlays[r - 1];
            n = Math.max(this._getZ(i), this._minimumZ)
        }
        o <= n && this._applyOverlayZ(e, n), this._overlays.splice(r, 0, e), this.trackBackdrop()
    },
    removeOverlay: function(e) {
        var t = this._overlays.indexOf(e);
        t !== -1 && (this._overlays.splice(t, 1), this.trackBackdrop())
    },
    currentOverlay: function() {
        var e = this._overlays.length - 1;
        return this._overlays[e]
    },
    currentOverlayZ: function() {
        return this._getZ(this.currentOverlay())
    },
    ensureMinimumZ: function(e) {
        this._minimumZ = Math.max(this._minimumZ, e)
    },
    focusOverlay: function() {
        var e = this.currentOverlay();
        e && e._applyFocus()
    },
    trackBackdrop: function() {
        var e = this._overlayWithBackdrop();
        (e || this._backdropElement) && (this.backdropElement.style.zIndex = this._getZ(e) - 1, this.backdropElement.opened = !!e)
    },
    getBackdrops: function() {
        for (var e = [], t = 0; t < this._overlays.length; t++) this._overlays[t].withBackdrop && e.push(this._overlays[t]);
        return e
    },
    backdropZ: function() {
        return this._getZ(this._overlayWithBackdrop()) - 1
    },
    _overlayWithBackdrop: function() {
        for (var e = 0; e < this._overlays.length; e++)
            if (this._overlays[e].withBackdrop) return this._overlays[e]
    },
    _getZ: function(e) {
        var t = this._minimumZ;
        if (e) {
            var r = Number(e.style.zIndex || window.getComputedStyle(e).zIndex);
            r === r && (t = r)
        }
        return t
    },
    _setZ: function(e, t) {
        e.style.zIndex = t
    },
    _applyOverlayZ: function(e, t) {
        this._setZ(e, t + 2)
    },
    _overlayInPath: function(e) {
        e = e || [];
        for (var t = 0; t < e.length; t++)
            if (e[t]._manager === this) return e[t]
    },
    _onCaptureClick: function(e) {
        var t = this.currentOverlay();
        t && this._overlayInPath(Polymer.dom(e).path) !== t && t._onCaptureClick(e)
    },
    _onCaptureFocus: function(e) {
        var t = this.currentOverlay();
        t && t._onCaptureFocus(e)
    },
    _onCaptureKeyDown: function(e) {
        var t = this.currentOverlay();
        t && (Polymer.IronA11yKeysBehavior.keyboardEventMatchesKeys(e, "esc") ? t._onCaptureEsc(e) : Polymer.IronA11yKeysBehavior.keyboardEventMatchesKeys(e, "tab") && t._onCaptureTab(e))
    },
    _shouldBeBehindOverlay: function(e, t) {
        return !e.alwaysOnTop && t.alwaysOnTop
    }
}, Polymer.IronOverlayManager = new Polymer.IronOverlayManagerClass;


! function() {
    "use strict";
    var e = Element.prototype,
        t = e.matches || e.matchesSelector || e.mozMatchesSelector || e.msMatchesSelector || e.oMatchesSelector || e.webkitMatchesSelector;
    Polymer.IronFocusablesHelper = {
        getTabbableNodes: function(e) {
            var t = [],
                r = this._collectTabbableNodes(e, t);
            return r ? this._sortByTabIndex(t) : t
        },
        isFocusable: function(e) {
            return t.call(e, "input, select, textarea, button, object") ? t.call(e, ":not([disabled])") : t.call(e, "a[href], area[href], iframe, [tabindex], [contentEditable]")
        },
        isTabbable: function(e) {
            return this.isFocusable(e) && t.call(e, ':not([tabindex="-1"])') && this._isVisible(e)
        },
        _normalizedTabIndex: function(e) {
            if (this.isFocusable(e)) {
                var t = e.getAttribute("tabindex") || 0;
                return Number(t)
            }
            return -1
        },
        _collectTabbableNodes: function(e, t) {
            if (e.nodeType !== Node.ELEMENT_NODE || !this._isVisible(e)) return !1;
            var r = e,
                a = this._normalizedTabIndex(r),
                i = a > 0;
            a >= 0 && t.push(r);
            var n;
            n = "content" === r.localName ? Polymer.dom(r).getDistributedNodes() : Polymer.dom(r.root || r).children;
            for (var o = 0; o < n.length; o++) {
                var s = this._collectTabbableNodes(n[o], t);
                i = i || s
            }
            return i
        },
        _isVisible: function(e) {
            var t = e.style;
            return "hidden" !== t.visibility && "none" !== t.display && (t = window.getComputedStyle(e), "hidden" !== t.visibility && "none" !== t.display)
        },
        _sortByTabIndex: function(e) {
            var t = e.length;
            if (t < 2) return e;
            var r = Math.ceil(t / 2),
                a = this._sortByTabIndex(e.slice(0, r)),
                i = this._sortByTabIndex(e.slice(r));
            return this._mergeSortByTabIndex(a, i)
        },
        _mergeSortByTabIndex: function(e, t) {
            for (var r = []; e.length > 0 && t.length > 0;) this._hasLowerTabOrder(e[0], t[0]) ? r.push(t.shift()) : r.push(e.shift());
            return r.concat(e, t)
        },
        _hasLowerTabOrder: function(e, t) {
            var r = Math.max(e.tabIndex, 0),
                a = Math.max(t.tabIndex, 0);
            return 0 === r || 0 === a ? a > r : r > a
        }
    }
}();


! function() {
    "use strict";
    Polymer.IronOverlayBehaviorImpl = {
        properties: {
            opened: {
                observer: "_openedChanged",
                type: Boolean,
                value: !1,
                notify: !0
            },
            canceled: {
                observer: "_canceledChanged",
                readOnly: !0,
                type: Boolean,
                value: !1
            },
            withBackdrop: {
                observer: "_withBackdropChanged",
                type: Boolean
            },
            noAutoFocus: {
                type: Boolean,
                value: !1
            },
            noCancelOnEscKey: {
                type: Boolean,
                value: !1
            },
            noCancelOnOutsideClick: {
                type: Boolean,
                value: !1
            },
            closingReason: {
                type: Object
            },
            restoreFocusOnClose: {
                type: Boolean,
                value: !1
            },
            alwaysOnTop: {
                type: Boolean
            },
            _manager: {
                type: Object,
                value: Polymer.IronOverlayManager
            },
            _focusedChild: {
                type: Object
            }
        },
        listeners: {
            "iron-resize": "_onIronResize"
        },
        get backdropElement() {
            return this._manager.backdropElement
        },
        get _focusNode() {
            return this._focusedChild || Polymer.dom(this).querySelector("[autofocus]") || this
        },
        get _focusableNodes() {
            return Polymer.IronFocusablesHelper.getTabbableNodes(this)
        },
        ready: function() {
            this.__isAnimating = !1, this.__shouldRemoveTabIndex = !1, this.__firstFocusableNode = this.__lastFocusableNode = null, this.__raf = null, this.__restoreFocusNode = null, this._ensureSetup()
        },
        attached: function() {
            this.opened && this._openedChanged(this.opened), this._observer = Polymer.dom(this).observeNodes(this._onNodesChange)
        },
        detached: function() {
            Polymer.dom(this).unobserveNodes(this._observer), this._observer = null, this.__raf && (window.cancelAnimationFrame(this.__raf), this.__raf = null), this._manager.removeOverlay(this)
        },
        toggle: function() {
            this._setCanceled(!1), this.opened = !this.opened
        },
        open: function() {
            this._setCanceled(!1), this.opened = !0
        },
        close: function() {
            this._setCanceled(!1), this.opened = !1
        },
        cancel: function(e) {
            var t = this.fire("iron-overlay-canceled", e, {
                cancelable: !0
            });
            t.defaultPrevented || (this._setCanceled(!0), this.opened = !1)
        },
        invalidateTabbables: function() {
            this.__firstFocusableNode = this.__lastFocusableNode = null
        },
        _ensureSetup: function() {
            this._overlaySetup || (this._overlaySetup = !0, this.style.outline = "none", this.style.display = "none")
        },
        _openedChanged: function(e) {
            e ? this.removeAttribute("aria-hidden") : this.setAttribute("aria-hidden", "true"), this.isAttached && (this.__isAnimating = !0, this.__onNextAnimationFrame(this.__openedChanged))
        },
        _canceledChanged: function() {
            this.closingReason = this.closingReason || {}, this.closingReason.canceled = this.canceled
        },
        _withBackdropChanged: function() {
            this.withBackdrop && !this.hasAttribute("tabindex") ? (this.setAttribute("tabindex", "-1"), this.__shouldRemoveTabIndex = !0) : this.__shouldRemoveTabIndex && (this.removeAttribute("tabindex"), this.__shouldRemoveTabIndex = !1), this.opened && this.isAttached && this._manager.trackBackdrop()
        },
        _prepareRenderOpened: function() {
            this.__restoreFocusNode = this._manager.deepActiveElement, this._preparePositioning(), this.refit(), this._finishPositioning(), this.noAutoFocus && document.activeElement === this._focusNode && (this._focusNode.blur(), this.__restoreFocusNode.focus())
        },
        _renderOpened: function() {
            this._finishRenderOpened()
        },
        _renderClosed: function() {
            this._finishRenderClosed()
        },
        _finishRenderOpened: function() {
            this.notifyResize(), this.__isAnimating = !1, this.fire("iron-overlay-opened")
        },
        _finishRenderClosed: function() {
            this.style.display = "none", this.style.zIndex = "", this.notifyResize(), this.__isAnimating = !1, this.fire("iron-overlay-closed", this.closingReason)
        },
        _preparePositioning: function() {
            this.style.transition = this.style.webkitTransition = "none", this.style.transform = this.style.webkitTransform = "none", this.style.display = ""
        },
        _finishPositioning: function() {
            this.style.display = "none", this.scrollTop = this.scrollTop, this.style.transition = this.style.webkitTransition = "", this.style.transform = this.style.webkitTransform = "", this.style.display = "", this.scrollTop = this.scrollTop
        },
        _applyFocus: function() {
            if (this.opened) this.noAutoFocus || this._focusNode.focus();
            else {
                this._focusNode.blur(), this._focusedChild = null, this.restoreFocusOnClose && this.__restoreFocusNode && this.__restoreFocusNode.focus(), this.__restoreFocusNode = null;
                var e = this._manager.currentOverlay();
                e && this !== e && e._applyFocus()
            }
        },
        _onCaptureClick: function(e) {
            this.noCancelOnOutsideClick || this.cancel(e)
        },
        _onCaptureFocus: function(e) {
            if (this.withBackdrop) {
                var t = Polymer.dom(e).path;
                t.indexOf(this) === -1 ? (e.stopPropagation(), this._applyFocus()) : this._focusedChild = t[0]
            }
        },
        _onCaptureEsc: function(e) {
            this.noCancelOnEscKey || this.cancel(e)
        },
        _onCaptureTab: function(e) {
            if (this.withBackdrop) {
                this.__ensureFirstLastFocusables();
                var t = e.shiftKey,
                    i = t ? this.__firstFocusableNode : this.__lastFocusableNode,
                    s = t ? this.__lastFocusableNode : this.__firstFocusableNode,
                    o = !1;
                if (i === s) o = !0;
                else {
                    var n = this._manager.deepActiveElement;
                    o = n === i || n === this
                }
                o && (e.preventDefault(), this._focusedChild = s, this._applyFocus())
            }
        },
        _onIronResize: function() {
            this.opened && !this.__isAnimating && this.__onNextAnimationFrame(this.refit)
        },
        _onNodesChange: function() {
            this.opened && !this.__isAnimating && (this.invalidateTabbables(), this.notifyResize())
        },
        __ensureFirstLastFocusables: function() {
            if (!this.__firstFocusableNode || !this.__lastFocusableNode) {
                var e = this._focusableNodes;
                this.__firstFocusableNode = e[0], this.__lastFocusableNode = e[e.length - 1]
            }
        },
        __openedChanged: function() {
            this.opened ? (this._prepareRenderOpened(), this._manager.addOverlay(this), this._applyFocus(), this._renderOpened()) : (this._manager.removeOverlay(this), this._applyFocus(), this._renderClosed())
        },
        __onNextAnimationFrame: function(e) {
            this.__raf && window.cancelAnimationFrame(this.__raf);
            var t = this;
            this.__raf = window.requestAnimationFrame(function() {
                t.__raf = null, e.call(t)
            })
        }
    }, Polymer.IronOverlayBehavior = [Polymer.IronFitBehavior, Polymer.IronResizableBehavior, Polymer.IronOverlayBehaviorImpl]
}();


Polymer.PaperDialogBehaviorImpl = {
    hostAttributes: {
        role: "dialog",
        tabindex: "-1"
    },
    properties: {
        modal: {
            type: Boolean,
            value: !1
        }
    },
    observers: ["_modalChanged(modal, _readied)"],
    listeners: {
        tap: "_onDialogClick"
    },
    ready: function() {
        this.__prevNoCancelOnOutsideClick = this.noCancelOnOutsideClick, this.__prevNoCancelOnEscKey = this.noCancelOnEscKey, this.__prevWithBackdrop = this.withBackdrop
    },
    _modalChanged: function(i, e) {
        e && (i ? (this.__prevNoCancelOnOutsideClick = this.noCancelOnOutsideClick, this.__prevNoCancelOnEscKey = this.noCancelOnEscKey, this.__prevWithBackdrop = this.withBackdrop, this.noCancelOnOutsideClick = !0, this.noCancelOnEscKey = !0, this.withBackdrop = !0) : (this.noCancelOnOutsideClick = this.noCancelOnOutsideClick && this.__prevNoCancelOnOutsideClick, this.noCancelOnEscKey = this.noCancelOnEscKey && this.__prevNoCancelOnEscKey, this.withBackdrop = this.withBackdrop && this.__prevWithBackdrop))
    },
    _updateClosingReasonConfirmed: function(i) {
        this.closingReason = this.closingReason || {}, this.closingReason.confirmed = i
    },
    _onDialogClick: function(i) {
        for (var e = Polymer.dom(i).path, o = 0; o < e.indexOf(this); o++) {
            var t = e[o];
            if (t.hasAttribute && (t.hasAttribute("dialog-dismiss") || t.hasAttribute("dialog-confirm"))) {
                this._updateClosingReasonConfirmed(t.hasAttribute("dialog-confirm")), this.close(), i.stopPropagation();
                break
            }
        }
    }
}, Polymer.PaperDialogBehavior = [Polymer.IronOverlayBehavior, Polymer.PaperDialogBehaviorImpl];
