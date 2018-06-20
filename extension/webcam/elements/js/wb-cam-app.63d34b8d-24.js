
Polymer({
    is: "iron-autogrow-textarea",
    behaviors: [Polymer.IronFormElementBehavior, Polymer.IronValidatableBehavior, Polymer.IronControlState],
    properties: {
        bindValue: {
            observer: "_bindValueChanged",
            type: String
        },
        rows: {
            type: Number,
            value: 1,
            observer: "_updateCached"
        },
        maxRows: {
            type: Number,
            value: 0,
            observer: "_updateCached"
        },
        autocomplete: {
            type: String,
            value: "off"
        },
        autofocus: {
            type: Boolean,
            value: !1
        },
        inputmode: {
            type: String
        },
        placeholder: {
            type: String
        },
        readonly: {
            type: String
        },
        required: {
            type: Boolean
        },
        minlength: {
            type: Number
        },
        maxlength: {
            type: Number
        }
    },
    listeners: {
        input: "_onInput"
    },
    observers: ["_onValueChanged(value)"],
    get textarea() {
        return this.$.textarea
    },
    get selectionStart() {
        return this.$.textarea.selectionStart
    },
    get selectionEnd() {
        return this.$.textarea.selectionEnd
    },
    set selectionStart(e) {
        this.$.textarea.selectionStart = e
    },
    set selectionEnd(e) {
        this.$.textarea.selectionEnd = e
    },
    attached: function() {
        var e = navigator.userAgent.match(/iP(?:[oa]d|hone)/);
        e && (this.$.textarea.style.marginLeft = "-3px")
    },
    validate: function() {
        if (!this.required && "" == this.value) return this.invalid = !1, !0;
        var e;
        return this.hasValidator() ? e = Polymer.IronValidatableBehavior.validate.call(this, this.value) : (e = this.$.textarea.validity.valid, this.invalid = !e), this.fire("iron-input-validate"), e
    },
    _bindValueChanged: function() {
        var e = this.textarea;
        e && (e.value !== this.bindValue && (e.value = this.bindValue || 0 === this.bindValue ? this.bindValue : ""), this.value = this.bindValue, this.$.mirror.innerHTML = this._valueForMirror(), this.fire("bind-value-changed", {
            value: this.bindValue
        }))
    },
    _onInput: function(e) {
        this.bindValue = e.path ? e.path[0].value : e.target.value
    },
    _constrain: function(e) {
        var t;
        for (e = e || [""], t = this.maxRows > 0 && e.length > this.maxRows ? e.slice(0, this.maxRows) : e.slice(0); this.rows > 0 && t.length < this.rows;) t.push("");
        return t.join("<br/>") + "&#160;"
    },
    _valueForMirror: function() {
        var e = this.textarea;
        if (e) return this.tokens = e && e.value ? e.value.replace(/&/gm, "&amp;").replace(/"/gm, "&quot;").replace(/'/gm, "&#39;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").split("\n") : [""], this._constrain(this.tokens)
    },
    _updateCached: function() {
        this.$.mirror.innerHTML = this._constrain(this.tokens)
    },
    _onValueChanged: function() {
        this.bindValue = this.value
    }
});
