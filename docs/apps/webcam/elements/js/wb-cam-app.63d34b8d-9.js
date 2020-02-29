
Polymer.IronMultiSelectableBehaviorImpl = {
    properties: {
        multi: {
            type: Boolean,
            value: !1,
            observer: "multiChanged"
        },
        selectedValues: {
            type: Array,
            notify: !0
        },
        selectedItems: {
            type: Array,
            readOnly: !0,
            notify: !0
        }
    },
    observers: ["_updateSelected(selectedValues.splices)"],
    select: function(e) {
        this.multi ? this.selectedValues ? this._toggleSelected(e) : this.selectedValues = [e] : this.selected = e
    },
    multiChanged: function(e) {
        this._selection.multi = e
    },
    get _shouldUpdateSelection() {
        return null != this.selected || null != this.selectedValues && this.selectedValues.length
    },
    _updateAttrForSelected: function() {
        this.multi ? this._shouldUpdateSelection && (this.selectedValues = this.selectedItems.map(function(e) {
            return this._indexToValue(this.indexOf(e))
        }, this).filter(function(e) {
            return null != e
        }, this)) : Polymer.IronSelectableBehavior._updateAttrForSelected.apply(this)
    },
    _updateSelected: function() {
        this.multi ? this._selectMulti(this.selectedValues) : this._selectSelected(this.selected)
    },
    _selectMulti: function(e) {
        if (e) {
            var t = this._valuesToItems(e);
            this._selection.clear(t);
            for (var l = 0; l < t.length; l++) this._selection.setItemSelected(t[l], !0);
            if (this.fallbackSelection && this.items.length && !this._selection.get().length) {
                var s = this._valueToItem(this.fallbackSelection);
                s && (this.selectedValues = [this.fallbackSelection])
            }
        } else this._selection.clear()
    },
    _selectionChange: function() {
        var e = this._selection.get();
        this.multi ? this._setSelectedItems(e) : (this._setSelectedItems([e]), this._setSelectedItem(e))
    },
    _toggleSelected: function(e) {
        var t = this.selectedValues.indexOf(e),
            l = t < 0;
        l ? this.push("selectedValues", e) : this.splice("selectedValues", t, 1)
    },
    _valuesToItems: function(e) {
        return null == e ? null : e.map(function(e) {
            return this._valueToItem(e)
        }, this)
    }
}, Polymer.IronMultiSelectableBehavior = [Polymer.IronSelectableBehavior, Polymer.IronMultiSelectableBehaviorImpl];

Polymer({
    is: "iron-selector",
    behaviors: [Polymer.IronMultiSelectableBehavior]
});

