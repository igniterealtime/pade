
Polymer({
    is: "iron-form",
    properties: {
        allowRedirect: {
            type: Boolean,
            value: !1
        },
        headers: {
            type: Object,
            value: function() {
                return {}
            }
        },
        withCredentials: {
            type: Boolean,
            value: !1
        }
    },
    attached: function() {
        this._nodeObserver = Polymer.dom(this).observeNodes(function(e) {
            for (var t = 0; t < e.addedNodes.length; t++) "FORM" !== e.addedNodes[t].tagName || this._alreadyCalledInit || (this._alreadyCalledInit = !0, this._form = e.addedNodes[t], this._init())
        }.bind(this))
    },
    detached: function() {
        this._nodeObserver && (Polymer.dom(this).unobserveNodes(this._nodeObserver), this._nodeObserver = null)
    },
    _init: function() {
        this._form.addEventListener("submit", this.submit.bind(this)), this._form.addEventListener("reset", this.reset.bind(this)), this._defaults = this._defaults || new WeakMap;
        for (var e = this._getSubmittableElements(), t = 0; t < e.length; t++) {
            var i = e[t];
            this._defaults.has(i) || this._defaults.set(i, {
                checked: i.checked,
                value: i.value
            })
        }
    },
    validate: function() {
        if ("" === this._form.getAttribute("novalidate")) return !0;
        for (var e, t = this._form.checkValidity(), i = this._getValidatableElements(), r = 0; e = i[r], r < i.length; r++) {
            var s = e;
            s.validate && (t = !!s.validate() && t)
        }
        return t
    },
    submit: function(e) {
        if (e && e.preventDefault(), this._form) {
            if (!this.validate()) return void this.fire("iron-form-invalid");
            this.$.helper.textContent = "";
            var t = this.serializeForm();
            if (this.allowRedirect) {
                for (var i in t) this.$.helper.appendChild(this._createHiddenElement(i, t[i]));
                this.$.helper.action = this._form.getAttribute("action"), this.$.helper.method = this._form.getAttribute("method") || "GET", this.$.helper.contentType = this._form.getAttribute("enctype") || "application/x-www-form-urlencoded", this.$.helper.submit(), this.fire("iron-form-submit")
            } else this._makeAjaxRequest(t)
        }
    },
    reset: function(e) {
        if (e && e.preventDefault(), this._form)
            for (var t = this._getSubmittableElements(), i = 0; i < t.length; i++) {
                var r = t[i];
                if (this._defaults.has(r)) {
                    var s = this._defaults.get(r);
                    r.value = s.value, r.checked = s.checked
                }
            }
    },
    serializeForm: function() {
        for (var e = this._getSubmittableElements(), t = {}, i = 0; i < e.length; i++)
            for (var r = this._serializeElementValues(e[i]), s = 0; s < r.length; s++) this._addSerializedElement(t, e[i].name, r[s]);
        return t
    },
    _handleFormResponse: function(e) {
        this.fire("iron-form-response", e.detail)
    },
    _handleFormError: function(e) {
        this.fire("iron-form-error", e.detail)
    },
    _makeAjaxRequest: function(e) {
        this.request || (this.request = document.createElement("iron-ajax"), this.request.addEventListener("response", this._handleFormResponse.bind(this)), this.request.addEventListener("error", this._handleFormError.bind(this))), this.request.url = this._form.getAttribute("action"), this.request.method = this._form.getAttribute("method") || "GET", this.request.contentType = this._form.getAttribute("enctype") || "application/x-www-form-urlencoded", this.request.withCredentials = this.withCredentials, this.request.headers = this.headers, "POST" === this._form.method.toUpperCase() ? this.request.body = e : this.request.params = e;
        var t = this.fire("iron-form-presubmit", {}, {
            cancelable: !0
        });
        t.defaultPrevented || (this.request.generateRequest(), this.fire("iron-form-submit", e))
    },
    _getValidatableElements: function() {
        return this._findElements(this._form, !0)
    },
    _getSubmittableElements: function() {
        return this._findElements(this._form, !1)
    },
    _findElements: function(e, t) {
        for (var i = Polymer.dom(e).querySelectorAll("*"), r = [], s = 0; s < i.length; s++) {
            var n = i[s];
            n.disabled || !t && !n.name ? n.root && Array.prototype.push.apply(r, this._findElements(n.root, t)) : r.push(n)
        }
        return r
    },
    _serializeElementValues: function(e) {
        var t = e.tagName.toLowerCase();
        return "button" === t || "input" === t && ("submit" === e.type || "reset" === e.type) ? [] : "select" === t ? this._serializeSelectValues(e) : "input" === t ? this._serializeInputValues(e) : e._hasIronCheckedElementBehavior && !e.checked ? [] : [e.value]
    },
    _serializeSelectValues: function(e) {
        for (var t = [], i = 0; i < e.options.length; i++) e.options[i].selected && t.push(e.options[i].value);
        return t
    },
    _serializeInputValues: function(e) {
        var t = e.type.toLowerCase();
        return ("checkbox" !== t && "radio" !== t || e.checked) && "file" !== t ? [e.value] : []
    },
    _createHiddenElement: function(e, t) {
        var i = document.createElement("input");
        return i.setAttribute("type", "hidden"), i.setAttribute("name", e), i.setAttribute("value", t), i
    },
    _addSerializedElement: function(e, t, i) {
        void 0 === e[t] ? e[t] = i : (Array.isArray(e[t]) || (e[t] = [e[t]]), e[t].push(i))
    }
});
