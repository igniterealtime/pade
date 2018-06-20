define("elements/wb-overlay.js", [], function() {
    "use strict";

    function e(e, n) {
        if (!(e instanceof n)) throw new TypeError("Cannot call a class as a function")
    }
    var n = function() {
            function e(e, n) {
                for (var r = 0; r < n.length; r++) {
                    var t = n[r];
                    t.enumerable = t.enumerable || !1, t.configurable = !0, "value" in t && (t.writable = !0), Object.defineProperty(e, t.key, t)
                }
            }
            return function(n, r, t) {
                return r && e(n.prototype, r), t && e(n, t), n
            }
        }(),
        r = function() {
            function r() {
                e(this, r)
            }
            return n(r, [{
                key: "beforeRegister",
                value: function() {
                    this.is = "wb-overlay"
                }
            }]), r
        }();
    Polymer(r)
});
