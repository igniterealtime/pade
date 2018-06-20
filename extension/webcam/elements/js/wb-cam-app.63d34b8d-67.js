
define("elements/wb-youtube-upload.js", ["../../components/w69b-es6/clipboard.js"], function(e) {
    "use strict";

    function t(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function o(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
    }
    var i = t(e),
        n = function() {
            function e(e, t) {
                for (var o = 0; o < t.length; o++) {
                    var i = t[o];
                    i.enumerable = i.enumerable || !1, i.configurable = !0, "value" in i && (i.writable = !0), Object.defineProperty(e, i.key, i)
                }
            }
            return function(t, o, i) {
                return o && e(t.prototype, o), i && e(t, i), t
            }
        }(),
        a = "Recorded with https://www.cam-recorder.com",
        u = function() {
            function e() {
                o(this, e)
            }
            return n(e, [{
                key: "beforeRegister",
                value: function() {
                    this.is = "wb-youtube-upload", this.properties = {
                        state: {
                            type: String,
                            value: "idle",
                            notify: !0,
                            readOnly: !0
                        },
                        complete: {
                            type: Boolean,
                            computed: "_isComplete(state)"
                        }
                    }
                }
            }, {
                key: "_isComplete",
                value: function(e) {
                    return "complete" === e
                }
            }, {
                key: "ready",
                value: function() {}
            }, {
                key: "upload",
                value: function e(t, o, i) {
                    this._setState("uploading"), this._progress = 0, this._processed = !1, this._metadata = i, this._videoId = null;
                    var e = this.$.upload;
                    e._accessToken = o, e.videoTitle = i.title, e.description = i.description || a, e.privacyStatus = i.privacy, e.uploadFile(t)
                }
            }, {
                key: "_onUploadStart",
                value: function(e) {
                    this._setState("uploading")
                }
            }, {
                key: "_onUploadFail",
                value: function(e) {
                    this._setState("failed")
                }
            }, {
                key: "_onUploadProgress",
                value: function(e) {
                    this._progress = e.detail.fractionComplete
                }
            }, {
                key: "_onUploadComplete",
                value: function(e) {
                    this._setState("complete"), this._videoId = e.detail
                }
            }, {
                key: "_onProcessingComplete",
                value: function(e) {
                    this._processed = !0
                }
            }, {
                key: "_getVideoUrl",
                value: function() {
                    return "https://youtu.be/" + this._videoId
                }
            }, {
                key: "_open",
                value: function() {
                    window.open(this._getVideoUrl())
                }
            }, {
                key: "_copy",
                value: function() {
                    i.default.copy(this._getVideoUrl()), this.$.copyToast.show()
                }
            }]), e
        }();
    Polymer(u)
});
