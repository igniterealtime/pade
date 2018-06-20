
! function(e) {
    "use strict";

    function r(e, r, i) {
        if (i = i || r || e, Array.isArray(e) && (r = e), "string" != typeof e && (e = t()), e.indexOf("\\") !== -1) throw new TypeError("Please use / as module path delimiters");
        if (e in u) throw new Error('The module "' + e + '" has already been defined');
        var o = e.match(/^(.*?)[^\/]*$/)[1];
        return "" === o && (o = e), u[e] = n(e, o, r, i), u[e]
    }

    function t() {
        var e = document._currentScript || document.currentScript;
        if (e && e.hasAttribute("as")) return e.getAttribute("as");
        var r = e && e.ownerDocument || document;
        if (!r.baseURI) throw new Error("Unable to determine a module id: No baseURI for the document");
        return e && e.hasAttribute("src") ? new URL(e.getAttribute("src"), r.baseURI).toString() : r.baseURI
    }

    function n(e, r, t, n) {
        if ("function" != typeof n) return n;
        var u, a = {},
            s = {
                id: e
            };
        u = Array.isArray(t) ? t.map(function(e) {
            return "exports" === e ? a : "require" === e ? o : "module" === e ? s : (e = i(r, e), o(e))
        }) : [o, a, s];
        var c = n.apply(null, u);
        return c || s.exports || a
    }

    function i(e, r) {
        if ("." !== r[0]) return r;
        for (var t = e.match(/^([^\/]*\/\/[^\/]+\/)?(.*?)\/?$/), n = t[1] || "", i = t[2] ? t[2].split("/") : [], o = r.match(/^\/?(.*?)\/?$/)[1].split("/"), u = 0; u < o.length; u++) {
            var a = o[u];
            "." !== a && (".." === a ? i.pop() : i.push(a))
        }
        return n + i.join("/")
    }

    function o(e) {
        if (!(e in u)) throw new ReferenceError('The module "' + e + '" has not been loaded');
        return u[e]
    }
    var u = Object.create(null);
    r._modules = u, r.amd = {}, e.define = r
}(this);


define("components/w69b-es6/log.js", ["exports"], function(e) {
    "use strict";
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    for (var o = {
            isDebug: !0
        }, n = ["log", "info", "warn", "debug", "error"], r = function() {
            var e = n[t];
            o[e] = function() {
                for (var n = arguments.length, r = Array(n), t = 0; t < n; t++) r[t] = arguments[t];
                o.isDebug && console[e].apply(console, r)
            }
        }, t = 0; t < n.length; t++) r();
    e.default = o
});


define("components/w69b-es6/async-response.js", ["exports"], function(e) {
    "use strict";

    function r(e) {
        var r = {},
            n = 0,
            t = {};
        return r.sendWithResponse = function(r, s) {
            return new Promise(function(o, u) {
                var d = ++n;
                t[d] = [o, u], e({
                    type: r,
                    data: s,
                    msgId: d
                })
            })
        }, r.send = function(r, n) {
            e({
                type: r,
                data: n
            })
        }, r.handleResult = function(e) {
            if (e && "result" === e.type) {
                var r = t[e.msgId];
                return delete t[e.msgId], e.hasOwnProperty("error") || e.isError ? r[1](e.error) : r[0](e.data), !0
            }
            return !1
        }, r
    }

    function n(e) {
        return function(r, n) {
            Promise.resolve(r).then(function(r) {
                e({
                    type: "result",
                    msgId: n.msgId,
                    data: r
                })
            }, function(r) {
                e({
                    type: "result",
                    msgId: n.msgId,
                    error: r,
                    isError: !0
                })
            })
        }
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    }), e.createSender = r, e.createRespond = n
});


