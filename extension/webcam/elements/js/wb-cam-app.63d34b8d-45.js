define("elements/wb-main-toolbar.js", [], function() {
    "use strict";

    function e(e, n) {
        if (!(e instanceof n)) throw new TypeError("Cannot call a class as a function")
    }
    var n = function() {
            function e(e, n) {
                for (var t = 0; t < n.length; t++) {
                    var o = n[t];
                    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, o.key, o)
                }
            }
            return function(n, t, o) {
                return t && e(n.prototype, t), o && e(n, o), n
            }
        }(),
        t = function() {
            function t() {
                e(this, t)
            }
            return n(t, [{
                key: "beforeRegister",
                value: function() {
                    this.is = "wb-main-toolbar"
                }
            }, {
                key: "_goBack",
                value: function() {
                    this.fire("wb-go-back")
                }
            }, {
                key: "_toggleMenu",
                value: function() {
                    // BAO
                    //app.toggleMenu()
                }
            }]), t
        }();
    Polymer(t)
});
