
! function() {
    "use strict";
    Polymer({
        is: "paper-dropdown-menu",
        behaviors: [Polymer.IronButtonState, Polymer.IronControlState, Polymer.IronFormElementBehavior, Polymer.IronValidatableBehavior],
        properties: {
            selectedItemLabel: {
                type: String,
                notify: !0,
                readOnly: !0
            },
            selectedItem: {
                type: Object,
                notify: !0,
                readOnly: !0
            },
            value: {
                type: String,
                notify: !0,
                readOnly: !0
            },
            label: {
                type: String
            },
            placeholder: {
                type: String
            },
            errorMessage: {
                type: String
            },
            opened: {
                type: Boolean,
                notify: !0,
                value: !1,
                observer: "_openedChanged"
            },
            allowOutsideScroll: {
                type: Boolean,
                value: !1
            },
            noLabelFloat: {
                type: Boolean,
                value: !1,
                reflectToAttribute: !0
            },
            alwaysFloatLabel: {
                type: Boolean,
                value: !1
            },
            noAnimations: {
                type: Boolean,
                value: !1
            },
            horizontalAlign: {
                type: String,
                value: "right"
            },
            verticalAlign: {
                type: String,
                value: "top"
            },
            dynamicAlign: {
                type: Boolean
            },
            restoreFocusOnClose: {
                type: Boolean,
                value: !0
            }
        },
        listeners: {
            tap: "_onTap"
        },
        keyBindings: {
            "up down": "open",
            esc: "close"
        },
        hostAttributes: {
            role: "combobox",
            "aria-autocomplete": "none",
            "aria-haspopup": "true"
        },
        observers: ["_selectedItemChanged(selectedItem)"],
        attached: function() {
            var e = this.contentElement;
            e && e.selectedItem && this._setSelectedItem(e.selectedItem)
        },
        get contentElement() {
            return Polymer.dom(this.$.content).getDistributedNodes()[0]
        },
        open: function() {
            this.$.menuButton.open()
        },
        close: function() {
            this.$.menuButton.close()
        },
        _onIronSelect: function(e) {
            this._setSelectedItem(e.detail.item)
        },
        _onIronDeselect: function(e) {
            this._setSelectedItem(null)
        },
        _onTap: function(e) {
            Polymer.Gestures.findOriginalTarget(e) === this && this.open()
        },
        _selectedItemChanged: function(e) {
            var t = "";
            t = e ? e.label || e.getAttribute("label") || e.textContent.trim() : "", this._setValue(t), this._setSelectedItemLabel(t)
        },
        _computeMenuVerticalOffset: function(e) {
            return e ? -4 : 8
        },
        _getValidity: function(e) {
            return this.disabled || !this.required || this.required && !!this.value
        },
        _openedChanged: function() {
            var e = this.opened ? "true" : "false",
                t = this.contentElement;
            t && t.setAttribute("aria-expanded", e)
        }
    })
}();
