
define("elements/wb-video-review.js", [], function() {
    "use strict";

    function e(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
    }
    var t = function() {
            function e(e, t) {
                for (var i = 0; i < t.length; i++) {
                    var n = t[i];
                    n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(e, n.key, n)
                }
            }
            return function(t, i, n) {
                return i && e(t.prototype, i), n && e(t, n), t
            }
        }(),
        i = function() {
            function i() {
                e(this, i)
            }
            return t(i, [{
                key: "beforeRegister",
                value: function() {
                    this.is = "wb-video-review", this.properties = {
                        file: {
                            type: Object,
                            observer: "_fileChanged"
                        }
                    }
                }
            }, {
                key: "ready",
                value: function() {
                    this._updateVideoState()
                }
            }, {
                key: "share",
                value: function() {
                    this.$.video.pause();
                    //this.$.shareYoutubeDialog.open()
                    console.log("Share URL", this.$);
                }
            }, {
                key: "download",
                value: function() {
                    var e = document.createElement("a");
                    e.setAttribute("href", this._url), e.setAttribute("download", "video.webm"), e.dispatchEvent(new MouseEvent("click"))
                }
            }, {
                key: "delete",
                value: function() {
                    this.fire("wb-review-discard"), this.file = null
                }
            }, {
                key: "_updateVideoState",
                value: function() {
                    this.videoEnded = this.$.video.ended || this.$.video.paused
                }
            }, {
                key: "_isChrome",
                value: function() {
                    return !!window.chrome
                }
            }, {
                key: "_replay",
                value: function() {
                    var e = this.$.video;
                    e.currentTime = 0, e.pause(), e.play()
                }
            }, {
                key: "_fileChanged",
                value: function(e) {
                    this._url && URL.revokeObjectURL(this._url), e ? (this._url = URL.createObjectURL(e), this.$.video.src = this._url, this.$.video.play(), this.$.video.paused && this._updateVideoState()) : (this.$.video.pause(), this.$.video.src = "")
                }
            }]), i
        }();
    Polymer(i)
});


Polymer({
    is: "google-js-api",
    behaviors: [Polymer.IronJsonpLibraryBehavior],
    properties: {
        libraryUrl: {
            type: String,
            value: "https://apis.google.com/js/api.js?onload=%%callback%%"
        },
        notifyEvent: {
            type: String,
            value: "js-api-load"
        }
    },
    get api() {
        return gapi
    }
});


! function() {
    "use strict";
    var e = !1,
        i = {},
        t = {};
    Polymer({
        is: "google-client-loader",
        properties: {
            name: String,
            version: String,
            appId: String,
            apiRoot: String,
            successEventName: {
                type: String,
                value: "google-api-load"
            },
            errorEventName: {
                type: String,
                value: "google-api-load-error"
            }
        },
        hostAttributes: {
            hidden: !0
        },
        _waiting: !1,
        get api() {
            return window.gapi && window.gapi.client && window.gapi.client[this.name] ? window.gapi.client[this.name] : void 0
        },
        get auth() {
            return gapi.auth
        },
        ready: function() {
            this._loader = document.createElement("google-js-api"), this.listen(this._loader, "js-api-load", "_loadClient")
        },
        detached: function() {
            this.unlisten(this._loader, "js-api-load", "_loadClient")
        },
        _loadClient: function() {
            gapi.load("client", this._doneLoadingClient.bind(this))
        },
        _handleLoadResponse: function(e) {
            e && e.error ? (i[this.name] = "error", this._fireError(e)) : (i[this.name] = "loaded", this._fireSuccess())
        },
        _fireSuccess: function() {
            this.fire(this.successEventName, {
                name: this.name,
                version: this.version
            })
        },
        _fireError: function(e) {
            e && e.error ? this.fire(this.errorEventName, {
                name: this.name,
                version: this.version,
                error: e.error
            }) : this.fire(this.errorEventName, {
                name: this.name,
                version: this.version
            })
        },
        _doneLoadingClient: function() {
            e = !0, this._waiting || this._loadApi()
        },
        _createSelfRemovingListener: function(e) {
            var i = function() {
                t[this.name].removeEventListener(e, i), this._loadApi()
            }.bind(this);
            return i
        },
        _loadApi: function() {
            if (e && this.name && this.version)
                if (this._waiting = !1, "loaded" == i[this.name]) this._fireSuccess();
                else if ("loading" == i[this.name]) this._waiting = !0, t[this.name].addEventListener(this.successEventName, this._createSelfRemovingListener(this.successEventName)), t[this.name].addEventListener(this.errorEventName, this._createSelfRemovingListener(this.errorEventName));
            else if ("error" == i[this.name]) this._fireError(null);
            else {
                var n;
                this.apiRoot ? n = this.apiRoot : this.appId && (n = "https://" + this.appId + ".appspot.com/_ah/api"), i[this.name] = "loading", t[this.name] = this, gapi.client.load(this.name, this.version, this._handleLoadResponse.bind(this), n)
            }
        }
    })
}();


