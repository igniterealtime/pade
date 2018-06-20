
Polymer({
    is: "paper-input-container",
    properties: {
        noLabelFloat: {
            type: Boolean,
            value: !1
        },
        alwaysFloatLabel: {
            type: Boolean,
            value: !1
        },
        attrForValue: {
            type: String,
            value: "bind-value"
        },
        autoValidate: {
            type: Boolean,
            value: !1
        },
        invalid: {
            observer: "_invalidChanged",
            type: Boolean,
            value: !1
        },
        focused: {
            readOnly: !0,
            type: Boolean,
            value: !1,
            notify: !0
        },
        _addons: {
            type: Array
        },
        _inputHasContent: {
            type: Boolean,
            value: !1
        },
        _inputSelector: {
            type: String,
            value: "input,textarea,.paper-input-input"
        },
        _boundOnFocus: {
            type: Function,
            value: function() {
                return this._onFocus.bind(this)
            }
        },
        _boundOnBlur: {
            type: Function,
            value: function() {
                return this._onBlur.bind(this)
            }
        },
        _boundOnInput: {
            type: Function,
            value: function() {
                return this._onInput.bind(this)
            }
        },
        _boundValueChanged: {
            type: Function,
            value: function() {
                return this._onValueChanged.bind(this)
            }
        }
    },
    listeners: {
        "addon-attached": "_onAddonAttached",
        "iron-input-validate": "_onIronInputValidate"
    },
    get _valueChangedEvent() {
        return this.attrForValue + "-changed"
    },
    get _propertyForValue() {
        return Polymer.CaseMap.dashToCamelCase(this.attrForValue)
    },
    get _inputElement() {
        return Polymer.dom(this).querySelector(this._inputSelector)
    },
    get _inputElementValue() {
        return this._inputElement[this._propertyForValue] || this._inputElement.value
    },
    ready: function() {
        this._addons || (this._addons = []), this.addEventListener("focus", this._boundOnFocus, !0), this.addEventListener("blur", this._boundOnBlur, !0)
    },
    attached: function() {
        this.attrForValue ? this._inputElement.addEventListener(this._valueChangedEvent, this._boundValueChanged) : this.addEventListener("input", this._onInput), "" != this._inputElementValue ? this._handleValueAndAutoValidate(this._inputElement) : this._handleValue(this._inputElement)
    },
    _onAddonAttached: function(t) {
        this._addons || (this._addons = []);
        var n = t.target;
        this._addons.indexOf(n) === -1 && (this._addons.push(n), this.isAttached && this._handleValue(this._inputElement))
    },
    _onFocus: function() {
        this._setFocused(!0)
    },
    _onBlur: function() {
        this._setFocused(!1), this._handleValueAndAutoValidate(this._inputElement)
    },
    _onInput: function(t) {
        this._handleValueAndAutoValidate(t.target)
    },
    _onValueChanged: function(t) {
        this._handleValueAndAutoValidate(t.target)
    },
    _handleValue: function(t) {
        var n = this._inputElementValue;
        n || 0 === n || "number" === t.type && !t.checkValidity() ? this._inputHasContent = !0 : this._inputHasContent = !1, this.updateAddons({
            inputElement: t,
            value: n,
            invalid: this.invalid
        })
    },
    _handleValueAndAutoValidate: function(t) {
        if (this.autoValidate) {
            var n;
            n = t.validate ? t.validate(this._inputElementValue) : t.checkValidity(), this.invalid = !n
        }
        this._handleValue(t)
    },
    _onIronInputValidate: function(t) {
        this.invalid = this._inputElement.invalid
    },
    _invalidChanged: function() {
        this._addons && this.updateAddons({
            invalid: this.invalid
        })
    },
    updateAddons: function(t) {
        for (var n, e = 0; n = this._addons[e]; e++) n.update(t)
    },
    _computeInputContentClass: function(t, n, e, i, a) {
        var u = "input-content";
        if (t) a && (u += " label-is-hidden"), i && (u += " is-invalid");
        else {
            var l = this.querySelector("label");
            n || a ? (u += " label-is-floating", this.$.labelAndInputContainer.style.position = "static", i ? u += " is-invalid" : e && (u += " label-is-highlighted")) : (l && (this.$.labelAndInputContainer.style.position = "relative"), i && (u += " is-invalid"))
        }
        return e && (u += " focused"), u
    },
    _computeUnderlineClass: function(t, n) {
        var e = "underline";
        return n ? e += " is-invalid" : t && (e += " is-highlighted"), e
    },
    _computeAddOnContentClass: function(t, n) {
        var e = "add-on-content";
        return n ? e += " is-invalid" : t && (e += " is-highlighted"), e
    }
});
