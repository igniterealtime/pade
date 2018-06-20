
define("elements/wb-device-selector.js", ["../../components/w69b-es6/webrtc.js"], function(e) {
    "use strict";

    function n(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function t(e) {
        return function() {
            var n = e.apply(this, arguments);
            return new Promise(function(e, t) {
                function r(i, u) {
                    try {
                        var o = n[i](u),
                            s = o.value
                    } catch (e) {
                        return void t(e)
                    }
                    return o.done ? void e(s) : Promise.resolve(s).then(function(e) {
                        r("next", e)
                    }, function(e) {
                        r("throw", e)
                    })
                }
                return r("next")
            })
        }
    }

    function r(e, n) {
        if (!(e instanceof n)) throw new TypeError("Cannot call a class as a function")
    }
    var i = n(e),
        u = function() {
            function e(e, n) {
                for (var t = 0; t < n.length; t++) {
                    var r = n[t];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r)
                }
            }
            return function(n, t, r) {
                return t && e(n.prototype, t), r && e(n, r), n
            }
        }(),
        o = function() {
            function e() {
                r(this, e)
            }
            return u(e, [{
                key: "beforeRegister",
                value: function() {
                    this.is = "wb-device-selector", this.properties = {
                        kind: {
                            type: String,
                            value: "video",
                            observer: "_kindChanged"
                        },
                        selected: {
                            type: String,
                            notify: !0,
                            observer: "_selectedChanged"
                        }
                    }, this.observers = ["_onOpenChanged(_isOpened)"]
                }
            }, {
                key: "attached",
                value: function() {
                    this.listen(window, "wb-got-cam-stream", "refresh")
                }
            }, {
                key: "detached",
                value: function() {
                    this.listen(window, "wb-got-cam-stream", "refresh")
                }
            }, {
                key: "refresh",
                value: function() {
                    function e() {
                        return n.apply(this, arguments)
                    }
                    var n = t(regeneratorRuntime.mark(function e() {
                        return regeneratorRuntime.wrap(function(e) {
                            for (;;) switch (e.prev = e.next) {
                                case 0:
                                    return e.next = 2, i.default.getSourcesByKind(this.kind);
                                case 2:
                                    this.devices = e.sent;
                                case 3:
                                case "end":
                                    return e.stop()
                            }
                        }, e, this)
                    }));
                    return e
                }()
            }, {
                key: "_onOpenChanged",
                value: function(e) {
                    e && this.refresh()
                }
            }, {
                key: "_kindChanged",
                value: function(e) {}
            }, {
                key: "_selectedChanged",
                value: function() {
                    function e(e) {
                        return n.apply(this, arguments)
                    }
                    var n = t(regeneratorRuntime.mark(function e(n) {
                        var t;
                        return regeneratorRuntime.wrap(function(e) {
                            for (;;) switch (e.prev = e.next) {
                                case 0:
                                    if (n) {
                                        e.next = 2;
                                        break
                                    }
                                    return e.abrupt("return");
                                case 2:
                                    return e.next = 4, i.default.getSourcesByKind(this.kind);
                                case 4:
                                    t = e.sent, t.find(function(e) {
                                        return e.id === n
                                    }) || (this.selected = "");
                                case 6:
                                case "end":
                                    return e.stop()
                            }
                        }, e, this)
                    }));
                    return e
                }()
            }]), e
        }();
    Polymer(o)
});