define("components/w69b-es6/pausable-timer.js", ["exports"], function(t) {
    "use strict";

    function e(t, e) {
        if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return !e || "object" != typeof e && "function" != typeof e ? t : e
    }

    function i(t, e) {
        if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
        t.prototype = Object.create(e && e.prototype, {
            constructor: {
                value: t,
                enumerable: !1,
                writable: !0,
                configurable: !0
            }
        }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
    }

    function n(t, e) {
        if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var r = function t(e, i, n) {
            null === e && (e = Function.prototype);
            var r = Object.getOwnPropertyDescriptor(e, i);
            if (void 0 === r) {
                var s = Object.getPrototypeOf(e);
                return null === s ? void 0 : t(s, i, n)
            }
            if ("value" in r) return r.value;
            var o = r.get;
            if (void 0 !== o) return o.call(n)
        },
        s = function() {
            function t(t, e) {
                for (var i = 0; i < e.length; i++) {
                    var n = e[i];
                    n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(t, n.key, n)
                }
            }
            return function(e, i, n) {
                return i && t(e.prototype, i), n && t(e, n), e
            }
        }(),
        o = function() {
            function t() {
                n(this, t), this.reset()
            }
            return s(t, [{
                key: "_now",
                value: function() {
                    return Date.now() / 1e3
                }
            }, {
                key: "start",
                value: function() {
                    this.reset(), this._firstTimestamp = this._now()
                }
            }, {
                key: "reset",
                value: function() {
                    this._firstTimestamp = -1, this._pausedAtTimestamp = -1, this._offset = 0
                }
            }, {
                key: "pause",
                value: function() {
                    this.paused || (this._pausedAtTimestamp = this._now())
                }
            }, {
                key: "resume",
                value: function() {
                    if (!this.paused) throw new Error;
                    this._offset -= this._now() - this._pausedAtTimestamp, this._pausedAtTimestamp = -1
                }
            }, {
                key: "time",
                get: function() {
                    return this.started ? this.paused ? this._pausedAtTimestamp - this._firstTimestamp + this._offset : this._now() - this._firstTimestamp + this._offset : 0
                }
            }, {
                key: "started",
                get: function() {
                    return this._firstTimestamp >= 0
                }
            }, {
                key: "paused",
                get: function() {
                    return this._pausedAtTimestamp >= 0
                }
            }]), t
        }(),
        a = function(t) {
            function o(t, i) {
                n(this, o);
                var r = e(this, Object.getPrototypeOf(o).call(this));
                return r._interval = i, r._listener = t, r
            }
            return i(o, t), s(o, [{
                key: "_fireChange",
                value: function() {
                    this._listener && this._listener(this.time)
                }
            }, {
                key: "_startInterval",
                value: function() {
                    this._listener && this._interval && (this._intervalId = setInterval(this._fireChange.bind(this), this._interval))
                }
            }, {
                key: "_stopInterval",
                value: function() {
                    this._intervalId && clearInterval(this._intervalId), this._intervalId = 0, this._fireChange()
                }
            }, {
                key: "reset",
                value: function() {
                    r(Object.getPrototypeOf(o.prototype), "reset", this).call(this), this._stopInterval()
                }
            }, {
                key: "start",
                value: function() {
                    r(Object.getPrototypeOf(o.prototype), "start", this).call(this), this._startInterval()
                }
            }, {
                key: "pause",
                value: function() {
                    r(Object.getPrototypeOf(o.prototype), "pause", this).call(this), this._stopInterval()
                }
            }, {
                key: "resume",
                value: function() {
                    r(Object.getPrototypeOf(o.prototype), "resume", this).call(this), this._startInterval()
                }
            }]), o
        }(o);
    t.default = o, t.PausableTriggeringTimer = a, t.PausableTimer = o
});


define("components/w69b-es6/timeutil.js", ["exports"], function(t) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var e = {};
    e.formatDuration = function(t) {
        function e(t) {
            return t < 10 ? "0" + t : t
        }
        "number" != typeof t && (t = 0);
        var o = Math.floor(t % 60),
            n = Math.floor(t / 60 % 60),
            r = [e(n), e(o)],
            u = Math.floor(t / 3600);
        return u && r.unshift(u), r.join(":")
    }, t.default = e
});


define("components/w69b-es6/q.js", ["exports"], function(e) {
    "use strict";
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var r = {};
    r.defer = function() {
        var e = {};
        return e.promise = new Promise(function(r, n) {
            e.resolve = r, e.reject = n
        }), e
    }, r.when = Promise.resolve.bind(Promise), r.all = Promise.all.bind(Promise), r.reject = Promise.reject.bind(Promise), Promise.prototype.finally || (Promise.prototype.finally = function(e) {
        var r = this.constructor;
        return this.then(function(n) {
            return r.resolve(e()).then(function() {
                return n
            })
        }, function(n) {
            return r.resolve(e()).then(function() {
                throw n
            })
        })
    }), e.default = r
});


define("components/w69b-es6/timeout.js", ["exports"], function(e) {
    "use strict";

    function t(e, t) {
        return t || (t = e), new Promise(function(e) {
            window.setTimeout(e, t)
        }).then(function() {
            "function" == typeof e && e()
        })
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    }), e.default = t
});


