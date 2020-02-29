
Polymer({
    is: "paper-material",
    properties: {
        elevation: {
            type: Number,
            reflectToAttribute: !0,
            value: 1
        },
        animated: {
            type: Boolean,
            reflectToAttribute: !0,
            value: !1
        }
    }
});

Polymer.IronMenuBehaviorImpl = {
    properties: {
        focusedItem: {
            observer: "_focusedItemChanged",
            readOnly: !0,
            type: Object
        },
        attrForItemTitle: {
            type: String
        },
        disabled: {
            type: Boolean,
            value: !1,
            observer: "_disabledChanged"
        }
    },
    _SEARCH_RESET_TIMEOUT_MS: 1e3,
    _previousTabIndex: 0,
    hostAttributes: {
        role: "menu"
    },
    observers: ["_updateMultiselectable(multi)"],
    listeners: {
        focus: "_onFocus",
        keydown: "_onKeydown",
        "iron-items-changed": "_onIronItemsChanged"
    },
    keyBindings: {
        up: "_onUpKey",
        down: "_onDownKey",
        esc: "_onEscKey",
        "shift+tab:keydown": "_onShiftTabDown"
    },
    attached: function() {
        this._resetTabindices()
    },
    select: function(e) {
        this._defaultFocusAsync && (this.cancelAsync(this._defaultFocusAsync), this._defaultFocusAsync = null);
        var t = this._valueToItem(e);
        t && t.hasAttribute("disabled") || (this._setFocusedItem(t), Polymer.IronMultiSelectableBehaviorImpl.select.apply(this, arguments))
    },
    _resetTabindices: function() {
        var e = this.multi ? this.selectedItems && this.selectedItems[0] : this.selectedItem;
        this.items.forEach(function(t) {
            t.setAttribute("tabindex", t === e ? "0" : "-1")
        }, this)
    },
    _updateMultiselectable: function(e) {
        e ? this.setAttribute("aria-multiselectable", "true") : this.removeAttribute("aria-multiselectable")
    },
    _focusWithKeyboardEvent: function(e) {
        this.cancelDebouncer("_clearSearchText");
        var t = this._searchText || "",
            i = e.key && 1 == e.key.length ? e.key : String.fromCharCode(e.keyCode);
        t += i.toLocaleLowerCase();
        for (var s, o = t.length, n = 0; s = this.items[n]; n++)
            if (!s.hasAttribute("disabled")) {
                var r = this.attrForItemTitle || "textContent",
                    a = (s[r] || s.getAttribute(r) || "").trim();
                if (!(a.length < o) && a.slice(0, o).toLocaleLowerCase() == t) {
                    this._setFocusedItem(s);
                    break
                }
            }
        this._searchText = t, this.debounce("_clearSearchText", this._clearSearchText, this._SEARCH_RESET_TIMEOUT_MS)
    },
    _clearSearchText: function() {
        this._searchText = ""
    },
    _focusPrevious: function() {
        for (var e = this.items.length, t = Number(this.indexOf(this.focusedItem)), i = 1; i < e + 1; i++) {
            var s = this.items[(t - i + e) % e];
            if (!s.hasAttribute("disabled")) {
                var o = Polymer.dom(s).getOwnerRoot() || document;
                if (this._setFocusedItem(s), Polymer.dom(o).activeElement == s) return
            }
        }
    },
    _focusNext: function() {
        for (var e = this.items.length, t = Number(this.indexOf(this.focusedItem)), i = 1; i < e + 1; i++) {
            var s = this.items[(t + i) % e];
            if (!s.hasAttribute("disabled")) {
                var o = Polymer.dom(s).getOwnerRoot() || document;
                if (this._setFocusedItem(s), Polymer.dom(o).activeElement == s) return
            }
        }
    },
    _applySelection: function(e, t) {
        t ? e.setAttribute("aria-selected", "true") : e.removeAttribute("aria-selected"), Polymer.IronSelectableBehavior._applySelection.apply(this, arguments)
    },
    _focusedItemChanged: function(e, t) {
        t && t.setAttribute("tabindex", "-1"), !e || e.hasAttribute("disabled") || this.disabled || (e.setAttribute("tabindex", "0"), e.focus())
    },
    _onIronItemsChanged: function(e) {
        e.detail.addedNodes.length && this._resetTabindices()
    },
    _onShiftTabDown: function(e) {
        var t = this.getAttribute("tabindex");
        Polymer.IronMenuBehaviorImpl._shiftTabPressed = !0, this._setFocusedItem(null), this.setAttribute("tabindex", "-1"), this.async(function() {
            this.setAttribute("tabindex", t), Polymer.IronMenuBehaviorImpl._shiftTabPressed = !1
        }, 1)
    },
    _onFocus: function(e) {
        if (!Polymer.IronMenuBehaviorImpl._shiftTabPressed) {
            var t = Polymer.dom(e).rootTarget;
            (t === this || "undefined" == typeof t.tabIndex || this.isLightDescendant(t)) && (this._defaultFocusAsync = this.async(function() {
                var e = this.multi ? this.selectedItems && this.selectedItems[0] : this.selectedItem;
                this._setFocusedItem(null), e ? this._setFocusedItem(e) : this.items[0] && this._focusNext()
            }))
        }
    },
    _onUpKey: function(e) {
        this._focusPrevious(), e.detail.keyboardEvent.preventDefault()
    },
    _onDownKey: function(e) {
        this._focusNext(), e.detail.keyboardEvent.preventDefault()
    },
    _onEscKey: function(e) {
        this.focusedItem.blur()
    },
    _onKeydown: function(e) {
        this.keyboardEventMatchesKeys(e, "up down esc") || this._focusWithKeyboardEvent(e), e.stopPropagation()
    },
    _activateHandler: function(e) {
        Polymer.IronSelectableBehavior._activateHandler.call(this, e), e.stopPropagation()
    },
    _disabledChanged: function(e) {
        e ? (this._previousTabIndex = this.hasAttribute("tabindex") ? this.tabIndex : 0, this.removeAttribute("tabindex")) : this.hasAttribute("tabindex") || this.setAttribute("tabindex", this._previousTabIndex)
    }
}, Polymer.IronMenuBehaviorImpl._shiftTabPressed = !1, Polymer.IronMenuBehavior = [Polymer.IronMultiSelectableBehavior, Polymer.IronA11yKeysBehavior, Polymer.IronMenuBehaviorImpl];
