
"use strict";
Polymer({
    is: "iron-request",
    hostAttributes: {
        hidden: !0
    },
    properties: {
        xhr: {
            type: Object,
            notify: !0,
            readOnly: !0,
            value: function() {
                return new XMLHttpRequest
            }
        },
        response: {
            type: Object,
            notify: !0,
            readOnly: !0,
            value: function() {
                return null
            }
        },
        status: {
            type: Number,
            notify: !0,
            readOnly: !0,
            value: 0
        },
        statusText: {
            type: String,
            notify: !0,
            readOnly: !0,
            value: ""
        },
        completes: {
            type: Object,
            readOnly: !0,
            notify: !0,
            value: function() {
                return new Promise(function(e, t) {
                    this.resolveCompletes = e, this.rejectCompletes = t
                }.bind(this))
            }
        },
        progress: {
            type: Object,
            notify: !0,
            readOnly: !0,
            value: function() {
                return {}
            }
        },
        aborted: {
            type: Boolean,
            notify: !0,
            readOnly: !0,
            value: !1
        },
        errored: {
            type: Boolean,
            notify: !0,
            readOnly: !0,
            value: !1
        },
        timedOut: {
            type: Boolean,
            notify: !0,
            readOnly: !0,
            value: !1
        }
    },
    get succeeded() {
        if (this.errored || this.aborted || this.timedOut) return !1;
        var e = this.xhr.status || 0;
        return 0 === e || e >= 200 && e < 300
    },
    send: function(e) {
        var t = this.xhr;
        if (t.readyState > 0) return null;
        t.addEventListener("progress", function(e) {
            this._setProgress({
                lengthComputable: e.lengthComputable,
                loaded: e.loaded,
                total: e.total
            })
        }.bind(this)), t.addEventListener("error", function(t) {
            this._setErrored(!0), this._updateStatus();
            var r = e.rejectWithRequest ? {
                error: t,
                request: this
            } : t;
            this.rejectCompletes(r)
        }.bind(this)), t.addEventListener("timeout", function(t) {
            this._setTimedOut(!0), this._updateStatus();
            var r = e.rejectWithRequest ? {
                error: t,
                request: this
            } : t;
            this.rejectCompletes(r)
        }.bind(this)), t.addEventListener("abort", function() {
            this._setAborted(!0), this._updateStatus();
            var t = new Error("Request aborted."),
                r = e.rejectWithRequest ? {
                    error: t,
                    request: this
                } : t;
            this.rejectCompletes(r)
        }.bind(this)), t.addEventListener("loadend", function() {
            if (this._updateStatus(), this._setResponse(this.parseResponse()), !this.succeeded) {
                var t = new Error("The request failed with status code: " + this.xhr.status),
                    r = e.rejectWithRequest ? {
                        error: t,
                        request: this
                    } : t;
                return void this.rejectCompletes(r)
            }
            this.resolveCompletes(this)
        }.bind(this)), this.url = e.url;
        var r = e.async !== !1;
        t.open(e.method || "GET", e.url, r);
        var s = {
                json: "application/json",
                text: "text/plain",
                html: "text/html",
                xml: "application/xml",
                arraybuffer: "application/octet-stream"
            }[e.handleAs],
            n = e.headers || Object.create(null),
            o = Object.create(null);
        for (var i in n) o[i.toLowerCase()] = n[i];
        if (n = o, s && !n.accept && (n.accept = s), Object.keys(n).forEach(function(e) {
                /[A-Z]/.test(e) && Polymer.Base._error("Headers must be lower case, got", e), t.setRequestHeader(e, n[e])
            }, this), r) {
            t.timeout = e.timeout;
            var a = e.handleAs;
            !e.jsonPrefix && a || (a = "text"), t.responseType = t._responseType = a, e.jsonPrefix && (t._jsonPrefix = e.jsonPrefix)
        }
        t.withCredentials = !!e.withCredentials;
        var u = this._encodeBodyObject(e.body, n["content-type"]);
        return t.send(u), this.completes
    },
    parseResponse: function() {
        var e = this.xhr,
            t = e.responseType || e._responseType,
            r = !this.xhr.responseType,
            s = e._jsonPrefix && e._jsonPrefix.length || 0;
        try {
            switch (t) {
                case "json":
                    if (r || void 0 === e.response) try {
                        return JSON.parse(e.responseText)
                    } catch (e) {
                        return null
                    }
                    return e.response;
                case "xml":
                    return e.responseXML;
                case "blob":
                case "document":
                case "arraybuffer":
                    return e.response;
                case "text":
                default:
                    if (s) try {
                        return JSON.parse(e.responseText.substring(s))
                    } catch (e) {
                        return null
                    }
                    return e.responseText
            }
        } catch (e) {
            this.rejectCompletes(new Error("Could not parse response. " + e.message))
        }
    },
    abort: function() {
        this._setAborted(!0), this.xhr.abort()
    },
    _encodeBodyObject: function(e, t) {
        if ("string" == typeof e) return e;
        var r = e;
        switch (t) {
            case "application/json":
                return JSON.stringify(r);
            case "application/x-www-form-urlencoded":
                return this._wwwFormUrlEncode(r)
        }
        return e
    },
    _wwwFormUrlEncode: function(e) {
        if (!e) return "";
        var t = [];
        return Object.keys(e).forEach(function(r) {
            t.push(this._wwwFormUrlEncodePiece(r) + "=" + this._wwwFormUrlEncodePiece(e[r]))
        }, this), t.join("&")
    },
    _wwwFormUrlEncodePiece: function(e) {
        return null !== e && void 0 !== e && e.toString ? encodeURIComponent(e.toString().replace(/\r?\n/g, "\r\n")).replace(/%20/g, "+") : ""
    },
    _updateStatus: function() {
        this._setStatus(this.xhr.status), this._setStatusText(void 0 === this.xhr.statusText ? "" : this.xhr.statusText)
    }
});


