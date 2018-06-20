
define("elements/wb-stream-recorder.js", ["../../components/w69b-es6/webrtc-recorder.js", "../../components/w69b-es6/files-helper.js"], function(e, t) {
    "use strict";

    function n(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function r(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
    }
    var i = n(e),
        s = n(t),
        o = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t
            }
        }();
    s.default.DEFAULT_TYPE = window.TEMPORARY;
    var u = function() {
        function e() {
            r(this, e)
        }
        return o(e, [{
            key: "beforeRegister",
            value: function() {
                this.is = "wb-stream-recorder", this.properties = {
                    state: {
                        type: String,
                        readOnly: !0,
                        notify: !0
                    },
                    time: {
                        type: Number,
                        readOnly: !0,
                        notify: !0
                    },
                    busy: {
                        type: Boolean,
                        readOnly: !0,
                        notify: !0,
                        value: !1
                    },
                    filename: {
                        type: String,
                        value: "tmp.webm"
                    }
                }
            }
        }, {
            key: "ready",
            value: function() {
                this._recorder = (0, i.default)(), this._recorder.onStateChanged = this._onStateChanged.bind(this), this._recorder.onTimeChanged = this._onTimeChanged.bind(this), this._setState(this._recorder.getStateObj().state), this._setTime(this._recorder.getStateObj().time)
            }
        }, {
            key: "isSupported",
            value: function() {
                return i.default.isSupported()
            }
        }, {
            key: "_onStateChanged",
            value: function(e) {
                this._setState(e)
            }
        }, {
            key: "_onTimeChanged",
            value: function(e) {
                this._setTime(e)
            }
        }, {
            key: "_busyWhilePending",
            value: function(e) {
                return this._setBusy(!0), e.finally(function() {
                    this._setBusy(!1)
                }.bind(this)), e
            }
        }, {
            key: "start",
            value: function(e) {
                var t = {
                    videoTrack: e.getVideoTracks()[0]
                };
                return t.mimeType = 'video/webm; codecs="' + (localStorage.videoCodec || "vp8") + ', opus"', e.getAudioTracks().length && (t.audioTrack = e.getAudioTracks()[0]), this._busyWhilePending(this._recorder.start("tmp.webm", t))
            }
        }, {
            key: "pause",
            value: function() {
                return this._busyWhilePending(this._recorder.pause())
            }
        }, {
            key: "resume",
            value: function() {
                return this._busyWhilePending(this._recorder.resume())
            }
        }, {
            key: "stop",
            value: function() {
                return this._busyWhilePending(this._recorder.stop())
            }
        }]), e
    }();
    Polymer(u)
});
