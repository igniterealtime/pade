
define("elements/wb-mic-level.js", ["../../components/w69b-es6/mic-level-factory.js"], function(e) {
    "use strict";

    function t(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function i(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
    }
    var r = t(e),
        a = function() {
            function e(e, t) {
                for (var i = 0; i < t.length; i++) {
                    var r = t[i];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
                }
            }
            return function(t, i, r) {
                return i && e(t.prototype, i), r && e(t, r), t
            }
        }(),
        s = new Map,
        n = function() {
            function e() {
                i(this, e)
            }
            return a(e, [{
                key: "beforeRegister",
                value: function() {
                    this.is = "wb-mic-level", this.properties = {
                        orientation: {
                            type: String,
                            value: "vertical"
                        },
                        resolution: {
                            type: Number,
                            value: 50
                        },
                        sourceId: {
                            type: String,
                            observer: "_onSourceIdChanged"
                        },
                        stream: {
                            type: Object,
                            observer: "_onStreamChanged"
                        },
                        autoStream: {
                            type: Boolean,
                            value: !1
                        }
                    }, this.observers = ["_updateGradient(orientation, resolution)"]
                }
            }, {
                key: "ready",
                value: function() {
                    this._micLevelService = this._getMicLevelService(), this._ctx = this.$.canvas.getContext("2d"), this._requestAnimationFrameId, this._detached = !1, this._started = !1, this._updateGradient()
                }
            }, {
                key: "_getMicLevelService",
                value: function() {
                    if (this.autoStream) {
                        var e = this.sourceId;
                        if (s.has(e)) return s.get(e);
                        var t = (0, r.default)();
                        return t.setSourceId(e), s.set(e, t), t
                    }
                    var t = (0, r.default)();
                    return this.stream && t.setSourceStream(this.stream), t
                }
            }, {
                key: "_updateGradient",
                value: function() {
                    if (this._ctx) {
                        var e = this.$.canvas;
                        e.width = this._isHorizontal ? this.resolution : 1, e.height = this._isHorizontal ? 1 : this.resolution;
                        var t, i = this._ctx;
                        t = this._isHorizontal ? i.createLinearGradient(0, 0, e.width, 0) : i.createLinearGradient(0, e.height, 0, 0), t.addColorStop(0, "#0f0"), t.addColorStop(.7, "#ff0"), t.addColorStop(1, "#f00"), i.fillStyle = t
                    }
                }
            }, {
                key: "_updateVolume",
                value: function() {
                    var e = this._ctx,
                        t = this.$.canvas;
                    e.clearRect(0, 0, t.width, t.height), this._isHorizontal ? e.fillRect(0, 0, Math.round(this._micLevelService.getVolume() * t.width), t.height) : e.fillRect(0, t.height, t.width, -Math.round(this._micLevelService.getVolume() * t.height)), this._requestAnimationFrameId = window.requestAnimationFrame(this._updateVolume.bind(this))
                }
            }, {
                key: "_start",
                value: function() {
                    this._started || (this._started = !0, this._micLevelService.start(), this._requestAnimationFrameId = window.requestAnimationFrame(this._updateVolume.bind(this)))
                }
            }, {
                key: "attached",
                value: function() {
                    (this.autoStream || this.stream) && this._start(), this._detached = !1
                }
            }, {
                key: "detached",
                value: function() {
                    this._detached = !0, this._stop()
                }
            }, {
                key: "_stop",
                value: function() {
                    this._started && (this._started = !1, window.cancelAnimationFrame(this._requestAnimationFrameId), this._micLevelService.stop())
                }
            }, {
                key: "_onSourceIdChanged",
                value: function(e, t) {
                    if (this.autoStream) {
                        var i = this._started;
                        this._stop(), this._micLevelService = this._getMicLevelService(), i && this._start()
                    }
                }
            }, {
                key: "_onStreamChanged",
                value: function() {
                    this.stream && this._micLevelService && (this._micLevelService.setSourceStream(this.stream), this._detached || this._started || this._start())
                }
            }, {
                key: "_isHorizontal",
                get: function() {
                    return "horizontal" === this.orientation
                }
            }]), e
        }();
    Polymer(n)
});