! function() {
    var e = {
            appPackageName: "apppackagename",
            clientId: "clientid",
            cookiePolicy: "cookiepolicy",
            hostedDomain: "hostedDomain",
            openidPrompt: "prompt",
            requestVisibleActions: "requestvisibleactions"
        },
        t = {
            _clientId: null,
            get clientId() {
                return this._clientId
            },
            set clientId(e) {
                if (this._clientId && e && e != this._clientId) throw new Error("clientId cannot change. Values do not match. New: " + e + " Old:" + this._clientId);
                e && e != this._clientId && (this._clientId = e, this.initAuth2())
            },
            _cookiePolicy: "single_host_origin",
            get cookiePolicy() {
                return this._cookiePolicy
            },
            set cookiePolicy(e) {
                e && (this._cookiePolicy = e)
            },
            _appPackageName: "",
            get appPackageName() {
                return this._appPackageName
            },
            set appPackageName(e) {
                if (this._appPackageName && e && e != this._appPackageName) throw new Error("appPackageName cannot change. Values do not match. New: " + e + " Old: " + this._appPackageName);
                e && (this._appPackageName = e)
            },
            _requestVisibleActions: "",
            get requestVisibleactions() {
                return this._requestVisibleActions
            },
            set requestVisibleactions(e) {
                if (this._requestVisibleActions && e && e != this._requestVisibleActions) throw new Error("requestVisibleactions cannot change. Values do not match. New: " + e + " Old: " + this._requestVisibleActions);
                e && (this._requestVisibleActions = e)
            },
            _hostedDomain: "",
            get hostedDomain() {
                return this._hostedDomain
            },
            set hostedDomain(e) {
                if (this._hostedDomain && e && e != this._hostedDomain) throw new Error("hostedDomain cannot change. Values do not match. New: " + e + " Old: " + this._hostedDomain);
                e && (this._hostedDomain = e)
            },
            _openidPrompt: "",
            get openidPrompt() {
                return this._openidPrompt
            },
            set openidPrompt(e) {
                if ("string" != typeof e) throw new Error("openidPrompt must be a string. Received " + typeof e);
                if (e) {
                    var t = e.split(" ");
                    t = t.map(function(e) {
                        return e.trim()
                    }), t = t.filter(function(e) {
                        return e
                    });
                    var i = {
                        none: 0,
                        login: 0,
                        consent: 0,
                        select_account: 0
                    };
                    t.forEach(function(e) {
                        if ("none" == e && t.length > 1) throw new Error("none cannot be combined with other openidPrompt values");
                        if (!(e in i)) throw new Error("invalid openidPrompt value " + e + ". Valid values: " + Object.keys(i).join(", "))
                    })
                }
                this._openidPrompt = e
            },
            _offline: !1,
            get offline() {
                return this._offline
            },
            set offline(e) {
                this._offline = e, this.updateAdditionalAuth()
            },
            _offlineAlwaysPrompt: !1,
            get offlineAlwaysPrompt() {
                return this._offlineAlwaysPrompt
            },
            set offlineAlwaysPrompt(e) {
                this._offlineAlwaysPrompt = e, this.updateAdditionalAuth()
            },
            offlineGranted: !1,
            _apiLoader: null,
            _requestedScopeArray: [],
            get requestedScopes() {
                return this._requestedScopeArray.join(" ")
            },
            _signedIn: !1,
            _grantedScopeArray: [],
            _needAdditionalAuth: !0,
            _hasPlusScopes: !1,
            signinAwares: [],
            init: function() {
                this._apiLoader = document.createElement("google-js-api"), this._apiLoader.addEventListener("js-api-load", this.loadAuth2.bind(this))
            },
            loadAuth2: function() {
                gapi.load("auth2", this.initAuth2.bind(this))
            },
            initAuth2: function() {
                if ("gapi" in window && "auth2" in window.gapi && this.clientId) {
                    var e = gapi.auth2.init({
                        client_id: this.clientId,
                        cookie_policy: this.cookiePolicy,
                        scope: this.requestedScopes,
                        hosted_domain: this.hostedDomain
                    });
                    e.currentUser.listen(this.handleUserUpdate.bind(this)), e.then(function() {}, function(e) {
                        console.error(e)
                    })
                }
            },
            handleUserUpdate: function(e) {
                var t = e.isSignedIn();
                if (t != this._signedIn) {
                    this._signedIn = t;
                    for (var i = 0; i < this.signinAwares.length; i++) this.signinAwares[i]._setSignedIn(t)
                }
                this._grantedScopeArray = this.strToScopeArray(e.getGrantedScopes()), this.updateAdditionalAuth();
                for (var n = e.getAuthResponse(), i = 0; i < this.signinAwares.length; i++) this.signinAwares[i]._updateScopeStatus(n)
            },
            setOfflineCode: function(e) {
                for (var t = 0; t < this.signinAwares.length; t++) this.signinAwares[t]._updateOfflineCode(e)
            },
            strToScopeArray: function(e) {
                if (!e) return [];
                for (var t = e.replace(/\ +/g, " ").trim().split(" "), i = 0; i < t.length; i++) t[i] = t[i].toLowerCase(), "https://www.googleapis.com/auth/userinfo.profile" === t[i] && (t[i] = "profile"), "https://www.googleapis.com/auth/userinfo.email" === t[i] && (t[i] = "email");
                return t.filter(function(e, t, i) {
                    return i.indexOf(e) === t
                })
            },
            isPlusScope: function(e) {
                return e.indexOf("/auth/games") > -1 || e.indexOf("auth/plus.") > -1 && e.indexOf("auth/plus.me") < 0
            },
            hasGrantedScopes: function(e) {
                for (var t = this.strToScopeArray(e), i = 0; i < t.length; i++)
                    if (this._grantedScopeArray.indexOf(t[i]) === -1) return !1;
                return !0
            },
            requestScopes: function(e) {
                for (var t = this.strToScopeArray(e), i = !1, n = 0; n < t.length; n++) this._requestedScopeArray.indexOf(t[n]) === -1 && (this._requestedScopeArray.push(t[n]), i = !0);
                i && (this.updateAdditionalAuth(), this.updatePlusScopes())
            },
            updateAdditionalAuth: function() {
                var e = !1;
                if (!this.offlineAlwaysPrompt && !this.offline || this.offlineGranted) {
                    for (var t = 0; t < this._requestedScopeArray.length; t++)
                        if (this._grantedScopeArray.indexOf(this._requestedScopeArray[t]) === -1) {
                            e = !0;
                            break
                        }
                } else e = !0;
                if (this._needAdditionalAuth != e) {
                    this._needAdditionalAuth = e;
                    for (var t = 0; t < this.signinAwares.length; t++) this.signinAwares[t]._setNeedAdditionalAuth(e)
                }
            },
            updatePlusScopes: function() {
                for (var e = !1, t = 0; t < this._requestedScopeArray.length; t++)
                    if (this.isPlusScope(this._requestedScopeArray[t])) {
                        e = !0;
                        break
                    }
                if (this._hasPlusScopes != e) {
                    this._hasPlusScopes = e;
                    for (var t = 0; t < this.signinAwares.length; t++) this.signinAwares[t]._setHasPlusScopes(e)
                }
            },
            attachSigninAware: function(e) {
                this.signinAwares.indexOf(e) == -1 ? (this.signinAwares.push(e), e._setNeedAdditionalAuth(this._needAdditionalAuth), e._setSignedIn(this._signedIn), e._setHasPlusScopes(this._hasPlusScopes)) : console.warn("signinAware attached more than once", e)
            },
            detachSigninAware: function(e) {
                var t = this.signinAwares.indexOf(e);
                t != -1 ? this.signinAwares.splice(t, 1) : console.warn("Trying to detach unattached signin-aware")
            },
            getMissingScopes: function() {
                return this._requestedScopeArray.filter(function(e) {
                    return this._grantedScopeArray.indexOf(e) === -1
                }.bind(this)).join(" ")
            },
            assertAuthInitialized: function() {
                if (!this.clientId) throw new Error("AuthEngine not initialized. clientId has not been configured.");
                if (!("gapi" in window)) throw new Error("AuthEngine not initialized. gapi has not loaded.");
                if (!("auth2" in window.gapi)) throw new Error("AuthEngine not initialized. auth2 not loaded.")
            },
            signIn: function() {
                this.assertAuthInitialized();
                var i = {
                    scope: this.getMissingScopes()
                };
                Object.keys(e).forEach(function(t) {
                    this[t] && "" !== this[t] && (i[e[t]] = this[t])
                }, this);
                var n, o = gapi.auth2.getAuthInstance().currentUser.get();
                this.offline || this.offlineAlwaysPrompt ? (i.redirect_uri = "postmessage", this.offlineAlwaysPrompt && (i.approval_prompt = "force"), n = gapi.auth2.getAuthInstance().grantOfflineAccess(i)) : n = o.getGrantedScopes() ? o.grant(i) : gapi.auth2.getAuthInstance().signIn(i), n.then(function(e) {
                    var i;
                    e.code ? (t.offlineGranted = !0, i = gapi.auth2.getAuthInstance().currentUser.get(), t.setOfflineCode(e.code)) : i = e;
                    i.getAuthResponse()
                }, function(e) {
                    "Access denied." !== e.reason && this.signinAwares.forEach(function(t) {
                        t.errorNotify(e)
                    })
                }.bind(this))
            },
            signOut: function() {
                this.assertAuthInitialized(), gapi.auth2.getAuthInstance().signOut().then(function() {}, function(e) {
                    console.error(e)
                })
            }
        };
    t.init(), Polymer({
        is: "google-signin-aware",
        properties: {
            appPackageName: {
                type: String,
                observer: "_appPackageNameChanged"
            },
            clientId: {
                type: String,
                observer: "_clientIdChanged"
            },
            cookiePolicy: {
                type: String,
                observer: "_cookiePolicyChanged"
            },
            requestVisibleActions: {
                type: String,
                observer: "_requestVisibleActionsChanged"
            },
            hostedDomain: {
                type: String,
                observer: "_hostedDomainChanged"
            },
            offline: {
                type: Boolean,
                value: !1,
                observer: "_offlineChanged"
            },
            offlineAlwaysPrompt: {
                type: Boolean,
                value: !1,
                observer: "_offlineAlwaysPromptChanged"
            },
            scopes: {
                type: String,
                value: "profile",
                observer: "_scopesChanged"
            },
            openidPrompt: {
                type: String,
                value: "",
                observer: "_openidPromptChanged"
            },
            signedIn: {
                type: Boolean,
                notify: !0,
                readOnly: !0
            },
            isAuthorized: {
                type: Boolean,
                notify: !0,
                readOnly: !0,
                value: !1
            },
            needAdditionalAuth: {
                type: Boolean,
                notify: !0,
                readOnly: !0
            },
            hasPlusScopes: {
                type: Boolean,
                value: !1,
                notify: !0,
                readOnly: !0
            }
        },
        attached: function() {
            t.attachSigninAware(this)
        },
        detached: function() {
            t.detachSigninAware(this)
        },
        signIn: function() {
            t.signIn()
        },
        signOut: function() {
            t.signOut()
        },
        errorNotify: function(e) {
            this.fire("google-signin-aware-error", e)
        },
        _appPackageNameChanged: function(e, i) {
            t.appPackageName = e
        },
        _clientIdChanged: function(e, i) {
            t.clientId = e
        },
        _cookiePolicyChanged: function(e, i) {
            t.cookiePolicy = e
        },
        _requestVisibleActionsChanged: function(e, i) {
            t.requestVisibleActions = e
        },
        _hostedDomainChanged: function(e, i) {
            t.hostedDomain = e
        },
        _offlineChanged: function(e, i) {
            t.offline = e
        },
        _offlineAlwaysPromptChanged: function(e, i) {
            t.offlineAlwaysPrompt = e
        },
        _scopesChanged: function(e, i) {
            t.requestScopes(e), this._updateScopeStatus(void 0)
        },
        _openidPromptChanged: function(e, i) {
            t.openidPrompt = e
        },
        _updateScopeStatus: function(e) {
            var i = this.signedIn && t.hasGrantedScopes(this.scopes);
            i !== this.isAuthorized && (this._setIsAuthorized(i), i ? this.fire("google-signin-aware-success", e) : this.fire("google-signin-aware-signed-out", e))
        },
        _updateOfflineCode: function(e) {
            e && this.fire("google-signin-offline-success", {
                code: e
            })
        }
    })
}();
