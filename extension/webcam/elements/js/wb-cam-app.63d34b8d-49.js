
define("elements/wb-grant-stream-help.js", [], function() {
    "use strict";

    function e(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
    }
    var t = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var i = t[n];
                    i.enumerable = i.enumerable || !1, i.configurable = !0, "value" in i && (i.writable = !0), Object.defineProperty(e, i.key, i)
                }
            }
            return function(t, n, i) {
                return n && e(t.prototype, n), i && e(t, i), t
            }
        }(),
        n = function() {
            function n() {
                e(this, n)
            }
            return t(n, [{
                key: "beforeRegister",
                value: function() {
                    this.is = "wb-grant-stream-help"
                }
            }, {
                key: "ready",
                value: function() {
                    navigator.userAgent.includes("Chrome") ? this._videoId = "n9X-ereqeKU" : this._videoId = "OT99igvII58"
                }
            }, {
                key: "attached",
                value: function() {
                    this.listen(window, "wb-got-cam-stream", "_gotStream")
                }
            }, {
                key: "detached",
                value: function() {
                    this.listen(window, "wb-got-cam-stream", "_gotStream")
                }
            }, {
                key: "_gotStream",
                value: function() {
                    this.$.dialog.close()
                }
            }, {
                key: "show",
                value: function() {
                    this.$.dialog.open()
                }
            }]), n
        }();
    Polymer(n)
});