"use strict";
Polymer({
    is: "iron-ajax",
    hostAttributes: {
        hidden: !0
    },
    properties: {
        url: {
            type: String
        },
        params: {
            type: Object,
            value: function() {
                return {}
            }
        },
        method: {
            type: String,
            value: "GET"
        },
        headers: {
            type: Object,
            value: function() {
                return {}
            }
        },
        contentType: {
            type: String,
            value: null
        },
        body: {
            type: Object,
            value: null
        },
        sync: {
            type: Boolean,
            value: !1
        },
        handleAs: {
            type: String,
            value: "json"
        },
        withCredentials: {
            type: Boolean,
            value: !1
        },
        timeout: {
            type: Number,
            value: 0
        },
        auto: {
            type: Boolean,
            value: !1
        },
        verbose: {
            type: Boolean,
            value: !1
        },
        lastRequest: {
            type: Object,
            notify: !0,
            readOnly: !0
        },
        loading: {
            type: Boolean,
            notify: !0,
            readOnly: !0
        },
        lastResponse: {
            type: Object,
            notify: !0,
            readOnly: !0
        },
        lastError: {
            type: Object,
            notify: !0,
            readOnly: !0
        },
        activeRequests: {
            type: Array,
            notify: !0,
            readOnly: !0,
            value: function() {
                return []
            }
        },
        debounceDuration: {
            type: Number,
            value: 0,
            notify: !0
        },
        jsonPrefix: {
            type: String,
            value: ""
        },
        bubbles: {
            type: Boolean,
            value: !1
        },
        rejectWithRequest: {
            type: Boolean,
            value: !1
        },
        _boundHandleResponse: {
            type: Function,
            value: function() {
                return this._handleResponse.bind(this)
            }
        }
    },
    observers: ["_requestOptionsChanged(url, method, params.*, headers, contentType, body, sync, handleAs, jsonPrefix, withCredentials, timeout, auto)"],
    get queryString() {
        var e, t, s = [];
        for (e in this.params)
            if (t = this.params[e], e = window.encodeURIComponent(e), Array.isArray(t))
                for (var n = 0; n < t.length; n++) s.push(e + "=" + window.encodeURIComponent(t[n]));
            else null !== t ? s.push(e + "=" + window.encodeURIComponent(t)) : s.push(e);
        return s.join("&")
    },
    get requestUrl() {
        var e = this.queryString,
            t = this.url || "";
        if (e) {
            var s = t.indexOf("?") >= 0 ? "&" : "?";
            return t + s + e
        }
        return t
    },
    get requestHeaders() {
        var e = {},
            t = this.contentType;
        null == t && "string" == typeof this.body && (t = "application/x-www-form-urlencoded"), t && (e["content-type"] = t);
        var s;
        if ("object" == typeof this.headers)
            for (s in this.headers) e[s] = this.headers[s].toString();
        return e
    },
    toRequestOptions: function() {
        return {
            url: this.requestUrl || "",
            method: this.method,
            headers: this.requestHeaders,
            body: this.body,
            async: !this.sync,
            handleAs: this.handleAs,
            jsonPrefix: this.jsonPrefix,
            withCredentials: this.withCredentials,
            timeout: this.timeout,
            rejectWithRequest: this.rejectWithRequest
        }
    },
    generateRequest: function() {
        var e = document.createElement("iron-request"),
            t = this.toRequestOptions();
        this.push("activeRequests", e), e.completes.then(this._boundHandleResponse).catch(this._handleError.bind(this, e)).then(this._discardRequest.bind(this, e));
        var s = this.fire("iron-ajax-presend", {
            request: e,
            options: t
        }, {
            bubbles: this.bubbles,
            cancelable: !0
        });
        return s.defaultPrevented ? (e.abort(), e.rejectCompletes(e), e) : (e.send(t), this._setLastRequest(e), this._setLoading(!0), this.fire("request", {
            request: e,
            options: t
        }, {
            bubbles: this.bubbles,
            composed: !0
        }), this.fire("iron-ajax-request", {
            request: e,
            options: t
        }, {
            bubbles: this.bubbles,
            composed: !0
        }), e)
    },
    _handleResponse: function(e) {
        e === this.lastRequest && (this._setLastResponse(e.response), this._setLastError(null), this._setLoading(!1)), this.fire("response", e, {
            bubbles: this.bubbles,
            composed: !0
        }), this.fire("iron-ajax-response", e, {
            bubbles: this.bubbles,
            composed: !0
        })
    },
    _handleError: function(e, t) {
        this.verbose && Polymer.Base._error(t), e === this.lastRequest && (this._setLastError({
            request: e,
            error: t,
            status: e.xhr.status,
            statusText: e.xhr.statusText,
            response: e.xhr.response
        }), this._setLastResponse(null), this._setLoading(!1)), this.fire("iron-ajax-error", {
            request: e,
            error: t
        }, {
            bubbles: this.bubbles,
            composed: !0
        }), this.fire("error", {
            request: e,
            error: t
        }, {
            bubbles: this.bubbles,
            composed: !0
        })
    },
    _discardRequest: function(e) {
        var t = this.activeRequests.indexOf(e);
        t > -1 && this.splice("activeRequests", t, 1)
    },
    _requestOptionsChanged: function() {
        this.debounce("generate-request", function() {
            null != this.url && this.auto && this.generateRequest()
        }, this.debounceDuration)
    }
});
