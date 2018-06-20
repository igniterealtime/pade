
define("elements/wb-stream-preview.js", [], function() {
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
                    this.is = "wb-stream-preview", this.properties = {
                        stream: {
                            type: Object,
                            observer: "_streamChanged"
                        }
                    }
                }
            }, {
                key: "ready",
                value: function() {
                    this.$.video.volume = 0
                }
            }, {
                key: "_onCanplay",
                value: function() {
                    var e = this.$.video;
                    console.log("resolution: " + e.videoWidth + "x" + e.videoHeight)
                }
            }, {
                key: "_streamChanged",
                value: function(e) {
                    console.log("xxx", e), e && (this.$.video.srcObject = e, console.log(this.$.video), this.$.video.play())
                }
            }]), t
        }();
    Polymer(t)
});
