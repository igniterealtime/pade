
define("elements/wb-share-youtube.js", [], function() {
    "use strict";

    function e(e) {
        return function() {
            var t = e.apply(this, arguments);
            return new Promise(function(e, n) {
                function r(i, u) {
                    try {
                        var o = t[i](u),
                            a = o.value
                    } catch (e) {
                        return void n(e)
                    }
                    return o.done ? void e(a) : Promise.resolve(a).then(function(e) {
                        r("next", e)
                    }, function(e) {
                        r("throw", e)
                    })
                }
                return r("next")
            })
        }
    }

    function t(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
    }
    var n = function() {
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
        r = function() {
            function r() {
                t(this, r)
            }
            return n(r, [{
                key: "beforeRegister",
                value: function() {
                    this.is = "wb-share-youtube", this.properties = {
                        file: {
                            type: Object
                        }
                    }
                }
            }, {
                key: "ready",
                value: function() {
                    this.selectedPrivacy = "public"
                }
            }, {
                key: "bool",
                value: function(e) {
                    return !!e
                }
            }, {
                key: "_changeChannel",
                value: function() {
                    this.$.auth.selectAccount()
                }
            }, {
                key: "open",
                value: function() {
                    this.$.dialog.open()
                }
            }, {
                key: "upload",
                value: function() {
                    function t() {
                        return n.apply(this, arguments)
                    }
                    var n = e(regeneratorRuntime.mark(function e() {
                        var t, n, r;
                        return regeneratorRuntime.wrap(function(e) {
                            for (;;) switch (e.prev = e.next) {
                                case 0:
                                    if (!this.$.form.validate()) {
                                        e.next = 7;
                                        break
                                    }
                                    return t = this.$.form.serializeForm(), e.next = 4, this.$.auth.getAuthToken(!0);
                                case 4:
                                    n = e.sent, r = this.$.upload, this.fire("wb-share-upload", {
                                        data: t,
                                        file: this.file,
                                        token: n
                                    });
                                case 7:
                                case "end":
                                    return e.stop()
                            }
                        }, e, this)
                    }));
                    return t
                }()
            }]), r
        }();
    Polymer(r)
});

