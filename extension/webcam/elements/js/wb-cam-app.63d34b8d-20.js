
Polymer.IronValidatableBehaviorMeta = null, Polymer.IronValidatableBehavior = {
    properties: {
        validator: {
            type: String
        },
        invalid: {
            notify: !0,
            reflectToAttribute: !0,
            type: Boolean,
            value: !1
        },
        _validatorMeta: {
            type: Object
        },
        validatorType: {
            type: String,
            value: "validator"
        },
        _validator: {
            type: Object,
            computed: "__computeValidator(validator)"
        }
    },
    observers: ["_invalidChanged(invalid)"],
    registered: function() {
        Polymer.IronValidatableBehaviorMeta = new Polymer.IronMeta({
            type: "validator"
        })
    },
    _invalidChanged: function() {
        this.invalid ? this.setAttribute("aria-invalid", "true") : this.removeAttribute("aria-invalid")
    },
    hasValidator: function() {
        return null != this._validator
    },
    validate: function(a) {
        return this.invalid = !this._getValidity(a), !this.invalid
    },
    _getValidity: function(a) {
        return !this.hasValidator() || this._validator.validate(a)
    },
    __computeValidator: function() {
        return Polymer.IronValidatableBehaviorMeta && Polymer.IronValidatableBehaviorMeta.byKey(this.validator)
    }
};


Polymer({
    is: "iron-input",
    extends: "input",
    behaviors: [Polymer.IronValidatableBehavior],
    properties: {
        bindValue: {
            observer: "_bindValueChanged",
            type: String
        },
        preventInvalidInput: {
            type: Boolean
        },
        allowedPattern: {
            type: String,
            observer: "_allowedPatternChanged"
        },
        _previousValidInput: {
            type: String,
            value: ""
        },
        _patternAlreadyChecked: {
            type: Boolean,
            value: !1
        }
    },
    listeners: {
        input: "_onInput",
        keypress: "_onKeypress"
    },
    registered: function() {
        this._canDispatchEventOnDisabled() || (this._origDispatchEvent = this.dispatchEvent, this.dispatchEvent = this._dispatchEventFirefoxIE)
    },
    created: function() {
        Polymer.IronA11yAnnouncer.requestAvailability()
    },
    _canDispatchEventOnDisabled: function() {
        var e = document.createElement("input"),
            t = !1;
        e.disabled = !0, e.addEventListener("feature-check-dispatch-event", function() {
            t = !0
        });
        try {
            e.dispatchEvent(new Event("feature-check-dispatch-event"))
        } catch (e) {}
        return t
    },
    _dispatchEventFirefoxIE: function(e) {
        var t = this.disabled;
        this.disabled = !1;
        var i = this._origDispatchEvent(e);
        return this.disabled = t, i
    },
    get _patternRegExp() {
        var e;
        if (this.allowedPattern) e = new RegExp(this.allowedPattern);
        else switch (this.type) {
            case "number":
                e = /[0-9.,e-]/
        }
        return e
    },
    ready: function() {
        this.bindValue = this.value
    },
    _bindValueChanged: function() {
        this.value !== this.bindValue && (this.value = this.bindValue || 0 === this.bindValue || this.bindValue === !1 ? this.bindValue : ""), this.fire("bind-value-changed", {
            value: this.bindValue
        })
    },
    _allowedPatternChanged: function() {
        this.preventInvalidInput = !!this.allowedPattern
    },
    _onInput: function() {
        if (this.preventInvalidInput && !this._patternAlreadyChecked) {
            var e = this._checkPatternValidity();
            e || (this._announceInvalidCharacter("Invalid string of characters not entered."), this.value = this._previousValidInput)
        }
        this.bindValue = this.value, this._previousValidInput = this.value, this._patternAlreadyChecked = !1
    },
    _isPrintable: function(e) {
        var t = 8 == e.keyCode || 9 == e.keyCode || 13 == e.keyCode || 27 == e.keyCode,
            i = 19 == e.keyCode || 20 == e.keyCode || 45 == e.keyCode || 46 == e.keyCode || 144 == e.keyCode || 145 == e.keyCode || e.keyCode > 32 && e.keyCode < 41 || e.keyCode > 111 && e.keyCode < 124;
        return !(t || 0 == e.charCode && i)
    },
    _onKeypress: function(e) {
        if (this.preventInvalidInput || "number" === this.type) {
            var t = this._patternRegExp;
            if (t && !(e.metaKey || e.ctrlKey || e.altKey)) {
                this._patternAlreadyChecked = !0;
                var i = String.fromCharCode(e.charCode);
                this._isPrintable(e) && !t.test(i) && (e.preventDefault(), this._announceInvalidCharacter("Invalid character " + i + " not entered."))
            }
        }
    },
    _checkPatternValidity: function() {
        var e = this._patternRegExp;
        if (!e) return !0;
        for (var t = 0; t < this.value.length; t++)
            if (!e.test(this.value[t])) return !1;
        return !0
    },
    validate: function() {
        var e = this.checkValidity();
        return e && (this.required && "" === this.value ? e = !1 : this.hasValidator() && (e = Polymer.IronValidatableBehavior.validate.call(this, this.value))), this.invalid = !e, this.fire("iron-input-validate"), e
    },
    _announceInvalidCharacter: function(e) {
        this.fire("iron-announce", {
            text: e
        })
    }
});


