
define("elements/wb-cam-stream.js", ["../../components/w69b-es6/webrtc.js", "../../components/w69b-es6/log.js"], function(e, t) {
    "use strict";

    function n(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function i(e) {
        return function() {
            var t = e.apply(this, arguments);
            return new Promise(function(e, n) {
                function i(r, a) {
                    try {
                        var o = t[r](a),
                            s = o.value
                    } catch (e) {
                        return void n(e)
                    }
                    return o.done ? void e(s) : Promise.resolve(s).then(function(e) {
                        i("next", e)
                    }, function(e) {
                        i("throw", e)
                    })
                }
                return i("next")
            })
        }
    }

    function r(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
    }
    var a = n(e),
        o = n(t),
        s = function() {
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
        u = [{
            width: 1920,
            height: 1080
        }, {
            width: 1280,
            height: 720
        }, {
            width: 854,
            height: 480
        }, {
            width: 640,
            height: 360
        }, {
            width: 320,
            height: 240
        }, {
            width: 320,
            height: 180
        }];
    window.adapter && adapter.disableLog(!0);
    var c = function() {
        function e() {
            r(this, e)
        }
        return s(e, [{
            key: "beforeRegister",
            value: function() {
                this.is = "wb-cam-stream", this.properties = {
                    enableAudio: {
                        type: Boolean,
                        value: !0
                    },
                    echoCancellation: {
                        type: Boolean,
                        value: !0
                    },
                    audioSource: {
                        type: String,
                        value: void 0
                    },
                    videoSource: {
                        type: String,
                        value: void 0
                    },
                    stream: {
                        type: Object,
                        notify: !0,
                        readOnly: !0
                    },
                    enabled: {
                        type: Boolean,
                        value: !0
                    }
                }, this.observers = ["_updateStream(audioSource, videoSource, enabled)"]
            }
        }, {
            key: "_getVideoSourceConstraint",
            value: function() {
                var e = {},
                    t = [];
                return u.forEach(function(e) {
                    t.push({
                        minWidth: e.width
                    }), t.push({
                        width: {
                            min: e.width
                        }
                    })
                }), e.advanced = t, this.videoSource && (e.deviceId = {
                    exact: this.videoSource
                }), console.log(e), e
            }
        }, {
            key: "_getAudioSourceConstraint",
            value: function() {
                if (this.enableAudio) {
                    var e = {
                        echoCancellation: {
                            exact: this.echoCancellation !== !1
                        }
                    };
                    return this.audioSource && (e.deviceId = {
                        exact: this.audioSource
                    }), e
                }
                return !1
            }
        }, {
            key: "created",
            value: function() {
                this._updateStreamPromise = Promise.resolve()
            }
        }, {
            key: "ready",
            value: function() {
                this._hasCustomAccessMsg = this.getContentChildNodes().length
            }
        }, {
            key: "stop",
            value: function() {}
        }, {
            key: "_updateStream",
            value: function() {
                this._updateStreamPromise = this._updateStreamPromise.finally(this._updateStreamAsync.bind(this))
            }
        }, {
            key: "_setAwaitingAccess",
            value: function(e) {
                this.toggleAttribute("hidden", !e)
            }
        }, {
            key: "_onStreamEnded",
            value: function() {
                this._disposeStream()
            }
        }, {
            key: "_disposeStream",
            value: function() {
                this.stream && (this.unlisten(this.stream.getVideoTracks()[0], "inactive", "_onStreamEnded"), this.stream.getTracks().forEach(function(e) {
                    return e.stop()
                }), this._setStream(null))
            }
        }, {
            key: "_updateStreamAsync",
            value: function() {
                function e() {
                    return t.apply(this, arguments)
                }
                var t = i(regeneratorRuntime.mark(function e() {
                    var t;
                    return regeneratorRuntime.wrap(function(e) {
                        for (;;) switch (e.prev = e.next) {
                            case 0:
                                if (this._disposeStream(), t = null, !this.enabled) {
                                    e.next = 15;
                                    break
                                }
                                return e.prev = 3, this._setAwaitingAccess(!0), e.next = 7, a.default.getUserMedia({
                                    audio: this._getAudioSourceConstraint(),
                                    video: this._getVideoSourceConstraint()
                                });
                            case 7:
                                t = e.sent, this._setAwaitingAccess(!1), this._setStream(t), e.next = 15;
                                break;
                            case 12:
                                e.prev = 12, e.t0 = e.catch(3), o.default.warn("could not get stream", e.t0);
                            case 15:
                                t && (this.listen(t.getVideoTracks()[0], "inactive", "_onStreamEnded"), this.fire("wb-got-cam-stream", {
                                    stream: t
                                }));
                            case 16:
                            case "end":
                                return e.stop()
                        }
                    }, e, this, [
                        [3, 12]
                    ])
                }));
                return e
            }()
        }]), e
    }();
    Polymer(c)
});
