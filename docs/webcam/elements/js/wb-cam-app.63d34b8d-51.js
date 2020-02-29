define("elements/wb-cam-recorder.js", ["../../components/w69b-es6/log.js"], function(e) {
    "use strict";

    function t(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function n(e) {
        return function() {
            var t = e.apply(this, arguments);
            return new Promise(function(e, n) {
                function r(i, o) {
                    try {
                        var u = t[i](o),
                            a = u.value
                    } catch (e) {
                        return void n(e)
                    }
                    return u.done ? void e(a) : Promise.resolve(a).then(function(e) {
                        r("next", e)
                    }, function(e) {
                        r("throw", e)
                    })
                }
                return r("next")
            })
        }
    }

    function r(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
    }

    function i() {
        return Number((/Chrome\/(\d+)/.exec(window.navigator.userAgent) || [void 0, 0])[1])
    }
    var o = t(e),
        u = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t
            }
        }(),
        a = function() {
            function e() {
                r(this, e)
            }
            return u(e, [{
                key: "beforeRegister",
                value: function() {
                    this.is = "wb-cam-recorder", this.properties = {
                        enabled: {
                            type: Boolean,
                            notify: !0,
                            value: !0
                        },
                        _streamEnabled: {
                            type: Boolean,
                            computed: "_shouldEnableStream(enabled, _hidden, state, isSupported)"
                        },
                        _recorderActive: {
                            type: Boolean,
                            computed: "_computeRecorderActive(state)"
                        },
                        stream: {
                            type: Object
                        },
                        cfg: {
                            type: Object
                        }
                    }
                }
            }, {
                key: "ready",
                value: function() {
                    this.isSupported = this.$.recorder.isSupported();
                    var e = i();
                    e && e < 51 && (this.$.pause.setAttribute("hidden", !0), this.$.resume.setAttribute("hidden", !0))
                }
            }, {
                key: "attached",
                value: function() {
                    this._hidden = document.hidden, this.listen(document, "visibilitychange", "_onVisibilityChange")
                }
            }, {
                key: "detached",
                value: function() {
                    this.unlisten(document, "visibilitychange", "_onVisibilityChange")
                }
            }, {
                key: "_start",
                value: function() {
                    o.default.debug("starting..."), this.$.recorder.start(this.stream)
                }
            }, {
                key: "_initDefaultCfg",
                value: function() {
                    this.cfg = {
                        audioSource: "",
                        videoSource: ""
                    }
                }
            }, {
                key: "_onGrantHelpClick",
                value: function() {
                    this.$.grantStreamHelp.show()
                }
            }, {
                key: "_onVisibilityChange",
                value: function() {
                    this._hidden = document.hidden
                }
            }, {
                key: "_computeRecorderActive",
                value: function() {
                    return "inactive" !== this.state
                }
            }, {
                key: "_shouldEnableStream",
                value: function() {
                    return this.isSupported && this.enabled && (!this._hidden || "inactive" !== this.state)
                }
            }, {
                key: "_computeCtrlClass",
                value: function(e, t) {
                    var n = "ctrl-state ctrl-state-" + e;
                    return t && (n += " busy"), n
                }
            }, {
                key: "_pause",
                value: function() {
                    this.$.recorder.pause()
                }
            }, {
                key: "_resume",
                value: function() {
                    this.$.recorder.resume()
                }
            }, {
                key: "_stop",
                value: function() {
                    function e() {
                        return t.apply(this, arguments)
                    }
                    var t = n(regeneratorRuntime.mark(function e() {
                        var t;
                        return regeneratorRuntime.wrap(function(e) {
                            for (;;) switch (e.prev = e.next) {
                                case 0:
                                    return e.next = 2, this.$.recorder.stop();
                                case 2:
                                    t = e.sent, this.fire("wb-recorder-stopped", {
                                        file: t
                                    });
                                case 4:
                                case "end":
                                    return e.stop()
                            }
                        }, e, this)
                    }));
                    return e
                }()
            }]), e
        }();
    Polymer(a)
});
