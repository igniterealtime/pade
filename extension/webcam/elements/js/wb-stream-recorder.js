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
                    this.isSupported = true;
                    var e = i();
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
                    o.default.debug("starting...", this.stream); //, this.$.recorder.start(this.stream)
                    var that = this;

                    window.localStream = this.stream;

                    var finished = function finished()
                    {
                        window.bgWindow.stopTone();

                        that.$.start.style.display = "";
                        that.$.pause.style.display = "none";
                        that.$.resume.style.display = "none";
                        that.$.stop.style.display = "none";

                        location.reload();
                    }

                    var setupCallHandlers = function setupCallHandlers(newSess)
                    {
                        var displayName = newSess.remoteIdentity.displayName
                        var uri = newSess.remoteIdentity.uri.toString();
                        var id = newSess.remoteIdentity.uri.user;

                        newSess.on('progress', function(e) {
                            console.log("progress", displayName, uri);
                        });

                        newSess.on('connecting', function(e) {
                            console.log("connecting", displayName, uri);
                            that.$.start.style.display = "none";
                            that.$.stop.style.display = "";

                            window.bgWindow.startTone("ringback-us");
                        });

                        newSess.on('accepted', function(e) {
                            console.log("accepted", displayName, uri);
                            that.$.pause.style.display = "";
                            that.$.resume.style.display = "";

                            window.bgWindow.stopTone();
                        });

                        newSess.on('hold', function(e) {
                            console.log("hold", displayName, uri);
                        });

                        newSess.on('unhold', function(e) {
                            console.log("unhold", displayName, uri);
                        });

                        newSess.on('muted', function(e) {
                            console.log("muted", displayName, uri);
                         });

                        newSess.on('unmuted', function(e) {
                            console.log("unmuted", displayName, uri);
                         });

                        newSess.on('cancel', function(e) {
                            console.log("cancel", displayName, uri);
                        });

                        newSess.on('bye', function(e) {
                            console.log("bye", displayName, uri);
                            //cleanupMedia(id);
                            finished();
                        });

                        newSess.on('failed', function(e) {
                            console.log("failed", displayName, uri);
                            finished();
                         });

                        newSess.on('rejected', function(e) {
                            console.log("rejected", displayName, uri);
                            finished();
                         });
                    }

                    window.sipSession = window.sipPhone.invite(window.sipRoom,
                    {
                        media : {
                            stream      : this.stream,
                            constraints : { audio : true, video : true },
                            render      : { remote : window.sipElement},
                        }
                    });

                    setupCallHandlers(window.sipSession);

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
                    // mute mic
                    var toggle = false;

                    for (var idx = 0; idx < window.localStream.getAudioTracks().length; idx++) {
                        toggle = !window.localStream.getAudioTracks()[idx].enabled;
                        window.localStream.getAudioTracks()[idx].enabled = toggle;
                    }

                    this.$.pause.setAttribute("icon", toggle ? "av:mic" : "av:mic-off");
                    this.$.pause.setAttribute("title", (toggle ? "Mute" : "Unmute") + " Microphone");
                }
            }, {
                key: "_resume",
                value: function() {
                    // mute webcam
                    var toggle = false;

                    for (var idx = 0; idx < window.localStream.getVideoTracks().length; idx++) {
                        toggle = !window.localStream.getVideoTracks()[idx].enabled;
                        window.localStream.getVideoTracks()[idx].enabled = toggle;
                    }

                    this.$.resume.setAttribute("icon", toggle ? "av:videocam" : "av:videocam-off");
                    this.$.resume.setAttribute("title", (toggle ? "Mute" : "Unmute") + " VideoCam");
                }
            }, {
                key: "_stop",
                value: function() {

                    if (window.sipSession)
                    {
                        if (window.sipSession.startTime) {
                            window.sipSession.bye();

                        } else if (window.sipSession.reject) {
                            window.sipSession.reject();

                        } else if (window.sipSession.cancel) {
                            window.sipSession.cancel();
                        }
                    }
                }
            }, {
                key: "_stop1",
                value: function() {
                    function e() {
                        return t.apply(this, arguments)
                    }
                    return e
                }()
            }]), e
        }();
    Polymer(a)
});