! function() {
    "use strict";

    function e(e, t) {
        var n = "";
        if (e) {
            var i = e.toLowerCase();
            " " === i || v.test(i) ? n = "space" : f.test(i) ? n = "esc" : 1 == i.length ? t && !u.test(i) || (n = i) : n = c.test(i) ? i.replace("arrow", "") : "multiply" == i ? "*" : i
        }
        return n
    }

    function t(e) {
        var t = "";
        return e && (e in o ? t = o[e] : h.test(e) ? (e = parseInt(e.replace("U+", "0x"), 16), t = String.fromCharCode(e).toLowerCase()) : t = e.toLowerCase()), t
    }

    function n(e) {
        var t = "";
        return Number(e) && (t = e >= 65 && e <= 90 ? String.fromCharCode(32 + e) : e >= 112 && e <= 123 ? "f" + (e - 112) : e >= 48 && e <= 57 ? String(e - 48) : e >= 96 && e <= 105 ? String(e - 96) : d[e]), t
    }

    function i(i, r) {
        return i.key ? e(i.key, r) : i.detail && i.detail.key ? e(i.detail.key, r) : t(i.keyIdentifier) || n(i.keyCode) || ""
    }

    function r(e, t) {
        var n = i(t, e.hasModifiers);
        return n === e.key && (!e.hasModifiers || !!t.shiftKey == !!e.shiftKey && !!t.ctrlKey == !!e.ctrlKey && !!t.altKey == !!e.altKey && !!t.metaKey == !!e.metaKey)
    }

    function s(e) {
        return 1 === e.length ? {
            combo: e,
            key: e,
            event: "keydown"
        } : e.split("+").reduce(function(e, t) {
            var n = t.split(":"),
                i = n[0],
                r = n[1];
            return i in y ? (e[y[i]] = !0, e.hasModifiers = !0) : (e.key = i, e.event = r || "keydown"), e
        }, {
            combo: e.split(":").shift()
        })
    }

    function a(e) {
        return e.trim().split(" ").map(function(e) {
            return s(e)
        })
    }
    var o = {
            "U+0008": "backspace",
            "U+0009": "tab",
            "U+001B": "esc",
            "U+0020": "space",
            "U+007F": "del"
        },
        d = {
            8: "backspace",
            9: "tab",
            13: "enter",
            27: "esc",
            33: "pageup",
            34: "pagedown",
            35: "end",
            36: "home",
            32: "space",
            37: "left",
            38: "up",
            39: "right",
            40: "down",
            46: "del",
            106: "*"
        },
        y = {
            shift: "shiftKey",
            ctrl: "ctrlKey",
            alt: "altKey",
            meta: "metaKey"
        },
        u = /[a-z0-9*]/,
        h = /U\+/,
        c = /^arrow/,
        v = /^space(bar)?/,
        f = /^escape$/;
    Polymer.IronA11yKeysBehavior = {
        properties: {
            keyEventTarget: {
                type: Object,
                value: function() {
                    return this
                }
            },
            stopKeyboardEventPropagation: {
                type: Boolean,
                value: !1
            },
            _boundKeyHandlers: {
                type: Array,
                value: function() {
                    return []
                }
            },
            _imperativeKeyBindings: {
                type: Object,
                value: function() {
                    return {}
                }
            }
        },
        observers: ["_resetKeyEventListeners(keyEventTarget, _boundKeyHandlers)"],
        keyBindings: {},
        registered: function() {
            this._prepKeyBindings()
        },
        attached: function() {
            this._listenKeyEventListeners()
        },
        detached: function() {
            this._unlistenKeyEventListeners()
        },
        addOwnKeyBinding: function(e, t) {
            this._imperativeKeyBindings[e] = t, this._prepKeyBindings(), this._resetKeyEventListeners()
        },
        removeOwnKeyBindings: function() {
            this._imperativeKeyBindings = {}, this._prepKeyBindings(), this._resetKeyEventListeners()
        },
        keyboardEventMatchesKeys: function(e, t) {
            for (var n = a(t), i = 0; i < n.length; ++i)
                if (r(n[i], e)) return !0;
            return !1
        },
        _collectKeyBindings: function() {
            var e = this.behaviors.map(function(e) {
                return e.keyBindings
            });
            return e.indexOf(this.keyBindings) === -1 && e.push(this.keyBindings), e
        },
        _prepKeyBindings: function() {
            this._keyBindings = {}, this._collectKeyBindings().forEach(function(e) {
                for (var t in e) this._addKeyBinding(t, e[t])
            }, this);
            for (var e in this._imperativeKeyBindings) this._addKeyBinding(e, this._imperativeKeyBindings[e]);
            for (var t in this._keyBindings) this._keyBindings[t].sort(function(e, t) {
                var n = e[0].hasModifiers,
                    i = t[0].hasModifiers;
                return n === i ? 0 : n ? -1 : 1
            })
        },
        _addKeyBinding: function(e, t) {
            a(e).forEach(function(e) {
                this._keyBindings[e.event] = this._keyBindings[e.event] || [], this._keyBindings[e.event].push([e, t])
            }, this)
        },
        _resetKeyEventListeners: function() {
            this._unlistenKeyEventListeners(), this.isAttached && this._listenKeyEventListeners()
        },
        _listenKeyEventListeners: function() {
            this.keyEventTarget && Object.keys(this._keyBindings).forEach(function(e) {
                var t = this._keyBindings[e],
                    n = this._onKeyBindingEvent.bind(this, t);
                this._boundKeyHandlers.push([this.keyEventTarget, e, n]), this.keyEventTarget.addEventListener(e, n)
            }, this)
        },
        _unlistenKeyEventListeners: function() {
            for (var e, t, n, i; this._boundKeyHandlers.length;) e = this._boundKeyHandlers.pop(), t = e[0], n = e[1], i = e[2], t.removeEventListener(n, i)
        },
        _onKeyBindingEvent: function(e, t) {
            if (this.stopKeyboardEventPropagation && t.stopPropagation(), !t.defaultPrevented)
                for (var n = 0; n < e.length; n++) {
                    var i = e[n][0],
                        s = e[n][1];
                    if (r(i, t) && (this._triggerKeyHandler(i, s, t), t.defaultPrevented)) return
                }
        },
        _triggerKeyHandler: function(e, t, n) {
            var i = Object.create(e);
            i.keyboardEvent = n;
            var r = new CustomEvent(e.event, {
                detail: i,
                cancelable: !0
            });
            this[t].call(this, r), r.defaultPrevented && n.preventDefault()
        }
    }
}();

