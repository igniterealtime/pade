
define("elements/wb-record-view.js", [], function() {
    "use strict";

    function e(e, o) {
        if (!(e instanceof o)) throw new TypeError("Cannot call a class as a function")
    }
    var o = function() {
            function e(e, o) {
                for (var n = 0; n < o.length; n++) {
                    var t = o[n];
                    t.enumerable = t.enumerable || !1, t.configurable = !0, "value" in t && (t.writable = !0), Object.defineProperty(e, t.key, t)
                }
            }
            return function(o, n, t) {
                return n && e(o.prototype, n), t && e(o, t), o
            }
        }(),
        n = function() {
            function n() {
                e(this, n)
            }
            return o(n, [{
                key: "beforeRegister",
                value: function() {
                    this.is = "wb-record-view", this.listeners = {
                        "wb-recorder-stopped": "_onRecordingDone",
                        "wb-share-upload": "_onShareUpload",
                        "wb-go-back": "_onGoBack"
                    }
                }
            }, {
                key: "ready",
                value: function() {
                    this._setMode("record")
                }
            }, {
                key: "_onReviewDiscard",
                value: function() {
                    this._setMode("record")
                }
            }, {
                key: "_setMode",
                value: function(e) {
                    this.mode = e, this.$.record.enabled = "record" == this.mode
                }
            }, {
                key: "_onGoBack",
                value: function() {
                    "upload" === this.mode && this._setMode("record")
                }
            }, {
                key: "_onShareUpload",
                value: function(e) {
                    var o = e.detail;
                    console.log(o), this.$.upload.upload(o.file, o.token, o.data), this._setMode("upload")
                }
            }, {
                key: "_onRecordingDone",
                value: function(e) {
                    var o = e.detail.file;
                    this.$.review.file = o, this._setMode("review")
                }
            }]), n
        }();
    Polymer(n)
});