Polymer.PaperInputHelper = {}, Polymer.PaperInputHelper.NextLabelID = 1, Polymer.PaperInputHelper.NextAddonID = 1, Polymer.PaperInputBehaviorImpl = {
    properties: {
        label: {
            type: String
        },
        value: {
            notify: !0,
            type: String
        },
        disabled: {
            type: Boolean,
            value: !1
        },
        invalid: {
            type: Boolean,
            value: !1,
            notify: !0
        },
        preventInvalidInput: {
            type: Boolean
        },
        allowedPattern: {
            type: String
        },
        type: {
            type: String
        },
        list: {
            type: String
        },
        pattern: {
            type: String
        },
        required: {
            type: Boolean,
            value: !1
        },
        errorMessage: {
            type: String
        },
        charCounter: {
            type: Boolean,
            value: !1
        },
        noLabelFloat: {
            type: Boolean,
            value: !1
        },
        alwaysFloatLabel: {
            type: Boolean,
            value: !1
        },
        autoValidate: {
            type: Boolean,
            value: !1
        },
        validator: {
            type: String
        },
        autocomplete: {
            type: String,
            value: "off"
        },
        autofocus: {
            type: Boolean,
            observer: "_autofocusChanged"
        },
        inputmode: {
            type: String
        },
        minlength: {
            type: Number
        },
        maxlength: {
            type: Number
        },
        min: {
            type: String
        },
        max: {
            type: String
        },
        step: {
            type: String
        },
        name: {
            type: String
        },
        placeholder: {
            type: String,
            value: ""
        },
        readonly: {
            type: Boolean,
            value: !1
        },
        size: {
            type: Number
        },
        autocapitalize: {
            type: String,
            value: "none"
        },
        autocorrect: {
            type: String,
            value: "off"
        },
        autosave: {
            type: String
        },
        results: {
            type: Number
        },
        accept: {
            type: String
        },
        multiple: {
            type: Boolean
        },
        _ariaDescribedBy: {
            type: String,
            value: ""
        },
        _ariaLabelledBy: {
            type: String,
            value: ""
        }
    },
    listeners: {
        "addon-attached": "_onAddonAttached"
    },
    keyBindings: {
        "shift+tab:keydown": "_onShiftTabDown"
    },
    hostAttributes: {
        tabindex: 0
    },
    get inputElement() {
        return this.$.input
    },
    get _focusableElement() {
        return this.inputElement
    },
    registered: function() {
        this._typesThatHaveText = ["date", "datetime", "datetime-local", "month", "time", "week", "file"]
    },
    attached: function() {
        this._updateAriaLabelledBy(), this.inputElement && this._typesThatHaveText.indexOf(this.inputElement.type) !== -1 && (this.alwaysFloatLabel = !0)
    },
    _appendStringWithSpace: function(e, t) {
        return e = e ? e + " " + t : t
    },
    _onAddonAttached: function(e) {
        var t = e.path ? e.path[0] : e.target;
        if (t.id) this._ariaDescribedBy = this._appendStringWithSpace(this._ariaDescribedBy, t.id);
        else {
            var a = "paper-input-add-on-" + Polymer.PaperInputHelper.NextAddonID++;
            t.id = a, this._ariaDescribedBy = this._appendStringWithSpace(this._ariaDescribedBy, a)
        }
    },
    validate: function() {
        return this.inputElement.validate()
    },
    _focusBlurHandler: function(e) {
        Polymer.IronControlState._focusBlurHandler.call(this, e), this.focused && !this._shiftTabPressed && this._focusableElement.focus()
    },
    _onShiftTabDown: function(e) {
        var t = this.getAttribute("tabindex");
        this._shiftTabPressed = !0, this.setAttribute("tabindex", "-1"), this.async(function() {
            this.setAttribute("tabindex", t), this._shiftTabPressed = !1
        }, 1)
    },
    _handleAutoValidate: function() {
        this.autoValidate && this.validate()
    },
    updateValueAndPreserveCaret: function(e) {
        try {
            var t = this.inputElement.selectionStart;
            this.value = e, this.inputElement.selectionStart = t, this.inputElement.selectionEnd = t
        } catch (t) {
            this.value = e
        }
    },
    _computeAlwaysFloatLabel: function(e, t) {
        return t || e
    },
    _updateAriaLabelledBy: function() {
        var e = Polymer.dom(this.root).querySelector("label");
        if (!e) return void(this._ariaLabelledBy = "");
        var t;
        e.id ? t = e.id : (t = "paper-input-label-" + Polymer.PaperInputHelper.NextLabelID++, e.id = t), this._ariaLabelledBy = t
    },
    _onChange: function(e) {
        this.shadowRoot && this.fire(e.type, {
            sourceEvent: e
        }, {
            node: this,
            bubbles: e.bubbles,
            cancelable: e.cancelable
        })
    },
    _autofocusChanged: function() {
        if (this.autofocus && this._focusableElement) {
            var e = document.activeElement,
                t = e instanceof HTMLElement,
                a = t && e !== document.body && e !== document.documentElement;
            a || this._focusableElement.focus()
        }
    }
}, Polymer.PaperInputBehavior = [Polymer.IronControlState, Polymer.IronA11yKeysBehavior, Polymer.PaperInputBehaviorImpl];


Polymer.PaperInputAddonBehavior = {
    hostAttributes: {
        "add-on": ""
    },
    attached: function() {
        this.fire("addon-attached")
    },
    update: function(t) {}
};