Polymer.IronControlState = {
    properties: {
        focused: {
            type: Boolean,
            value: !1,
            notify: !0,
            readOnly: !0,
            reflectToAttribute: !0
        },
        disabled: {
            type: Boolean,
            value: !1,
            notify: !0,
            observer: "_disabledChanged",
            reflectToAttribute: !0
        },
        _oldTabIndex: {
            type: Number
        },
        _boundFocusBlurHandler: {
            type: Function,
            value: function() {
                return this._focusBlurHandler.bind(this)
            }
        }
    },
    observers: ["_changedControlState(focused, disabled)"],
    ready: function() {
        this.addEventListener("focus", this._boundFocusBlurHandler, !0), this.addEventListener("blur", this._boundFocusBlurHandler, !0)
    },
    _focusBlurHandler: function(e) {
        if (e.target === this) this._setFocused("focus" === e.type);
        else if (!this.shadowRoot) {
            var t = Polymer.dom(e).localTarget;
            this.isLightDescendant(t) || this.fire(e.type, {
                sourceEvent: e
            }, {
                node: this,
                bubbles: e.bubbles,
                cancelable: e.cancelable
            })
        }
    },
    _disabledChanged: function(e, t) {
        this.setAttribute("aria-disabled", e ? "true" : "false"), this.style.pointerEvents = e ? "none" : "", e ? (this._oldTabIndex = this.tabIndex, this._setFocused(!1), this.tabIndex = -1, this.blur()) : void 0 !== this._oldTabIndex && (this.tabIndex = this._oldTabIndex)
    },
    _changedControlState: function() {
        this._controlStateChanged && this._controlStateChanged()
    }
};

Polymer.IronButtonStateImpl = {
    properties: {
        pressed: {
            type: Boolean,
            readOnly: !0,
            value: !1,
            reflectToAttribute: !0,
            observer: "_pressedChanged"
        },
        toggles: {
            type: Boolean,
            value: !1,
            reflectToAttribute: !0
        },
        active: {
            type: Boolean,
            value: !1,
            notify: !0,
            reflectToAttribute: !0
        },
        pointerDown: {
            type: Boolean,
            readOnly: !0,
            value: !1
        },
        receivedFocusFromKeyboard: {
            type: Boolean,
            readOnly: !0
        },
        ariaActiveAttribute: {
            type: String,
            value: "aria-pressed",
            observer: "_ariaActiveAttributeChanged"
        }
    },
    listeners: {
        down: "_downHandler",
        up: "_upHandler",
        tap: "_tapHandler"
    },
    observers: ["_focusChanged(focused)", "_activeChanged(active, ariaActiveAttribute)"],
    keyBindings: {
        "enter:keydown": "_asyncClick",
        "space:keydown": "_spaceKeyDownHandler",
        "space:keyup": "_spaceKeyUpHandler"
    },
    _mouseEventRe: /^mouse/,
    _tapHandler: function() {
        this.toggles ? this._userActivate(!this.active) : this.active = !1
    },
    _focusChanged: function(e) {
        this._detectKeyboardFocus(e), e || this._setPressed(!1)
    },
    _detectKeyboardFocus: function(e) {
        this._setReceivedFocusFromKeyboard(!this.pointerDown && e)
    },
    _userActivate: function(e) {
        this.active !== e && (this.active = e, this.fire("change"))
    },
    _downHandler: function(e) {
        this._setPointerDown(!0), this._setPressed(!0), this._setReceivedFocusFromKeyboard(!1)
    },
    _upHandler: function() {
        this._setPointerDown(!1), this._setPressed(!1)
    },
    _spaceKeyDownHandler: function(e) {
        var t = e.detail.keyboardEvent,
            i = Polymer.dom(t).localTarget;
        this.isLightDescendant(i) || (t.preventDefault(), t.stopImmediatePropagation(), this._setPressed(!0))
    },
    _spaceKeyUpHandler: function(e) {
        var t = e.detail.keyboardEvent,
            i = Polymer.dom(t).localTarget;
        this.isLightDescendant(i) || (this.pressed && this._asyncClick(), this._setPressed(!1))
    },
    _asyncClick: function() {
        this.async(function() {
            this.click()
        }, 1)
    },
    _pressedChanged: function(e) {
        this._changedButtonState()
    },
    _ariaActiveAttributeChanged: function(e, t) {
        t && t != e && this.hasAttribute(t) && this.removeAttribute(t)
    },
    _activeChanged: function(e, t) {
        this.toggles ? this.setAttribute(this.ariaActiveAttribute, e ? "true" : "false") : this.removeAttribute(this.ariaActiveAttribute), this._changedButtonState()
    },
    _controlStateChanged: function() {
        this.disabled ? this._setPressed(!1) : this._changedButtonState()
    },
    _changedButtonState: function() {
        this._buttonStateChanged && this._buttonStateChanged()
    }
}, Polymer.IronButtonState = [Polymer.IronA11yKeysBehavior, Polymer.IronButtonStateImpl];