define("components/w69b-es6/clipboard.js", ["exports"], function(e) {
    "use strict";
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var t = {};
    t.copy = function(e) {
        var t = document.createElement("textarea");
        t.style.display = "hidden", t.innerText = e, document.body.appendChild(t), t.select(), document.execCommand("copy"), document.body.removeChild(t)
    }, e.default = t
});


define("components/w69b-es6/google-token-info.js", ["exports"], function(e) {
    "use strict";

    function n(e) {
        return function() {
            var n = e.apply(this, arguments);
            return new Promise(function(e, r) {
                function t(o, u) {
                    try {
                        var i = n[o](u),
                            s = i.value
                    } catch (e) {
                        return void r(e)
                    }
                    return i.done ? void e(s) : Promise.resolve(s).then(function(e) {
                        t("next", e)
                    }, function(e) {
                        t("throw", e)
                    })
                }
                return t("next")
            })
        }
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var r = "https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=",
        t = {};
    t.getInfo = function() {
        var e = n(regeneratorRuntime.mark(function e(n) {
            var t;
            return regeneratorRuntime.wrap(function(e) {
                for (;;) switch (e.prev = e.next) {
                    case 0:
                        return e.next = 2, fetch(r + n, {
                            cache: "no-cache"
                        });
                    case 2:
                        if (t = e.sent, !t.ok) {
                            e.next = 7;
                            break
                        }
                        return e.abrupt("return", t.json());
                    case 7:
                        throw new Error;
                    case 8:
                    case "end":
                        return e.stop()
                }
            }, e, this)
        }));
        return function(n) {
            return e.apply(this, arguments)
        }
    }(), t.getUserId = function() {
        var e = n(regeneratorRuntime.mark(function e(n) {
            var r;
            return regeneratorRuntime.wrap(function(e) {
                for (;;) switch (e.prev = e.next) {
                    case 0:
                        return e.next = 2, t.getInfo(n);
                    case 2:
                        if (r = e.sent, r.sub) {
                            e.next = 5;
                            break
                        }
                        throw new Error("missing sub property in token info");
                    case 5:
                        return e.abrupt("return", r.sub);
                    case 6:
                    case "end":
                        return e.stop()
                }
            }, e, this)
        }));
        return function(n) {
            return e.apply(this, arguments)
        }
    }(), e.default = t
});


define("components/w69b-es6/scriptloader.js", ["exports", "./log.js", "./q.js"], function(e, r, t) {
    "use strict";

    function o(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function n(e) {

        if (u(e)) return a.hasOwnProperty(e) ? a[e] : l.default.when(!0);
        var r = l.default.defer();
        a[e] = r.promise, c.default.debug("script loader loading " + e);
        var t = document.createElement("script");
        t.type = "text/javascript", t.src = e, t.onload = function() {
            delete a[e], r.resolve(), t.onload = t.onerror = null
        }, t.onerror = function() {
            r.reject(), t.onload = t.onerror = null
        };
        var o = s.querySelector("script");
        return o.parentNode.insertBefore(t, o), r.promise

    }

    function u(e, r) {
        return r ? !!s.querySelector('script[src^="' + e + '"]') : !!s.querySelector('script[src="' + e + '"]')
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var c = o(r),
        l = o(t),
        s = document,
        a = {};
    e.default = {
        isInDom: u,
        load: n
    }
});


define("components/w69b-es6/promise-tool.js", ["exports", "./q.js"], function(e, r) {
    "use strict";

    function n(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    }), e.default = void 0;
    var t = n(r),
        o = {};
    o.wrapChromeError = function(e, r) {
        return function() {
            var n = Array.prototype.slice.call(arguments, 0),
                o = t.default.defer();
            return n.push(function(e) {
                chrome.runtime.lastError ? o.reject(chrome.runtime.lastError) : o.resolve(e)
            }), e.apply(r, n), o.promise
        }
    }, o.wrapCallbacks = function(e, r) {
        return function() {
            var n = Array.prototype.slice.call(arguments, 0),
                o = t.default.defer();
            return n.push(o.resolve.bind(o)), n.push(o.reject.bind(o)), e.apply(r, n), o.promise
        }
    }, o.serializer = function() {
        var e = null;
        return function(r) {
            var n = t.default.defer();
            return (e || t.default.when()).finally(function() {
                var e = r.call();
                n.resolve(e)
            }), e = n.promise, e.finally(function() {
                e = null
            }), n.promise
        }
    }, o.withTimeout = function(e, r, n) {
        n || (n = angular.noop);
        var o = t.default.defer(),
            l = $timeout(function() {
                var e = n();
                angular.isDefined(e) ? o.resolve(e) : o.reject("timeout"), o = null
            }, r),
            u = e(),
            i = o.promise;
        return u.finally(function() {
            $timeout.cancel(l), l = null
        }), u.then(function() {
            o && o.resolve.apply(o, arguments)
        }, function() {
            o && o.reject.apply(o, arguments)
        }), i
    }, e.default = o
});


define("components/w69b-es6/googleauth.js", ["exports", "./scriptloader.js", "./q.js", "./timeout.js"], function(e, t, n, r) {
    "use strict";

    function o(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function u(e) {
        return function() {
            var t = e.apply(this, arguments);
            return new Promise(function(e, n) {
                function r(o, u) {
                    try {
                        var i = t[o](u),
                            a = i.value
                    } catch (e) {
                        return void n(e)
                    }
                    return i.done ? void e(a) : Promise.resolve(a).then(function(e) {
                        r("next", e)
                    }, function(e) {
                        r("throw", e)
                    })
                }
                return r("next")
            })
        }
    }

    function i() {
        function e() {
            if (b = l.gapi, !b) throw new Error("gapi did not load")
        }

        function t(e, t) {
            function r(e) {
                u(e);
                var o = e.expires_in;
                if (!(o >= 120)) throw new Error("token expires too fast");
                (0, s.default)(function() {
                    n(t).then(r)
                }, 1e3 * (o - 60), !1)
            }

            function o(e) {
                u = e
            }
            var u = function() {
                return null
            };
            return r(e), {
                setCallback: o
            }
        }

        function n(e) {
            return p(Object.assign({}, e || {}, {
                immediate: !0
            }))
        }

        function r(e) {
            return p(e)
        }

        function o(e) {
            if (v.hasOwnProperty(e)) return v[e];
            var t = c.default.defer();
            return l.gapi.load(e, t.resolve.bind(t)), v[e] = t.promise, t.promise
        }

        function i() {
            var t = arguments.length <= 0 || void 0 === arguments[0] || arguments[0];
            return a.default.load(m).then(function() {
                if (t) return o("auth")
            }).then(e)
        }
        var d, p = function() {
                var e = u(regeneratorRuntime.mark(function e(t) {
                    var n, r, o;
                    return regeneratorRuntime.wrap(function(e) {
                        for (;;) switch (e.prev = e.next) {
                            case 0:
                                if (r = function(e) {
                                        e ? e.error ? (_ = !1, n.reject(e.error)) : (_ = !0, n.resolve(e)) : (n.reject(), _ = !1)
                                    }, b) {
                                    e.next = 4;
                                    break
                                }
                                return e.next = 4, i();
                            case 4:
                                if (d) {
                                    e.next = 6;
                                    break
                                }
                                throw new Error("client id not configured");
                            case 6:
                                return n = c.default.defer(), o = {
                                    client_id: d,
                                    scope: h,
                                    cookiepolicy: "single_host_origin"
                                }, j && (o.authuser = -1, o.user_id = j), Object.assign(o, t), "select_account" === o.prompt && (o.authuser = -1, delete o.user_id), b.auth.authorize(o, r), e.abrupt("return", n.promise);
                            case 13:
                            case "end":
                                return e.stop()
                        }
                    }, e, this)
                }));
                return function(t) {
                    return e.apply(this, arguments)
                }
            }(),
            h = ["id_token"],
            g = 0,
            m = "api.js",
            v = {},
            y = {};
        y.setScope = function(e) {
            return h = e, y
        }, y.setClientId = function(e) {
            return d = e, y
        };
        var b, w, _ = !1,
            j = null;
        return y.gapiLoad = o, y.loadClient = i, y.authSilent = n, y.authPopup = r, y.AutoRefresher = t, y.setUserId = function(e) {
            j = e
        }, y.isAuthorized = function() {
            return _
        }, y.getAppId = function() {
            return d.substring(0, d.indexOf("-"))
        }, y.getAuthToken = function(e) {
            var t, o = "object" == ("undefined" == typeof e ? "undefined" : f(e)) ? e.interactive : e,
                u = "select_account" === o,
                i = Math.floor((Date.now() - g) / 1e3) + 120;
            return !u && w && w.expires_at > i ? t = c.default.when(w) : (t = u ? r({
                prompt: o,
                scope: h
            }) : o && !_ ? r({
                scope: h
            }) : n(), t.then(function(e) {
                w = e, e.issued_at && (g = Date.now() - 1e3 * Number(e.issued_at))
            })), t.then(function(e) {
                return e.access_token
            })
        }, y
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    }), e.googleauthFactory = e.default = void 0;
    var a = o(t),
        c = o(n),
        s = o(r),
        f = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
            return typeof e
        } : function(e) {
            return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
        },
        l = window,
        d = i();
    e.default = d, e.googleauthFactory = i
});


define("components/w69b-es6/files-helper.js", ["exports", "./promise-tool.js"], function(e, t) {
    "use strict";

    function r(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function n(e) {
        return function() {
            var t = e.apply(this, arguments);
            return new Promise(function(e, r) {
                function n(i, o) {
                    try {
                        var u = t[i](o),
                            a = u.value
                    } catch (e) {
                        return void r(e)
                    }
                    return u.done ? void e(a) : Promise.resolve(a).then(function(e) {
                        n("next", e)
                    }, function(e) {
                        n("throw", e)
                    })
                }
                return n("next")
            })
        }
    }

    function i(e) {
        var t = e.split("/"),
            r = t.slice(0, -1).join("/"),
            n = t.slice(-1)[0];
        return [r, n]
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    }), e.default = void 0;
    var o = r(t);
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    var u = {
        DEFAULT_TYPE: window.PERSISTENT,
        DEFAULT_SIZE: 104857600
    };
    u.isSupported = function() {
        return !!window.requestFileSystem
    };
    var a = ["readEntries", "remove", "getFile", "getMetadata", "moveTo", "file", "getDirectory", "createWriter"];
    a.forEach(function(e) {
        u[e] = function(t) {
            var r = [].slice.call(arguments, 1);
            return o.default.wrapCallbacks(t[e], t).apply(null, r)
        }
    }), u.getFileSystem = function(e, t) {
        return e || (e = u.DEFAULT_TYPE), t = t || u.DEFAULT_SIZE, o.default.wrapCallbacks(window.requestFileSystem, window)(e, t)
    }, u.getPersistentQuota = function() {
        return new Promise(function(e, t) {
            window.navigator.webkitPersistentStorage.queryUsageAndQuota(function(t, r) {
                e({
                    usage: t,
                    quota: r
                })
            }, function(e) {
                t(e)
            })
        })
    };
    var s = window.chrome || {};
    s.system && s.system.storage && (u.getStorageInfo = o.default.wrapChromeError(s.system.storage.getInfo, s.system.storage)), u.getDirByPath = function(e, t) {
        function r(e, n) {
            return n.length ? u.getDirectory(e, n[0], t || {}).then(function(e) {
                return r(e, n.slice(1))
            }) : Promise.resolve(e)
        }
        var n = e.split("/");
        return "" === n[0] && n.splice(0, 1), u.getFileSystem().then(function(e) {
            return r(e.root, n, t)
        })
    }, u.moveFileByPath = function() {
        var e = n(regeneratorRuntime.mark(function e(t, r) {
            var n, o, a, s;
            return regeneratorRuntime.wrap(function(e) {
                for (;;) switch (e.prev = e.next) {
                    case 0:
                        return n = i(r), o = n[0], a = n[1], e.next = 5, Promise.all([u.getFileEntryByPath(t), u.getDirByPath(o)]);
                    case 5:
                        return s = e.sent, e.abrupt("return", u.moveTo(obj.file, obj.targetDir, a));
                    case 7:
                    case "end":
                        return e.stop()
                }
            }, e, this)
        }));
        return function(t, r) {
            return e.apply(this, arguments)
        }
    }(), u.getFileEntryByPath = function(e, t, r) {
        var n = i(e),
            o = n[0],
            a = n[1];
        return u.getDirByPath(o, r).then(function(e) {
            return u.getFile(e, a, t || {})
        })
    }, u.getFileByPath = function(e) {
        return u.getFileEntryByPath(e).then(function(e) {
            return u.file(e)
        })
    }, u.removeByPath = function(e) {
        return u.getFileEntryByPath(e).then(function(e) {
            return u.remove(e)
        })
    }, u.listByPath = function(e) {
        return u.getDirByPath(e).then(function(e) {
            var t = e.createReader();
            return u.readEntries(t)
        })
    }, u.requestPersistentQuota = function(e) {
        return o.default.wrapCallbacks(navigator.webkitPersistentStorage.requestQuota, navigator.webkitPersistentStorage)(e || u.DEFAULT_SIZE)
    }, u.requestTemporaryQuota = function(e) {
        return o.default.wrapCallbacks(navigator.webkitTemporaryStorage.requestQuota, navigator.webkitTemporaryStorage)(e || u.DEFAULT_SIZE)
    }, u.writeFile = function(e, t) {
        return new Promise(function(r, n) {
            e.onwriteend = r, e.onerror = n, e.write(t)
        })
    }, e.default = u
});


define("components/w69b-es6/webrtc.js", ["exports", "./files-helper.js", "./q.js", "./promise-tool.js"], function(e, t, n, r) {
    "use strict";

    function i(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function u(e) {
        return e.some(function(e) {
            return !!e.label
        })
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    }), e.default = void 0;
    var o = (i(t), i(n)),
        s = i(r),
        c = {},
        a = window.navigator;
    a.mediaDevices && a.mediaDevices.getUserMedia ? c.getUserMedia = a.mediaDevices.getUserMedia.bind(a.mediaDevices) : c.getUserMedia = s.default.wrapCallbacks(a.getUserMedia || a.webkitGetUserMedia || a.mozGetUserMedia || a.msGetUserMedia, a), a.mediaDevices && a.mediaDevices.enumerateDevices ? c.getSources = function() {
        return o.default.when(a.mediaDevices.enumerateDevices()).then(function(e) {
            return e.filter(function(e) {
                return e.kind.endsWith("input")
            }).map(function(e) {
                var t = {
                    id: e.deviceId,
                    label: e.label
                };
                return t.kind = e.kind.substring(0, e.kind.length - 5), t
            })
        })
    } : window.MediaStreamTrack && MediaStreamTrack.getSources ? c.getSources = s.default.wrapCallbacks(MediaStreamTrack.getSources, MediaStreamTrack) : c.getSources = function() {
        return Promise.resolve([])
    }, c.getSourcesByKind = function(e) {
        return c.getSources().then(function(t) {
            return t.filter(function(t) {
                return t.kind === e
            })
        })
    }, c.getVideoSources = function() {
        return c.getSourcesByKind("video")
    }, c.getAudioSources = function() {
        return c.getSourcesByKind("audio")
    }, c.hasCamera = function() {
        return c.getVideoSources().then(function(e) {
            return e.length > 0
        })
    }, c.hasMicrophone = function() {
        return c.getAudioSources().then(function(e) {
            return e.length > 0
        })
    }, c.hasVideoAccess = function() {
        return c.getVideoSources().then(u)
    }, c.hasAudioAccess = function() {
        return c.getAudioSources().then(u)
    }, e.default = c
});


define("components/w69b-es6/webrtc-recorder.js", ["exports", "./log.js", "./files-helper.js", "./async-response.js", "./pausable-timer.js"], function(e, t, r, n, a) {
    "use strict";

    function o(e) {
        if (e && e.__esModule) return e;
        var t = {};
        if (null != e)
            for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && (t[r] = e[r]);
        return t.default = e, t
    }

    function u(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function i(e) {
        return function() {
            var t = e.apply(this, arguments);
            return new Promise(function(e, r) {
                function n(a, o) {
                    try {
                        var u = t[a](o),
                            i = u.value
                    } catch (e) {
                        return void r(e)
                    }
                    return u.done ? void e(i) : Promise.resolve(i).then(function(e) {
                        n("next", e)
                    }, function(e) {
                        n("throw", e)
                    })
                }
                return n("next")
            })
        }
    }

    function s() {
        function e(e) {
            return y = y.then(i(regeneratorRuntime.mark(function t() {
                var r;
                return regeneratorRuntime.wrap(function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            (e || P > T) && (r = new Blob(R), R.length = 0, P = 0, w.send("write", r));
                        case 1:
                        case "end":
                            return t.stop()
                    }
                }, t, this)
            }))).catch(function(e) {
                c.default.error("webrtcRecoder: flushQueue failed", e)
            })
        }

        function t(t) {
            R.push(t), P += t.size, e()
        }

        function r(e) {
            var r = e.data;
            t(r)
        }

        function n() {
            if (x.state != v.state) {
                switch (x.state = v.state, v.state) {
                    case "paused":
                        j.pause();
                        break;
                    case "recording":
                        j.paused ? j.resume() : j.start()
                }
                b.onStateChanged && b.onStateChanged(x.state)
            }
        }

        function o() {
            x.time = j.time, b.onTimeChanged && b.onTimeChanged(x.time)
        }

        function u() {
            k.forEach(function(e) {
                v.addEventListener(e, n)
            })
        }

        function s(e, t) {
            v.addEventListener(e, function r() {
                v.removeEventListener(e, r), t.apply(this, arguments)
            })
        }
        var v, h, w, g, b = {},
            k = ["start", "stop", "pause", "resume", "error"],
            x = {
                state: "inactive",
                time: 0
            },
            y = Promise.resolve(),
            T = 1e5,
            S = 500,
            R = [],
            P = 0,
            j = new a.PausableTriggeringTimer(o, 500),
            M = "bower_components/mediarecorder/mediarecorder.worker.min.9a9c6a2a.js";
        return b.onStateChanged = null, b.onTimeChanged = null, b.start = function() {
            var e = i(regeneratorRuntime.mark(function e(t, n) {
                return regeneratorRuntime.wrap(function(e) {
                    for (;;) switch (e.prev = e.next) {
                        case 0:
                            c.default.debug("webrtcRecorder: onStart", t, n), h = new l, h.addTrack(n.videoTrack), n.audioTrack && h.addTrack(n.audioTrack), e.prev = 4, v = new p(h, {
                                mimeType: n.mimeType || m
                            }), e.next = 12;
                            break;
                        case 8:
                            throw e.prev = 8, e.t0 = e.catch(4), c.default.error("failed to create MediaRecorder", e.t0), e.t0;
                        case 12:
                            if (!d.default.isSupported()) {
                                e.next = 15;
                                break
                            }
                            return e.next = 15, d.default.removeByPath(t).catch(function() {
                                return null
                            });
                        case 15:
                            return g = new Worker(M), w = f.createSender(function(e) {
                                return g.postMessage(e)
                            }), g.addEventListener("message", function(e) {
                                return w.handleResult(e.data)
                            }), w.send("init", t), v.addEventListener("dataavailable", r), e.abrupt("return", new Promise(function(e) {
                                s("start", function() {
                                    c.default.debug("webrtcEncoder: onStart"), e()
                                }), u(), v.start(S)
                            }));
                        case 21:
                        case "end":
                            return e.stop()
                    }
                }, e, this, [
                    [4, 8]
                ])
            }));
            return function(t, r) {
                return e.apply(this, arguments)
            }
        }(), b.pause = function() {
            return v.pause(), n(), Promise.resolve()
        }, b.resume = function() {
            return v.resume(), n(), Promise.resolve()
        }, b.getStateObj = function() {
            return x
        }, b.load = function() {}, b.stop = i(regeneratorRuntime.mark(function t() {
            var r, n;
            return regeneratorRuntime.wrap(function(t) {
                for (;;) switch (t.prev = t.next) {
                    case 0:
                        return r = new Promise(function(e) {
                            s("stop", function() {
                                e()
                            })
                        }), v.stop(), t.next = 4, r;
                    case 4:
                        return j.pause(), t.next = 7, e(!0);
                    case 7:
                        return t.next = 9, w.sendWithResponse("end");
                    case 9:
                        return n = t.sent, g.terminate(), g = null, w = null, j.reset(), t.abrupt("return", n);
                    case 15:
                    case "end":
                        return t.stop()
                }
            }, t, this)
        })), b
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    }), e.default = void 0;
    var c = u(t),
        d = u(r),
        f = o(n),
        p = window.MediaRecorder,
        l = window.webkitMediaStream || window.MediaStream,
        m = 'video/webm; codecs="vp8, opus"';
    s.isSupported = function(e) {
        function t() {
            var e = navigator.userAgent,
                t = e.match(/Firefox\/(\d+)/);
            return t && t[1] >= 44 && e.indexOf("Android") < 0
        }
        return "undefined" != typeof p && (p.isTypeSupported && p.isTypeSupported(e || m) || t())
    }, e.default = s
});


