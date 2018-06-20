define("elements/wb-youtube-auth.js", ["../../components/w69b-es6/googleauth.js", "../../components/w69b-es6/log.js", "../../components/w69b-es6/google-token-info.js"], function(e, t, n) {
    "use strict";

    function r(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function o(e) {
        return function() {
            var t = e.apply(this, arguments);
            return new Promise(function(e, n) {
                function r(o, u) {
                    try {
                        var a = t[o](u),
                            i = a.value
                    } catch (e) {
                        return void n(e)
                    }
                    return a.done ? void e(i) : Promise.resolve(i).then(function(e) {
                        r("next", e)
                    }, function(e) {
                        r("throw", e)
                    })
                }
                return r("next")
            })
        }
    }

    function u(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
    }
    var a = r(t),
        i = r(n),
        s = function() {
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
        c = (0, e.googleauthFactory)();
    c.setScope(["https://www.googleapis.com/auth/youtube", "https://www.googleapis.com/auth/userinfo.email"]), c.loadClient(), c.setClientId("22477695751-ch8o6r0pnh2btfbg1pgrolk2e51i14e9.apps.googleusercontent.com");
    var l = "https://www.googleapis.com/youtube/v3/channels",
        h = "wbYoutubeAuthUserId",
        f = function() {
            function e() {
                u(this, e)
            }
            return s(e, [{
                key: "beforeRegister",
                value: function() {
                    this.is = "wb-youtube-auth", this.properties = {
                        token: {
                            type: String,
                            readOnly: !0,
                            notify: !0,
                            value: null,
                            observer: "_tokenChanged"
                        },
                        channel: {
                            type: Object,
                            readOnly: !0,
                            notify: !0
                        },
                        initialized: {
                            type: Boolean,
                            readOnly: !0,
                            value: !1
                        }
                    }
                }
            }, {
                key: "ready",
                value: function() {
                    function e() {
                        return t.apply(this, arguments)
                    }
                    var t = o(regeneratorRuntime.mark(function e() {
                        return regeneratorRuntime.wrap(function(e) {
                            for (;;) switch (e.prev = e.next) {
                                case 0:
                                    return c.setUserId(window.localStorage[h]), e.next = 3, c.loadClient();
                                case 3:
                                    this._setInitialized(!0), this._updateToken(!1);
                                case 5:
                                case "end":
                                    return e.stop()
                            }
                        }, e, this)
                    }));
                    return e
                }()
            }, {
                key: "_updateToken",
                value: function() {
                    function e(e) {
                        return t.apply(this, arguments)
                    }
                    var t = o(regeneratorRuntime.mark(function e(t) {
                        return regeneratorRuntime.wrap(function(e) {
                            for (;;) switch (e.prev = e.next) {
                                case 0:
                                    return e.t0 = this, e.next = 3, c.getAuthToken(t).catch(function() {
                                        return null
                                    });
                                case 3:
                                    return e.t1 = e.sent, e.t0._setToken.call(e.t0, e.t1), e.abrupt("return", this.token);
                                case 6:
                                case "end":
                                    return e.stop()
                            }
                        }, e, this)
                    }));
                    return e
                }()
            }, {
                key: "_tokenChanged",
                value: function() {
                    function e(e) {
                        return t.apply(this, arguments)
                    }
                    var t = o(regeneratorRuntime.mark(function e(t) {
                        var n;
                        return regeneratorRuntime.wrap(function(e) {
                            for (;;) switch (e.prev = e.next) {
                                case 0:
                                    if (t) {
                                        e.next = 3;
                                        break
                                    }
                                    return this._setChannel(null), e.abrupt("return");
                                case 3:
                                    return this._updateUserId(), e.next = 6, this._loadChannel();
                                case 6:
                                    n = e.sent, a.default.debug("wb-youtube-auth: channel is", n), this._setChannel(n);
                                case 9:
                                case "end":
                                    return e.stop()
                            }
                        }, e, this)
                    }));
                    return e
                }()
            }, {
                key: "_updateUserId",
                value: function() {
                    function e() {
                        return t.apply(this, arguments)
                    }
                    var t = o(regeneratorRuntime.mark(function e() {
                        var t;
                        return regeneratorRuntime.wrap(function(e) {
                            for (;;) switch (e.prev = e.next) {
                                case 0:
                                    return e.next = 2, i.default.getUserId(this.token);
                                case 2:
                                    t = e.sent, window.localStorage[h] = t;
                                case 4:
                                case "end":
                                    return e.stop()
                            }
                        }, e, this)
                    }));
                    return e
                }()
            }, {
                key: "_loadChannel",
                value: function() {
                    function e() {
                        return t.apply(this, arguments)
                    }
                    var t = o(regeneratorRuntime.mark(function e() {
                        var t, n;
                        return regeneratorRuntime.wrap(function(e) {
                            for (;;) switch (e.prev = e.next) {
                                case 0:
                                    return a.default.debug("wb-youtube-auth: loading channels"), e.next = 3, fetch(l + "?part=snippet&mine=true", {
                                        headers: {
                                            Authorization: "Bearer " + this.token,
                                            "Cache-Control": "no-cache"
                                        },
                                        cache: "no-cache"
                                    });
                                case 3:
                                    if (t = e.sent, t.ok) {
                                        e.next = 6;
                                        break
                                    }
                                    throw new Error;
                                case 6:
                                    return e.next = 8, t.json();
                                case 8:
                                    if (t = e.sent, !t.error) {
                                        e.next = 11;
                                        break
                                    }
                                    throw new Error(t.error.message);
                                case 11:
                                    if (t.items.length) {
                                        e.next = 13;
                                        break
                                    }
                                    throw new Error("no_channels");
                                case 13:
                                    return n = t.items[0], e.abrupt("return", {
                                        id: n.id,
                                        title: n.snippet.title,
                                        thumbnail: n.snippet.thumbnails.default.url
                                    });
                                case 15:
                                case "end":
                                    return e.stop()
                            }
                        }, e, this)
                    }));
                    return e
                }()
            }, {
                key: "getAuthToken",
                value: function(e) {
                    return this._updateToken(e)
                }
            }, {
                key: "selectAccount",
                value: function() {
                    return this._updateToken("select_account")
                }
            }]), e
        }();
    Polymer(f)
});
