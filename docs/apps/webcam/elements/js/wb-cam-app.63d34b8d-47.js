
define("elements/wb-duration.js", ["../../components/w69b-es6/timeutil.js"], function(e) {
    "use strict";

    function n(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function t(e, n) {
        if (!(e instanceof n)) throw new TypeError("Cannot call a class as a function")
    }
    var r = n(e),
        i = function() {
            function e(e, n) {
                for (var t = 0; t < n.length; t++) {
                    var r = n[t];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
                }
            }
            return function(n, t, r) {
                return t && e(n.prototype, t), r && e(n, r), n
            }
        }(),
        o = function() {
            function e() {
                t(this, e)
            }
            return i(e, [{
                key: "beforeRegister",
                value: function() {
                    this.is = "wb-duration", this.properties = {
                        time: {
                            type: Number
                        }
                    }
                }
            }, {
                key: "_toDuration",
                value: function(e) {
                    return r.default.formatDuration(e)
                }
            }]), e
        }();
    Polymer(o)
});


! function() {
    "use strict";
    Polymer.IronJsonpLibraryBehavior = {
        properties: {
            libraryLoaded: {
                type: Boolean,
                value: !1,
                notify: !0,
                readOnly: !0
            },
            libraryErrorMessage: {
                type: String,
                value: null,
                notify: !0,
                readOnly: !0
            }
        },
        observers: ["_libraryUrlChanged(libraryUrl)"],
        _libraryUrlChanged: function(r) {
            this._isReady && this.libraryUrl && this._loadLibrary()
        },
        _libraryLoadCallback: function(r, i) {
            r ? (Polymer.Base._warn("Library load failed:", r.message), this._setLibraryErrorMessage(r.message)) : (this._setLibraryErrorMessage(null), this._setLibraryLoaded(!0), this.notifyEvent && this.fire(this.notifyEvent, i))
        },
        _loadLibrary: function() {
            r.require(this.libraryUrl, this._libraryLoadCallback.bind(this), this.callbackName)
        },
        ready: function() {
            this._isReady = !0, this.libraryUrl && this._loadLibrary()
        }
    };
    var r = {
            apiMap: {},
            require: function(r, t, e) {
                var a = this.nameFromUrl(r);
                this.apiMap[a] || (this.apiMap[a] = new i(a, r, e)), this.apiMap[a].requestNotify(t)
            },
            nameFromUrl: function(r) {
                return r.replace(/[\:\/\%\?\&\.\=\-\,]/g, "_") + "_api"
            }
        },
        i = function(r, i, t) {
            if (this.notifiers = [], !t) {
                if (!(i.indexOf(this.callbackMacro) >= 0)) return void(this.error = new Error("IronJsonpLibraryBehavior a %%callback%% parameter is required in libraryUrl"));
                t = r + "_loaded", i = i.replace(this.callbackMacro, t)
            }
            this.callbackName = t, window[this.callbackName] = this.success.bind(this), this.addScript(i)
        };
    i.prototype = {
        callbackMacro: "%%callback%%",
        loaded: !1,
        addScript: function(r) {
/*
            var i = document.createElement("script");
            i.src = r, i.onerror = this.handleError.bind(this);
            var t = document.querySelector("script") || document.body;
            t.parentNode.insertBefore(i, t), this.script = i
*/
        },
        removeScript: function() {
            this.script.parentNode && this.script.parentNode.removeChild(this.script), this.script = null
        },
        handleError: function(r) {
            this.error = new Error("Library failed to load"), this.notifyAll(), this.cleanup()
        },
        success: function() {
            this.loaded = !0, this.result = Array.prototype.slice.call(arguments), this.notifyAll(), this.cleanup()
        },
        cleanup: function() {
            delete window[this.callbackName]
        },
        notifyAll: function() {
            this.notifiers.forEach(function(r) {
                r(this.error, this.result)
            }.bind(this)), this.notifiers = []
        },
        requestNotify: function(r) {
            this.loaded || this.error ? r(this.error, this.result) : this.notifiers.push(r)
        }
    }
}();


Polymer({
    is: "iron-jsonp-library",
    behaviors: [Polymer.IronJsonpLibraryBehavior],
    properties: {
        libraryUrl: String,
        callbackName: String,
        notifyEvent: String
    }
});


Polymer({
    is: "google-youtube-api",
    behaviors: [Polymer.IronJsonpLibraryBehavior],
    properties: {
        libraryUrl: {
            type: String,
            value: "https://www.youtube.com/iframe_api"
        },
        notifyEvent: {
            type: String,
            value: "api-load"
        },
        callbackName: {
            type: String,
            value: "onYouTubeIframeAPIReady"
        }
    },
    get api() {
        return YT
    }
});