define("components/w69b-es6/audio-context-pool.js", ["exports"], function(e) {
    "use strict";
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var n = [],
        o = {};
    o.acquire = function() {
        return n.length ? n.pop() : new window.AudioContext
    }, o.release = function(e) {
        n.push(e)
    }, e.default = o
});


define("components/w69b-es6/mic-level-factory.js", ["exports", "./webrtc.js", "./audio-context-pool.js", "./log.js", "./q.js"], function(e, n, t, r, a) {
    "use strict";

    function i(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }

    function o() {
        function e(e) {
            return function() {
                var n = arguments,
                    t = f.default.defer();
                return (v || f.default.when()).finally(function() {
                    var r = e.apply(null, n);
                    t.resolve(r)
                }), v = t.promise, v.finally(function() {
                    v = null
                }), t.promise
            }
        }

        function n() {
            var e = m.analyser;
            e && (o || (o = new Uint8Array(e.frequencyBinCount)), e.getByteFrequencyData(o), g = -1)
        }

        function t() {
            g = Math.max.apply(null, o) / 255
        }

        function r(e) {
            if (p) throw Error();
            s = e, p = c.default.acquire();
            var t = p,
                r = t.createMediaStreamSource(e),
                a = t.createAnalyser(),
                i = t.createGain();
            i.gain.value = w, a.smoothingTimeConstant = .3, a.fftSize = 32, a.minDecibels = -70, a.maxDecibels = -10;
            var o = t.createScriptProcessor(2048, 2, 1);
            o.onaudioprocess = n, r.connect(i), i.connect(a), a.connect(o), o.connect(t.destination), m.input = r, m.analyser = a, m.capture = o, m.gain = i
        }

        function a() {
            if (l.default.debug("micLevelFactory: getting new stream"), S) throw new Error;
            var e = {};
            return d && (e.sourceId = d), u.default.getUserMedia({
                audio: {
                    mandatory: e
                },
                video: !1
            })
        }

        function i() {
            s && !S && (s.getTracks().forEach(function(e) {
                e.stop()
            }), s = null)
        }
        var o, s, d, p, v, y = {},
            m = {},
            g = 0,
            S = !1,
            h = 0,
            w = 1;
        return y.start = e(function() {
            var e = null;
            return h || (s ? r(s) : e = a().then(r)), ++h, e
        }), y.setGain = function(e) {
            w = e, m.gain && (m.gain.gain.value = e)
        }, y.setSourceId = e(function(e) {
            if (d = e, i(), m.input) return a().then(function(e) {
                s = e, m.input.disconnect(), m.input = p.createMediaStreamSource(e), m.input.connect(m.gain)
            })
        }), y.setSourceStream = e(function(e) {
            S = !0, s = e, m.input && (m.input.disconnect(), m.input = p.createMediaStreamSource(e), m.input.connect(m.gain))
        }), y.stop = e(function() {
            if (h && !--h) {
                var e = !0,
                    n = !1,
                    t = void 0;
                try {
                    for (var r, a = Object.values(m)[Symbol.iterator](); !(e = (r = a.next()).done); e = !0) {
                        var o = r.value;
                        o.disconnect()
                    }
                } catch (e) {
                    n = !0, t = e
                } finally {
                    try {
                        !e && a.return && a.return()
                    } finally {
                        if (n) throw t
                    }
                }
                m = {}, i(), g = 0, c.default.release(p), p = null
            }
        }), y.getVolume = function() {
            return g < 0 && t(), g
        }, y
    }
    Object.defineProperty(e, "__esModule", {
        value: !0
    });
    var u = i(n),
        c = i(t),
        l = i(r),
        f = i(a);
    e.default = o
});


define("elements/routing.js", [], function() {
    "use strict";
    var o = window.page;
    window.addEventListener("WebComponentsReady", function() {
        function e(o, e) {
            app.scrollPageToTop(), e()
        }

        function t(o, e) {
            app.closeDrawer(), e()
        }
        "" === window.location.port && o.base(app.baseUrl.replace(/\/$/, "")), o("*", e, t, function(o, e) {
            e()
        }), o("/", function() {
            app.route = "home"
        }), o(app.baseUrl, function() {
            app.route = "home"
        }), o("/contact", function() {
            app.route = "contact"
        }), o("*", function() {
            app.route = "home"
        }), o({})
    })
});
