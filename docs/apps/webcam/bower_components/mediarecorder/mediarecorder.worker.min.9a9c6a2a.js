! function(e) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
    else if ("function" == typeof define && define.amd) define([], e);
    else {
        var t;
        t = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this, (t.w69b || (t.w69b = {})).mediarecorder = e()
    }
}(function() {
    return function e(t, n, r) {
        function i(a, s) {
            if (!n[a]) {
                if (!t[a]) {
                    var c = "function" == typeof require && require;
                    if (!s && c) return c(a, !0);
                    if (o) return o(a, !0);
                    var u = new Error("Cannot find module '" + a + "'");
                    throw u.code = "MODULE_NOT_FOUND", u
                }
                var l = n[a] = {
                    exports: {}
                };
                t[a][0].call(l.exports, function(e) {
                    var n = t[a][1][e];
                    return i(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[a].exports
        }
        for (var o = "function" == typeof require && require, a = 0; a < r.length; a++) i(r[a]);
        return i
    }({
        1: [function(e, t, n) {
            (function(t) {
                "use strict";

                function n(e) {
                    return e && e.__esModule ? e : {
                        "default": e
                    }
                }

                function r(e) {
                    return new Uint8Array(v.readAsArrayBuffer(e))
                }

                function i(e, t) {
                    e.msgId && l["default"].resolve(t).then(function(t) {
                        self.postMessage({
                            type: "result",
                            msgId: e.msgId,
                            data: t
                        })
                    }, function(t) {
                        console.debug(t), self.postMessage({
                            type: "result",
                            msgId: e.msgId,
                            error: t,
                            isError: !0
                        })
                    })
                }

                function o(e) {
                    var t = e.data,
                        n = t.type;
                    if (b.hasOwnProperty(n)) {
                        var r = b[n](t.data);
                        i(t, r)
                    } else console.warn("unknown message", t)
                }
                var a, s, c, u = e("babel-runtime/core-js/promise"),
                    l = n(u),
                    f = e("babel-runtime/regenerator"),
                    h = n(f),
                    d = e("babel-runtime/helpers/asyncToGenerator"),
                    p = n(d),
                    m = e("./seekable-file-writer.js"),
                    g = e("../mediarecorder/index.js"),
                    b = {},
                    v = new FileReaderSync;
                b.init = function(e) {
                    if (a = e, s = null, m.isSupported()) try {
                        s = new m(e)
                    } catch (t) {
                        console.warn("failed to create fileWriter", t)
                    }
                    s || (console.debug("webrtcEncoder: using in-memory writer"), s = new g.SeekableMemoryWriter), c = new g.CuePipeline(s)
                }, b.write = function(e) {
                    var n = r(e);
                    c.write(new t(n))
                }, b.end = (0, p["default"])(h["default"].mark(function y() {
                    var e;
                    return h["default"].wrap(function(t) {
                        for (;;) switch (t.prev = t.next) {
                            case 0:
                                return t.next = 2, c.end();
                            case 2:
                                return e = s instanceof g.SeekableMemoryWriter ? new File([s.toBuffer()], a, {
                                    type: "video/webm"
                                }) : s.getFile(), t.abrupt("return", e);
                            case 4:
                            case "end":
                                return t.stop()
                        }
                    }, y, this)
                })), self.addEventListener("message", o, !1)
            }).call(this, e("buffer").Buffer)
        }, {
            "../mediarecorder/index.js": 6,
            "./seekable-file-writer.js": 2,
            "babel-runtime/core-js/promise": 15,
            "babel-runtime/helpers/asyncToGenerator": 18,
            "babel-runtime/regenerator": 110,
            buffer: 113
        }],
        2: [function(e, t, n) {
            "use strict";

            function r(e) {
                return e && e.__esModule ? e : {
                    "default": e
                }
            }
            var i = e("babel-runtime/core-js/promise"),
                o = r(i),
                a = e("babel-runtime/helpers/classCallCheck"),
                s = r(a),
                c = e("babel-runtime/helpers/createClass"),
                u = r(c),
                l = function() {
                    function e(t) {
                        (0, s["default"])(this, e), this._size = 0, this._pos = 0, this.open(t)
                    }
                    return (0, u["default"])(e, [{
                        key: "open",
                        value: function(e) {
                            var t = self.webkitRequestFileSystemSync(self.TEMPORARY, 104857600);
                            this._fileEntry = t.root.getFile(e, {
                                create: !0
                            }), this._fileWriter = this._fileEntry.createWriter()
                        }
                    }, {
                        key: "seek",
                        value: function(e) {
                            e >= 0 ? this._pos = e : this._pos = this.getSize()
                        }
                    }, {
                        key: "write",
                        value: function(e, t) {
                            var n = "undefined" != typeof t;
                            n || (t = this._pos);
                            var r = e.slice();
                            return this._fileWriter.seek(t), this._fileWriter.write(new Blob([r])), this._size = Math.max(this._size, t + r.length), n || (this._pos += r.length), o["default"].resolve()
                        }
                    }, {
                        key: "getSize",
                        value: function() {
                            return this._size
                        }
                    }, {
                        key: "getFile",
                        value: function() {
                            return this._fileEntry.file()
                        }
                    }, {
                        key: "tell",
                        value: function() {
                            return this._pos
                        }
                    }, {
                        key: "close",
                        value: function() {
                            return o["default"].resolve()
                        }
                    }], [{
                        key: "isSupported",
                        value: function() {
                            return !!self.webkitRequestFileSystemSync
                        }
                    }]), e
                }();
            t.exports = l
        }, {
            "babel-runtime/core-js/promise": 15,
            "babel-runtime/helpers/classCallCheck": 19,
            "babel-runtime/helpers/createClass": 20
        }],
        3: [function(e, t, n) {
            "use strict";

            function r(e) {
                return e && e.__esModule ? e : {
                    "default": e
                }
            }
            var i = e("babel-runtime/core-js/promise"),
                o = r(i),
                a = {};
            a.wrapErrCallback = function(e) {
                return new o["default"](function(t, n) {
                    e(function(e, r) {
                        e ? n(e) : t(r)
                    })
                })
            }, t.exports = a
        }, {
            "babel-runtime/core-js/promise": 15
        }],
        4: [function(e, t, n) {
            (function(n) {
                "use strict";

                function r(e) {
                    return e && e.__esModule ? e : {
                        "default": e
                    }
                }

                function i(e) {
                    l.call(this, {
                        objectMode: !0
                    }), this._encoder = new p(e), this._insertVoid = {
                        Segment: 255
                    }, this._voids = {}, this._videoTrackId = null, this._cues = [], this._seeks = [], this._handledKeyFrameInCluster = !1, this._duration = 0, this._subTreeParser = new m({
                        "Segment.Tracks": this._parseTracks,
                        "Segment.Cluster.Timecode": this._parseClusterTimecode,
                        "Segment.Cluster.SimpleBlock": this._parseSimpleBlock,
                        "Segment.Info": this._parseInfo
                    }, this), this._firstSegmentPos = null, this._lastClusterPos = null
                }
                var o = e("babel-runtime/core-js/get-iterator"),
                    a = r(o),
                    s = e("babel-runtime/regenerator"),
                    c = r(s),
                    u = e("debug")("mediarecorder:cuebuilder"),
                    l = e("flushwritable"),
                    f = (e("ebml").schema, e("ebml").tools),
                    h = e("co"),
                    d = e("./async-tool.js"),
                    p = e("./seeking-ebml-encoder.js"),
                    m = e("./subtreeparser.js"),
                    g = m.SimpleNode,
                    b = 1;
                e("util").inherits(i, l);
                var v = i.prototype;
                v._write = h.wrap(c["default"].mark(function y(e, t, n) {
                    var r, i;
                    return c["default"].wrap(function(t) {
                        for (;;) switch (t.prev = t.next) {
                            case 0:
                                return r = e[0], i = e[1], u("got " + r + " " + i.name), t.prev = 3, t.next = 6, this._subTreeParser.parseTag(e);
                            case 6:
                                if (t.sent) {
                                    t.next = 9;
                                    break
                                }
                                return t.next = 9, this._encode(r, i);
                            case 9:
                                n(), t.next = 16;
                                break;
                            case 12:
                                t.prev = 12, t.t0 = t["catch"](3), console.error(t.t0.stack), n(t.t0);
                            case 16:
                            case "end":
                                return t.stop()
                        }
                    }, y, this, [
                        [3, 12]
                    ])
                })), v._encode = h.wrap(c["default"].mark(function _(e, t) {
                    var n, r, i, o;
                    return c["default"].wrap(function(a) {
                        for (;;) switch (a.prev = a.next) {
                            case 0:
                                if ("end" !== e || "Segment" !== t.name) {
                                    a.next = 3;
                                    break
                                }
                                return a.next = 3, this._onEndOfSegment();
                            case 3:
                                return n = this._encoder.tell(), "start" == e && "Cluster" === t.name && (this._lastClusterPos = this._encoder.tell()), a.next = 7, d.wrapErrCallback(function(n) {
                                    this._encoder.write([e, t], n)
                                }.bind(this));
                            case 7:
                                if ("start" == e && "Segment" === t.name && null === this._firstSegmentPos && (this._firstSegmentPos = this._encoder.tell()), r = this._encoder.tell() - n, "start" != e || !this._insertVoid[t.name]) {
                                    a.next = 16;
                                    break
                                }
                                return i = this._insertVoid[t.name], o = this._encoder.tell(), a.next = 14, this._addVoid(i);
                            case 14:
                                this._voids[t.name] = {
                                    pos: o,
                                    size: i
                                }, delete this._insertVoid[t.name];
                            case 16:
                                return a.abrupt("return", r);
                            case 17:
                            case "end":
                                return a.stop()
                        }
                    }, _, this)
                })), v._addVoid = h.wrap(c["default"].mark(function w(e) {
                    var t, r, i;
                    return c["default"].wrap(function(o) {
                        for (;;) switch (o.prev = o.next) {
                            case 0:
                                if (t = 9, r = e - t, !(0 > r)) {
                                    o.next = 4;
                                    break
                                }
                                throw new Error("Void element too small");
                            case 4:
                                return i = new n(r), i.fill(0), o.next = 8, this._encode("tag", {
                                    name: "Void",
                                    data: i,
                                    minSizeLength: 8
                                });
                            case 8:
                            case "end":
                                return o.stop()
                        }
                    }, w, this)
                })), v._parseInfo = function(e) {
                    this._infoNode = e
                }, v._parseTracks = h.wrap(c["default"].mark(function k(e) {
                    var t, n;
                    return c["default"].wrap(function(r) {
                        for (;;) switch (r.prev = r.next) {
                            case 0:
                                return t = e.getAllChildrenByName("TrackEntry").filter(function(e) {
                                    var t = e.getChildByName("TrackType");
                                    return t && b == t.getValue()
                                }), n = t.map(function(e) {
                                    return e.getChildByName("TrackNumber").getValue()
                                }), n.length && (this._videoTrackId = n[0]), r.next = 5, this._writeNode(e);
                            case 5:
                            case "end":
                                return r.stop()
                        }
                    }, k, this)
                })), v._parseClusterTimecode = h.wrap(c["default"].mark(function x(e) {
                    return c["default"].wrap(function(t) {
                        for (;;) switch (t.prev = t.next) {
                            case 0:
                                return this._lastClusterTimecode = e.getValue(), this._handledKeyFrameInCluster = !1, t.next = 4, this._writeNode(e);
                            case 4:
                            case "end":
                                return t.stop()
                        }
                    }, x, this)
                })), v._writeNode = h.wrap(c["default"].mark(function S(e) {
                    var t, n, r, i, o, s, u, l;
                    return c["default"].wrap(function(c) {
                        for (;;) switch (c.prev = c.next) {
                            case 0:
                                if (t = this._encoder.tell(), !e.children.length) {
                                    c.next = 34;
                                    break
                                }
                                return c.next = 4, this._encode("start", e.tag);
                            case 4:
                                n = !0, r = !1, i = void 0, c.prev = 7, o = (0, a["default"])(e.children);
                            case 9:
                                if (n = (s = o.next()).done) {
                                    c.next = 16;
                                    break
                                }
                                return u = s.value, c.next = 13, this._writeNode(u);
                            case 13:
                                n = !0, c.next = 9;
                                break;
                            case 16:
                                c.next = 22;
                                break;
                            case 18:
                                c.prev = 18, c.t0 = c["catch"](7), r = !0, i = c.t0;
                            case 22:
                                c.prev = 22, c.prev = 23, !n && o["return"] && o["return"]();
                            case 25:
                                if (c.prev = 25, !r) {
                                    c.next = 28;
                                    break
                                }
                                throw i;
                            case 28:
                                return c.finish(25);
                            case 29:
                                return c.finish(22);
                            case 30:
                                return c.next = 32, this._encode("end", e.tag);
                            case 32:
                                c.next = 36;
                                break;
                            case 34:
                                return c.next = 36, this._encode("tag", e.tag);
                            case 36:
                                return l = this._encoder.tell(), c.abrupt("return", l - t);
                            case 38:
                            case "end":
                                return c.stop()
                        }
                    }, S, this, [
                        [7, 18, 22, 30],
                        [23, , 25, 29]
                    ])
                })), v._parseSimpleBlock = h.wrap(c["default"].mark(function T(e) {
                    var t, n, r, i, o, a, s, u;
                    return c["default"].wrap(function(c) {
                        for (;;) switch (c.prev = c.next) {
                            case 0:
                                return t = e.tag.data, n = f.readVint(t), r = n.length, n = n.value, i = t.readInt16BE(r), r += 2, o = t.readUInt8(r), r += 1, a = this._lastClusterPos - this._firstSegmentPos, s = !!(128 & o), u = i + this._lastClusterTimecode, !this._handledKeyFrameInCluster && s && n === this._videoTrackId && (this._cues.push({
                                    time: u,
                                    position: a,
                                    track: n
                                }), this._handledKeyFrameInCluster = !0), this._duration = Math.max(this._duration, u), c.next = 15, this._writeNode(e);
                            case 15:
                            case "end":
                                return c.stop()
                        }
                    }, T, this)
                })), v._insertInSegmentVoid = h.wrap(c["default"].mark(function j(e) {
                    var t, n, r;
                    return c["default"].wrap(function(i) {
                        for (;;) switch (i.prev = i.next) {
                            case 0:
                                if (t = this._voids.Segment, !t) {
                                    i.next = 12;
                                    break
                                }
                                return this._encoder.seek(t.pos), i.next = 5, e();
                            case 5:
                                return n = this._encoder.tell() - t.pos, r = t.size - n, t.pos += n, t.size = r, i.next = 11, this._addVoid(r);
                            case 11:
                                this._encoder.seek(-1);
                            case 12:
                            case "end":
                                return i.stop()
                        }
                    }, j, this)
                })), v._writeCues = h.wrap(c["default"].mark(function E() {
                    var e, t, n, r, i, o;
                    return c["default"].wrap(function(s) {
                        for (;;) switch (s.prev = s.next) {
                            case 0:
                                if (this._cues.length) {
                                    s.next = 2;
                                    break
                                }
                                return s.abrupt("return");
                            case 2:
                                return this._seeks.push({
                                    pos: this._encoder.tell() - this._firstSegmentPos,
                                    name: "Cues"
                                }), s.next = 5, this._encode("start", {
                                    name: "Cues"
                                });
                            case 5:
                                e = !0, t = !1, n = void 0, s.prev = 8, r = (0, a["default"])(this._cues);
                            case 10:
                                if (e = (i = r.next()).done) {
                                    s.next = 29;
                                    break
                                }
                                return o = i.value, s.next = 14, this._encode("start", {
                                    name: "CuePoint"
                                });
                            case 14:
                                return s.next = 16, this._encode("tag", {
                                    name: "CueTime",
                                    data: f.writeUInt(o.time)
                                });
                            case 16:
                                return s.next = 18, this._encode("start", {
                                    name: "CueTrackPositions"
                                });
                            case 18:
                                return s.next = 20, this._encode("tag", {
                                    name: "CueTrack",
                                    data: f.writeUInt(o.track)
                                });
                            case 20:
                                return s.next = 22, this._encode("tag", {
                                    name: "CueClusterPosition",
                                    data: f.writeUInt(o.position)
                                });
                            case 22:
                                return s.next = 24, this._encode("end", {
                                    name: "CueTrackPositions"
                                });
                            case 24:
                                return s.next = 26, this._encode("end", {
                                    name: "CuePoint"
                                });
                            case 26:
                                e = !0, s.next = 10;
                                break;
                            case 29:
                                s.next = 35;
                                break;
                            case 31:
                                s.prev = 31, s.t0 = s["catch"](8), t = !0, n = s.t0;
                            case 35:
                                s.prev = 35, s.prev = 36, !e && r["return"] && r["return"]();
                            case 38:
                                if (s.prev = 38, !t) {
                                    s.next = 41;
                                    break
                                }
                                throw n;
                            case 41:
                                return s.finish(38);
                            case 42:
                                return s.finish(35);
                            case 43:
                                return s.next = 45, this._encode("end", {
                                    name: "Cues"
                                });
                            case 45:
                            case "end":
                                return s.stop()
                        }
                    }, E, this, [
                        [8, 31, 35, 43],
                        [36, , 38, 42]
                    ])
                })), v._flush = function(e) {
                    e = e || function() {}, this._encoder.end(e)
                }, v._insertSeekHead = h.wrap(c["default"].mark(function C() {
                    return c["default"].wrap(function(e) {
                        for (;;) switch (e.prev = e.next) {
                            case 0:
                                return e.next = 2, this._insertInSegmentVoid(h.wrap(c["default"].mark(function t() {
                                    var e, n, r, i, o, s;
                                    return c["default"].wrap(function(t) {
                                        for (;;) switch (t.prev = t.next) {
                                            case 0:
                                                return t.next = 2, this._encode("start", {
                                                    name: "SeekHead"
                                                });
                                            case 2:
                                                e = !0, n = !1, r = void 0, t.prev = 5, i = (0, a["default"])(this._seeks);
                                            case 7:
                                                if (e = (o = i.next()).done) {
                                                    t.next = 20;
                                                    break
                                                }
                                                return s = o.value, t.next = 11, this._encode("start", {
                                                    name: "Seek"
                                                });
                                            case 11:
                                                return t.next = 13, this._encode("tag", {
                                                    name: "SeekID",
                                                    data: this._encoder.getSchemaInfo(s.name)
                                                });
                                            case 13:
                                                return t.next = 15, this._encode("tag", {
                                                    name: "SeekPosition",
                                                    data: f.writeUInt(s.pos)
                                                });
                                            case 15:
                                                return t.next = 17, this._encode("end", {
                                                    name: "Seek"
                                                });
                                            case 17:
                                                e = !0, t.next = 7;
                                                break;
                                            case 20:
                                                t.next = 26;
                                                break;
                                            case 22:
                                                t.prev = 22, t.t0 = t["catch"](5), n = !0, r = t.t0;
                                            case 26:
                                                t.prev = 26, t.prev = 27, !e && i["return"] && i["return"]();
                                            case 29:
                                                if (t.prev = 29, !n) {
                                                    t.next = 32;
                                                    break
                                                }
                                                throw r;
                                            case 32:
                                                return t.finish(29);
                                            case 33:
                                                return t.finish(26);
                                            case 34:
                                                return t.next = 36, this._encode("end", {
                                                    name: "SeekHead"
                                                });
                                            case 36:
                                            case "end":
                                                return t.stop()
                                        }
                                    }, t, this, [
                                        [5, 22, 26, 34],
                                        [27, , 29, 33]
                                    ])
                                }).bind(this)));
                            case 2:
                            case "end":
                                return e.stop()
                        }
                    }, C, this)
                })), v._writeInfo = h.wrap(c["default"].mark(function A() {
                    var e, t, n;
                    return c["default"].wrap(function(r) {
                        for (;;) switch (r.prev = r.next) {
                            case 0:
                                if (!this._infoNode) {
                                    r.next = 7;
                                    break
                                }
                                for (this._infoNode.removeChildrenByName("Duration"), this._infoNode.addChild(new g({
                                        name: "Duration",
                                        data: f.writeFloat(this._duration)
                                    })), e = ["WritingApp", "MuxingApp"], t = 0; t < e.length; t++) n = e[t], this._infoNode.removeChildrenByName(n), this._infoNode.addChild(new g({
                                    name: n,
                                    data: f.writeUtf8("w69b-mediarecorder")
                                }));
                                return r.next = 7, this._insertInSegmentVoid(function() {
                                    return this._writeNode(this._infoNode)
                                }.bind(this));
                            case 7:
                            case "end":
                                return r.stop()
                        }
                    }, A, this)
                })), v._onEndOfSegment = h.wrap(c["default"].mark(function D() {
                    return c["default"].wrap(function(e) {
                        for (;;) switch (e.prev = e.next) {
                            case 0:
                                return e.next = 2, this._writeCues();
                            case 2:
                                return e.next = 4, this._writeInfo();
                            case 4:
                                return e.next = 6, this._insertSeekHead();
                            case 6:
                            case "end":
                                return e.stop()
                        }
                    }, D, this)
                })), t.exports = i
            }).call(this, e("buffer").Buffer)
        }, {
            "./async-tool.js": 3,
            "./seeking-ebml-encoder.js": 8,
            "./subtreeparser.js": 9,
            "babel-runtime/core-js/get-iterator": 10,
            "babel-runtime/regenerator": 110,
            buffer: 113,
            co: 138,
            debug: 139,
            ebml: 142,
            flushwritable: 150,
            util: 153
        }],
        5: [function(e, t, n) {
            "use strict";

            function r(e) {
                return e && e.__esModule ? e : {
                    "default": e
                }
            }

            function i(e) {
                var t = new s.Decoder,
                    n = new c(e);
                t.pipe(n), this._decoder = t, this._cuebuilder = n
            }
            var o = e("babel-runtime/core-js/promise"),
                a = r(o),
                s = e("ebml"),
                c = e("./cuebuilder.js"),
                u = e("./async-tool.js"),
                l = i.prototype;
            l.write = function(e) {
                return u.wrapErrCallback(function(t) {
                    this._decoder.write(e, t)
                }.bind(this))
            }, l.end = function(e) {
                var t = new a["default"](function(e) {
                    this._cuebuilder.on("finish", e)
                }.bind(this));
                return this._decoder.end(), t
            }, t.exports = i
        }, {
            "./async-tool.js": 3,
            "./cuebuilder.js": 4,
            "babel-runtime/core-js/promise": 15,
            ebml: 142
        }],
        6: [function(e, t, n) {
            (function(n) {
                "use strict";
                t.exports = {
                    SeekingEbmlEncoder: e("./seeking-ebml-encoder.js"),
                    SeekableMemoryWriter: e("./seekable-memory-writer.js"),
                    CueBuilder: e("./cuebuilder.js"),
                    CuePipeline: e("./cuepipeline.js"),
                    SubtreeParser: e("./subtreeparser.js"),
                    asyncTool: e("./async-tool.js"),
                    Buffers: e("buffers"),
                    Buffer: n
                }
            }).call(this, e("buffer").Buffer)
        }, {
            "./async-tool.js": 3,
            "./cuebuilder.js": 4,
            "./cuepipeline.js": 5,
            "./seekable-memory-writer.js": 7,
            "./seeking-ebml-encoder.js": 8,
            "./subtreeparser.js": 9,
            buffer: 113,
            buffers: 137
        }],
        7: [function(e, t, n) {
            "use strict";

            function r(e) {
                return e && e.__esModule ? e : {
                    "default": e
                }
            }

            function i() {
                this._buffers = new s, this._pos = 0
            }
            var o = e("babel-runtime/core-js/promise"),
                a = r(o),
                s = e("buffers"),
                c = i.prototype;
            c.seek = function(e) {
                e >= 0 ? this._pos = e : this._pos = this.getSize()
            }, c.write = function(e, t) {
                var n = "undefined" != typeof t;
                return n || (t = this._pos), t < this.getSize() ? this._buffers.splice(t, e.length, e) : this._buffers.push(e.slice()), n || (this._pos += e.length), a["default"].resolve()
            }, c.getSize = function() {
                return this._buffers.length
            }, c.close = function() {
                return a["default"].resolve()
            }, c.tell = function() {
                return this._pos
            }, c.toBuffer = function() {
                return this._buffers.toBuffer()
            }, t.exports = i
        }, {
            "babel-runtime/core-js/promise": 15,
            buffers: 137
        }],
        8: [function(e, t, n) {
            (function(n) {
                "use strict";

                function r(e) {
                    return e && e.__esModule ? e : {
                        "default": e
                    }
                }

                function i(e) {
                    if (!e || !e.write) throw new Error("SeekingEbmlEncoder requires a seekable file");
                    u.call(this, {
                        objectMode: !0
                    }), this._file = e;
                    var t = {};
                    (0, c["default"])(f).forEach(function(e) {
                        var r = f[e];
                        t[r.name] = new n(e, "hex")
                    });
                    this._tagsByName = t, this._stack = []
                }
                var o = e("babel-runtime/regenerator"),
                    a = r(o),
                    s = e("babel-runtime/core-js/object/keys"),
                    c = r(s),
                    u = e("flushwritable"),
                    l = e("ebml").tools,
                    f = e("ebml").schema,
                    h = e("debug")("mediarecorder:encoder"),
                    d = e("buffers"),
                    p = e("co"),
                    m = 8;
                e("util").inherits(i, u), i.prototype._write = p.wrap(a["default"].mark(function g(e, t, n) {
                    return a["default"].wrap(function(t) {
                        for (;;) switch (t.prev = t.next) {
                            case 0:
                                if (h("encode " + e[0] + " " + e[1].name), t.prev = 1, "start" !== e[0]) {
                                    t.next = 7;
                                    break
                                }
                                return t.next = 5, this.startTag(e[1]);
                            case 5:
                                t.next = 15;
                                break;
                            case 7:
                                if ("tag" !== e[0]) {
                                    t.next = 12;
                                    break
                                }
                                return t.next = 10, this.writeTag(e[1]);
                            case 10:
                                t.next = 15;
                                break;
                            case 12:
                                if ("end" !== e[0]) {
                                    t.next = 15;
                                    break
                                }
                                return t.next = 15, this.endTag(e[1]);
                            case 15:
                                n(), t.next = 22;
                                break;
                            case 18:
                                t.prev = 18, t.t0 = t["catch"](1), console.error(t.t0.stack), n(t.t0);
                            case 22:
                            case "end":
                                return t.stop()
                        }
                    }, g, this, [
                        [1, 18]
                    ])
                })), i.prototype.getSchemaInfo = function(e) {
                    var t = this._tagsByName[e];
                    return t ? t : null
                }, i.prototype._getStackEnd = function() {
                    return this._stack[this._stack.length - 1]
                }, i.prototype._encodeTag = function(e, t, n) {
                    return d([e, l.writeVint(t.length, n), t])
                }, i.prototype.writeTag = p.wrap(a["default"].mark(function b(e) {
                    var t, n;
                    return a["default"].wrap(function(r) {
                        for (;;) switch (r.prev = r.next) {
                            case 0:
                                if (t = this.getSchemaInfo(e.name)) {
                                    r.next = 3;
                                    break
                                }
                                throw new Error("No schema entry found for " + e.name);
                            case 3:
                                return n = this._encodeTag(t, e.data, e.minSizeLength), r.next = 6, this._file.write(n);
                            case 6:
                                this._stack.length && (this._getStackEnd().size += n.length);
                            case 7:
                            case "end":
                                return r.stop()
                        }
                    }, b, this)
                })), i.prototype.startTag = p.wrap(a["default"].mark(function v(e) {
                    var t, n, r;
                    return a["default"].wrap(function(i) {
                        for (;;) switch (i.prev = i.next) {
                            case 0:
                                if (t = e.name, n = this.getSchemaInfo(t)) {
                                    i.next = 4;
                                    break
                                }
                                throw new Error("No schema entry found for " + t);
                            case 4:
                                return i.next = 6, this._file.write(n);
                            case 6:
                                return e = {
                                    offset: this._file.tell(),
                                    size: 0,
                                    name: t
                                }, r = l.writeVint(-1), i.next = 10, this._file.write(r);
                            case 10:
                                h("starting tag " + t + " at " + e.offset), this._stack.length && (this._getStackEnd().size += r.length + n.length), this._stack.push(e);
                            case 13:
                            case "end":
                                return i.stop()
                        }
                    }, v, this)
                })), i.prototype.endTag = p.wrap(a["default"].mark(function y(e) {
                    var t, n, r;
                    return a["default"].wrap(function(i) {
                        for (;;) switch (i.prev = i.next) {
                            case 0:
                                if (t = e.name, n = this._stack.pop(), t === n.name) {
                                    i.next = 4;
                                    break
                                }
                                throw new Error("You tried to end tag " + t + " without while " + n.name + " was not closed yet.");
                            case 4:
                                return r = l.writeVint(n.size, m), i.next = 7, this._file.write(r, n.offset);
                            case 7:
                                h("writing size " + n.size + " at " + n.offset), this._stack.length && (this._getStackEnd().size += n.size);
                            case 9:
                            case "end":
                                return i.stop()
                        }
                    }, y, this)
                })), i.prototype.seek = function(e) {
                    this._file.seek(e)
                }, i.prototype.tell = function() {
                    return this._file.tell()
                }, i.prototype._flush = p.wrap(a["default"].mark(function _(e) {
                    return a["default"].wrap(function(t) {
                        for (;;) switch (t.prev = t.next) {
                            case 0:
                                return e = e || function() {}, t.next = 3, this._file.close();
                            case 3:
                                e();
                            case 4:
                            case "end":
                                return t.stop()
                        }
                    }, _, this)
                })), t.exports = i
            }).call(this, e("buffer").Buffer)
        }, {
            "babel-runtime/core-js/object/keys": 13,
            "babel-runtime/regenerator": 110,
            buffer: 113,
            buffers: 137,
            co: 138,
            debug: 139,
            ebml: 142,
            flushwritable: 150,
            util: 153
        }],
        9: [function(e, t, n) {
            "use strict";

            function r(e) {
                return e && e.__esModule ? e : {
                    "default": e
                }
            }

            function i(e, t) {
                this._stack = [], this._contextStack = [], this._tagPath = "", this._handlers = e, this._handlerContext = t
            }

            function o(e) {
                this.tag = e, this.children = []
            }
            var a = e("babel-runtime/core-js/promise"),
                s = r(a),
                c = e("babel-runtime/regenerator"),
                u = r(c),
                l = e("ebml").tools,
                f = e("debug")("mediarecorder:subtreeparser"),
                h = e("co"),
                d = i.prototype;
            o.prototype.addChild = function(e) {
                this.children.push(e)
            }, o.prototype.getAllChildrenByName = function(e) {
                return this.children.filter(function(t) {
                    return t.tag.name == e
                })
            }, o.prototype.getChildByName = function(e) {
                return this.children.find(function(t) {
                    return t.tag.name == e
                })
            }, o.prototype.removeChildrenByName = function(e) {
                return this.children = this.children.filter(function(t) {
                    return t.tag.name !== e
                })
            }, o.prototype.getValue = function() {
                switch (this.tag.type) {
                    case "u":
                        return l.readUInt(this.tag.data);
                    case "f":
                        return l.readFloat(this.tag.data);
                    case "b":
                        return this.tag.data;
                    default:
                        throw new Error("Unsupported type: " + this.tag.type)
                }
            }, o.prototype.toJSON = function() {
                var e = null;
                try {
                    "b" !== this.tag.type && (e = this.getValue())
                } catch (t) {}
                return {
                    tagName: this.tag.name,
                    children: this.children,
                    value: e
                }
            }, d._updateContext = function(e, t) {
                "start" === e ? this._contextStack.push(t.name) : "end" === e && this._contextStack.pop(), "tag" === e || "end" === e ? this._tagPath = this._contextStack.concat(t.name).join(".") : this._tagPath = this._contextStack.join(".")
            }, d.parseTag = h.wrap(u["default"].mark(function p(e) {
                var t, n;
                return u["default"].wrap(function(r) {
                    for (;;) switch (r.prev = r.next) {
                        case 0:
                            if (t = e[0], n = e[1], this._updateContext(t, n), f("path " + this._tagPath), !this._stack.length && !this._handlers[this._tagPath]) {
                                r.next = 18;
                                break
                            }
                            if ("start" !== t) {
                                r.next = 9;
                                break
                            }
                            this._startTree(n), r.next = 17;
                            break;
                        case 9:
                            if ("end" !== t) {
                                r.next = 14;
                                break
                            }
                            return r.next = 12, this._endTree(n);
                        case 12:
                            r.next = 17;
                            break;
                        case 14:
                            if ("tag" !== t) {
                                r.next = 17;
                                break
                            }
                            return r.next = 17, this._addNode(n);
                        case 17:
                            return r.abrupt("return", !0);
                        case 18:
                            return r.abrupt("return", !1);
                        case 19:
                        case "end":
                            return r.stop()
                    }
                }, p, this)
            })), d._addNode = h.wrap(u["default"].mark(function m(e) {
                return u["default"].wrap(function(t) {
                    for (;;) switch (t.prev = t.next) {
                        case 0:
                            if (!this._stack.length) {
                                t.next = 4;
                                break
                            }
                            this._getStackEnd().addChild(new o(e)), t.next = 6;
                            break;
                        case 4:
                            return t.next = 6, this._gotSubtree(new o(e));
                        case 6:
                        case "end":
                            return t.stop()
                    }
                }, m, this)
            })), d._endTree = h.wrap(u["default"].mark(function g(e) {
                var t;
                return u["default"].wrap(function(e) {
                    for (;;) switch (e.prev = e.next) {
                        case 0:
                            if (t = this._stack.pop(), this._stack.length) {
                                e.next = 4;
                                break
                            }
                            return e.next = 4, this._gotSubtree(t);
                        case 4:
                            return e.abrupt("return", s["default"].resolve());
                        case 5:
                        case "end":
                            return e.stop()
                    }
                }, g, this)
            })), d.getCurrentPath = function() {
                return this._tagPath
            }, d._getStackEnd = function() {
                return this._stack[this._stack.length - 1]
            }, d._startTree = function(e) {
                var t = new o(e);
                this._stack.length && this._getStackEnd().addChild(t), this._stack.push(t)
            }, d._gotSubtree = h.wrap(u["default"].mark(function b(e) {
                var t;
                return u["default"].wrap(function(n) {
                    for (;;) switch (n.prev = n.next) {
                        case 0:
                            return t = this._handlers[this._tagPath], n.next = 3, s["default"].resolve(t.call(this._handlerContext, e));
                        case 3:
                        case "end":
                            return n.stop()
                    }
                }, b, this)
            })), i.SimpleNode = o, t.exports = i
        }, {
            "babel-runtime/core-js/promise": 15,
            "babel-runtime/regenerator": 110,
            co: 138,
            debug: 139,
            ebml: 142
        }],
        10: [function(e, t, n) {
            t.exports = {
                "default": e("core-js/library/fn/get-iterator"),
                __esModule: !0
            }
        }, {
            "core-js/library/fn/get-iterator": 22
        }],
        11: [function(e, t, n) {
            t.exports = {
                "default": e("core-js/library/fn/object/create"),
                __esModule: !0
            }
        }, {
            "core-js/library/fn/object/create": 23
        }],
        12: [function(e, t, n) {
            t.exports = {
                "default": e("core-js/library/fn/object/define-property"),
                __esModule: !0
            }
        }, {
            "core-js/library/fn/object/define-property": 24
        }],
        13: [function(e, t, n) {
            t.exports = {
                "default": e("core-js/library/fn/object/keys"),
                __esModule: !0
            }
        }, {
            "core-js/library/fn/object/keys": 25
        }],
        14: [function(e, t, n) {
            t.exports = {
                "default": e("core-js/library/fn/object/set-prototype-of"),
                __esModule: !0
            }
        }, {
            "core-js/library/fn/object/set-prototype-of": 26
        }],
        15: [function(e, t, n) {
            t.exports = {
                "default": e("core-js/library/fn/promise"),
                __esModule: !0
            }
        }, {
            "core-js/library/fn/promise": 27
        }],
        16: [function(e, t, n) {
            t.exports = {
                "default": e("core-js/library/fn/symbol"),
                __esModule: !0
            }
        }, {
            "core-js/library/fn/symbol": 28
        }],
        17: [function(e, t, n) {
            t.exports = {
                "default": e("core-js/library/fn/symbol/iterator"),
                __esModule: !0
            }
        }, {
            "core-js/library/fn/symbol/iterator": 29
        }],
        18: [function(e, t, n) {
            "use strict";

            function r(e) {
                return e && e.__esModule ? e : {
                    "default": e
                }
            }
            n.__esModule = !0;
            var i = e("babel-runtime/core-js/promise"),
                o = r(i);
            n["default"] = function(e) {
                return function() {
                    var t = e.apply(this, arguments);
                    return new o["default"](function(e, n) {
                        function r(i, a) {
                            try {
                                var s = t[i](a),
                                    c = s.value
                            } catch (u) {
                                return void n(u)
                            }
                            return s.done ? void e(c) : o["default"].resolve(c).then(function(e) {
                                return r("next", e)
                            }, function(e) {
                                return r("throw", e)
                            })
                        }
                        return r("next")
                    })
                }
            }
        }, {
            "babel-runtime/core-js/promise": 15
        }],
        19: [function(e, t, n) {
            "use strict";
            n.__esModule = !0, n["default"] = function(e, t) {
                if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
            }
        }, {}],
        20: [function(e, t, n) {
            "use strict";

            function r(e) {
                return e && e.__esModule ? e : {
                    "default": e
                }
            }
            n.__esModule = !0;
            var i = e("babel-runtime/core-js/object/define-property"),
                o = r(i);
            n["default"] = function() {
                function e(e, t) {
                    for (var n = 0; n < t.length; n++) {
                        var r = t[n];
                        r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), (0, o["default"])(e, r.key, r)
                    }
                }
                return function(t, n, r) {
                    return n && e(t.prototype, n), r && e(t, r), t
                }
            }()
        }, {
            "babel-runtime/core-js/object/define-property": 12
        }],
        21: [function(e, t, n) {
            "use strict";

            function r(e) {
                return e && e.__esModule ? e : {
                    "default": e
                }
            }
            n.__esModule = !0;
            var i = e("babel-runtime/core-js/symbol/iterator"),
                o = r(i),
                a = e("babel-runtime/core-js/symbol"),
                s = r(a),
                c = "function" == typeof s["default"] && "symbol" == typeof o["default"] ? function(e) {
                    return typeof e
                } : function(e) {
                    return e && "function" == typeof s["default"] && e.constructor === s["default"] ? "symbol" : typeof e
                };
            n["default"] = "function" == typeof s["default"] && "symbol" === c(o["default"]) ? function(e) {
                return "undefined" == typeof e ? "undefined" : c(e)
            } : function(e) {
                return e && "function" == typeof s["default"] && e.constructor === s["default"] ? "symbol" : "undefined" == typeof e ? "undefined" : c(e)
            }
        }, {
            "babel-runtime/core-js/symbol": 16,
            "babel-runtime/core-js/symbol/iterator": 17
        }],
        22: [function(e, t, n) {
            e("../modules/web.dom.iterable"), e("../modules/es6.string.iterator"), t.exports = e("../modules/core.get-iterator")
        }, {
            "../modules/core.get-iterator": 99,
            "../modules/es6.string.iterator": 107,
            "../modules/web.dom.iterable": 109
        }],
        23: [function(e, t, n) {
            e("../../modules/es6.object.create");
            var r = e("../../modules/_core").Object;
            t.exports = function(e, t) {
                return r.create(e, t)
            }
        }, {
            "../../modules/_core": 37,
            "../../modules/es6.object.create": 101
        }],
        24: [function(e, t, n) {
            e("../../modules/es6.object.define-property");
            var r = e("../../modules/_core").Object;
            t.exports = function(e, t, n) {
                return r.defineProperty(e, t, n)
            }
        }, {
            "../../modules/_core": 37,
            "../../modules/es6.object.define-property": 102
        }],
        25: [function(e, t, n) {
            e("../../modules/es6.object.keys"), t.exports = e("../../modules/_core").Object.keys
        }, {
            "../../modules/_core": 37,
            "../../modules/es6.object.keys": 103
        }],
        26: [function(e, t, n) {
            e("../../modules/es6.object.set-prototype-of"), t.exports = e("../../modules/_core").Object.setPrototypeOf
        }, {
            "../../modules/_core": 37,
            "../../modules/es6.object.set-prototype-of": 104
        }],
        27: [function(e, t, n) {
            e("../modules/es6.object.to-string"), e("../modules/es6.string.iterator"), e("../modules/web.dom.iterable"), e("../modules/es6.promise"), t.exports = e("../modules/_core").Promise
        }, {
            "../modules/_core": 37,
            "../modules/es6.object.to-string": 105,
            "../modules/es6.promise": 106,
            "../modules/es6.string.iterator": 107,
            "../modules/web.dom.iterable": 109
        }],
        28: [function(e, t, n) {
            e("../../modules/es6.symbol"), e("../../modules/es6.object.to-string"), t.exports = e("../../modules/_core").Symbol
        }, {
            "../../modules/_core": 37,
            "../../modules/es6.object.to-string": 105,
            "../../modules/es6.symbol": 108
        }],
        29: [function(e, t, n) {
            e("../../modules/es6.string.iterator"), e("../../modules/web.dom.iterable"), t.exports = e("../../modules/_wks")("iterator")
        }, {
            "../../modules/_wks": 97,
            "../../modules/es6.string.iterator": 107,
            "../../modules/web.dom.iterable": 109
        }],
        30: [function(e, t, n) {
            t.exports = function(e) {
                if ("function" != typeof e) throw TypeError(e + " is not a function!");
                return e
            }
        }, {}],
        31: [function(e, t, n) {
            t.exports = function() {}
        }, {}],
        32: [function(e, t, n) {
            t.exports = function(e, t, n, r) {
                if (!(e instanceof t) || void 0 !== r && r in e) throw TypeError(n + ": incorrect invocation!");
                return e
            }
        }, {}],
        33: [function(e, t, n) {
            var r = e("./_is-object");
            t.exports = function(e) {
                if (!r(e)) throw TypeError(e + " is not an object!");
                return e
            }
        }, {
            "./_is-object": 56
        }],
        34: [function(e, t, n) {
            var r = e("./_to-iobject"),
                i = e("./_to-length"),
                o = e("./_to-index");
            t.exports = function(e) {
                return function(t, n, a) {
                    var s, c = r(t),
                        u = i(c.length),
                        l = o(a, u);
                    if (e && n != n) {
                        for (; u > l;)
                            if (s = c[l++], s != s) return !0
                    } else
                        for (; u > l; l++)
                            if ((e || l in c) && c[l] === n) return e || l;
                    return !e && -1
                }
            }
        }, {
            "./_to-index": 90,
            "./_to-iobject": 92,
            "./_to-length": 93
        }],
        35: [function(e, t, n) {
            var r = e("./_cof"),
                i = e("./_wks")("toStringTag"),
                o = "Arguments" == r(function() {
                    return arguments
                }());
            t.exports = function(e) {
                var t, n, a;
                return void 0 === e ? "Undefined" : null === e ? "Null" : "string" == typeof(n = (t = Object(e))[i]) ? n : o ? r(t) : "Object" == (a = r(t)) && "function" == typeof t.callee ? "Arguments" : a
            }
        }, {
            "./_cof": 36,
            "./_wks": 97
        }],
        36: [function(e, t, n) {
            var r = {}.toString;
            t.exports = function(e) {
                return r.call(e).slice(8, -1)
            }
        }, {}],
        37: [function(e, t, n) {
            var r = t.exports = {
                version: "2.1.3"
            };
            "number" == typeof __e && (__e = r)
        }, {}],
        38: [function(e, t, n) {
            var r = e("./_a-function");
            t.exports = function(e, t, n) {
                if (r(e), void 0 === t) return e;
                switch (n) {
                    case 1:
                        return function(n) {
                            return e.call(t, n)
                        };
                    case 2:
                        return function(n, r) {
                            return e.call(t, n, r)
                        };
                    case 3:
                        return function(n, r, i) {
                            return e.call(t, n, r, i)
                        }
                }
                return function() {
                    return e.apply(t, arguments)
                }
            }
        }, {
            "./_a-function": 30
        }],
        39: [function(e, t, n) {
            t.exports = function(e) {
                if (void 0 == e) throw TypeError("Can't call method on  " + e);
                return e
            }
        }, {}],
        40: [function(e, t, n) {
            t.exports = !e("./_fails")(function() {
                return 7 != Object.defineProperty({}, "a", {
                    get: function() {
                        return 7
                    }
                }).a
            })
        }, {
            "./_fails": 45
        }],
        41: [function(e, t, n) {
            var r = e("./_is-object"),
                i = e("./_global").document,
                o = r(i) && r(i.createElement);
            t.exports = function(e) {
                return o ? i.createElement(e) : {}
            }
        }, {
            "./_global": 47,
            "./_is-object": 56
        }],
        42: [function(e, t, n) {
            t.exports = "constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",")
        }, {}],
        43: [function(e, t, n) {
            var r = e("./_object-keys"),
                i = e("./_object-gops"),
                o = e("./_object-pie");
            t.exports = function(e) {
                var t = r(e),
                    n = i.f;
                if (n)
                    for (var a, s = n(e), c = o.f, u = 0; s.length > u;) c.call(e, a = s[u++]) && t.push(a);
                return t
            }
        }, {
            "./_object-gops": 73,
            "./_object-keys": 76,
            "./_object-pie": 77
        }],
        44: [function(e, t, n) {
            var r = e("./_global"),
                i = e("./_core"),
                o = e("./_ctx"),
                a = e("./_hide"),
                s = "prototype",
                c = function(e, t, n) {
                    var u, l, f, h = e & c.F,
                        d = e & c.G,
                        p = e & c.S,
                        m = e & c.P,
                        g = e & c.B,
                        b = e & c.W,
                        v = d ? i : i[t] || (i[t] = {}),
                        y = v[s],
                        _ = d ? r : p ? r[t] : (r[t] || {})[s];
                    d && (n = t);
                    for (u in n) l = !h && _ && void 0 !== _[u], l && u in v || (f = l ? _[u] : n[u], v[u] = d && "function" != typeof _[u] ? n[u] : g && l ? o(f, r) : b && _[u] == f ? function(e) {
                        var t = function(t, n, r) {
                            if (this instanceof e) {
                                switch (arguments.length) {
                                    case 0:
                                        return new e;
                                    case 1:
                                        return new e(t);
                                    case 2:
                                        return new e(t, n)
                                }
                                return new e(t, n, r)
                            }
                            return e.apply(this, arguments)
                        };
                        return t[s] = e[s], t
                    }(f) : m && "function" == typeof f ? o(Function.call, f) : f, m && ((v.virtual || (v.virtual = {}))[u] = f, e & c.R && y && !y[u] && a(y, u, f)))
                };
            c.F = 1, c.G = 2, c.S = 4, c.P = 8, c.B = 16, c.W = 32, c.U = 64, c.R = 128, t.exports = c
        }, {
            "./_core": 37,
            "./_ctx": 38,
            "./_global": 47,
            "./_hide": 49
        }],
        45: [function(e, t, n) {
            t.exports = function(e) {
                try {
                    return !!e()
                } catch (t) {
                    return !0
                }
            }
        }, {}],
        46: [function(e, t, n) {
            var r = e("./_ctx"),
                i = e("./_iter-call"),
                o = e("./_is-array-iter"),
                a = e("./_an-object"),
                s = e("./_to-length"),
                c = e("./core.get-iterator-method");
            t.exports = function(e, t, n, u, l) {
                var f, h, d, p = l ? function() {
                        return e
                    } : c(e),
                    m = r(n, u, t ? 2 : 1),
                    g = 0;
                if ("function" != typeof p) throw TypeError(e + " is not iterable!");
                if (o(p))
                    for (f = s(e.length); f > g; g++) t ? m(a(h = e[g])[0], h[1]) : m(e[g]);
                else
                    for (d = p.call(e); !(h = d.next()).done;) i(d, m, h.value, t)
            }
        }, {
            "./_an-object": 33,
            "./_ctx": 38,
            "./_is-array-iter": 54,
            "./_iter-call": 57,
            "./_to-length": 93,
            "./core.get-iterator-method": 98
        }],
        47: [function(e, t, n) {
            var r = t.exports = "undefined" != typeof window && window.Math == Math ? window : "undefined" != typeof self && self.Math == Math ? self : Function("return this")();
            "number" == typeof __g && (__g = r)
        }, {}],
        48: [function(e, t, n) {
            var r = {}.hasOwnProperty;
            t.exports = function(e, t) {
                return r.call(e, t)
            }
        }, {}],
        49: [function(e, t, n) {
            var r = e("./_object-dp"),
                i = e("./_property-desc");
            t.exports = e("./_descriptors") ? function(e, t, n) {
                return r.f(e, t, i(1, n))
            } : function(e, t, n) {
                return e[t] = n, e
            }
        }, {
            "./_descriptors": 40,
            "./_object-dp": 68,
            "./_property-desc": 79
        }],
        50: [function(e, t, n) {
            t.exports = e("./_global").document && document.documentElement
        }, {
            "./_global": 47
        }],
        51: [function(e, t, n) {
            t.exports = !e("./_descriptors") && !e("./_fails")(function() {
                return 7 != Object.defineProperty(e("./_dom-create")("div"), "a", {
                    get: function() {
                        return 7
                    }
                }).a
            })
        }, {
            "./_descriptors": 40,
            "./_dom-create": 41,
            "./_fails": 45
        }],
        52: [function(e, t, n) {
            t.exports = function(e, t, n) {
                var r = void 0 === n;
                switch (t.length) {
                    case 0:
                        return r ? e() : e.call(n);
                    case 1:
                        return r ? e(t[0]) : e.call(n, t[0]);
                    case 2:
                        return r ? e(t[0], t[1]) : e.call(n, t[0], t[1]);
                    case 3:
                        return r ? e(t[0], t[1], t[2]) : e.call(n, t[0], t[1], t[2]);
                    case 4:
                        return r ? e(t[0], t[1], t[2], t[3]) : e.call(n, t[0], t[1], t[2], t[3])
                }
                return e.apply(n, t)
            }
        }, {}],
        53: [function(e, t, n) {
            var r = e("./_cof");
            t.exports = Object("z").propertyIsEnumerable(0) ? Object : function(e) {
                return "String" == r(e) ? e.split("") : Object(e)
            }
        }, {
            "./_cof": 36
        }],
        54: [function(e, t, n) {
            var r = e("./_iterators"),
                i = e("./_wks")("iterator"),
                o = Array.prototype;
            t.exports = function(e) {
                return void 0 !== e && (r.Array === e || o[i] === e)
            }
        }, {
            "./_iterators": 62,
            "./_wks": 97
        }],
        55: [function(e, t, n) {
            var r = e("./_cof");
            t.exports = Array.isArray || function(e) {
                return "Array" == r(e)
            }
        }, {
            "./_cof": 36
        }],
        56: [function(e, t, n) {
            t.exports = function(e) {
                return "object" == typeof e ? null !== e : "function" == typeof e
            }
        }, {}],
        57: [function(e, t, n) {
            var r = e("./_an-object");
            t.exports = function(e, t, n, i) {
                try {
                    return i ? t(r(n)[0], n[1]) : t(n)
                } catch (o) {
                    var a = e["return"];
                    throw void 0 !== a && r(a.call(e)), o
                }
            }
        }, {
            "./_an-object": 33
        }],
        58: [function(e, t, n) {
            "use strict";
            var r = e("./_object-create"),
                i = e("./_property-desc"),
                o = e("./_set-to-string-tag"),
                a = {};
            e("./_hide")(a, e("./_wks")("iterator"), function() {
                return this
            }), t.exports = function(e, t, n) {
                e.prototype = r(a, {
                    next: i(1, n)
                }), o(e, t + " Iterator")
            }
        }, {
            "./_hide": 49,
            "./_object-create": 67,
            "./_property-desc": 79,
            "./_set-to-string-tag": 84,
            "./_wks": 97
        }],
        59: [function(e, t, n) {
            "use strict";
            var r = e("./_library"),
                i = e("./_export"),
                o = e("./_redefine"),
                a = e("./_hide"),
                s = e("./_has"),
                c = e("./_iterators"),
                u = e("./_iter-create"),
                l = e("./_set-to-string-tag"),
                f = e("./_object-gpo"),
                h = e("./_wks")("iterator"),
                d = !([].keys && "next" in [].keys()),
                p = "@@iterator",
                m = "keys",
                g = "values",
                b = function() {
                    return this
                };
            t.exports = function(e, t, n, v, y, _, w) {
                u(n, t, v);
                var k, x, S, T = function(e) {
                        if (!d && e in A) return A[e];
                        switch (e) {
                            case m:
                                return function() {
                                    return new n(this, e)
                                };
                            case g:
                                return function() {
                                    return new n(this, e)
                                }
                        }
                        return function() {
                            return new n(this, e)
                        }
                    },
                    j = t + " Iterator",
                    E = y == g,
                    C = !1,
                    A = e.prototype,
                    D = A[h] || A[p] || y && A[y],
                    P = D || T(y),
                    B = y ? E ? T("entries") : P : void 0,
                    M = "Array" == t ? A.entries || D : D;
                if (M && (S = f(M.call(new e)), S !== Object.prototype && (l(S, j, !0), r || s(S, h) || a(S, h, b))), E && D && D.name !== g && (C = !0, P = function() {
                        return D.call(this)
                    }), r && !w || !d && !C && A[h] || a(A, h, P), c[t] = P, c[j] = b, y)
                    if (k = {
                            values: E ? P : T(g),
                            keys: _ ? P : T(m),
                            entries: B
                        }, w)
                        for (x in k) x in A || o(A, x, k[x]);
                    else i(i.P + i.F * (d || C), t, k);
                return k
            }
        }, {
            "./_export": 44,
            "./_has": 48,
            "./_hide": 49,
            "./_iter-create": 58,
            "./_iterators": 62,
            "./_library": 64,
            "./_object-gpo": 74,
            "./_redefine": 81,
            "./_set-to-string-tag": 84,
            "./_wks": 97
        }],
        60: [function(e, t, n) {
            var r = e("./_wks")("iterator"),
                i = !1;
            try {
                var o = [7][r]();
                o["return"] = function() {
                    i = !0
                }, Array.from(o, function() {
                    throw 2
                })
            } catch (a) {}
            t.exports = function(e, t) {
                if (!t && !i) return !1;
                var n = !1;
                try {
                    var o = [7],
                        a = o[r]();
                    a.next = function() {
                        n = !0
                    }, o[r] = function() {
                        return a
                    }, e(o)
                } catch (s) {}
                return n
            }
        }, {
            "./_wks": 97
        }],
        61: [function(e, t, n) {
            t.exports = function(e, t) {
                return {
                    value: t,
                    done: !!e
                }
            }
        }, {}],
        62: [function(e, t, n) {
            t.exports = {}
        }, {}],
        63: [function(e, t, n) {
            var r = e("./_object-keys"),
                i = e("./_to-iobject");
            t.exports = function(e, t) {
                for (var n, o = i(e), a = r(o), s = a.length, c = 0; s > c;)
                    if (o[n = a[c++]] === t) return n
            }
        }, {
            "./_object-keys": 76,
            "./_to-iobject": 92
        }],
        64: [function(e, t, n) {
            t.exports = !0
        }, {}],
        65: [function(e, t, n) {
            var r = e("./_uid")("meta"),
                i = e("./_is-object"),
                o = e("./_has"),
                a = e("./_object-dp").f,
                s = 0,
                c = Object.isExtensible || function() {
                    return !0
                },
                u = !e("./_fails")(function() {
                    return c(Object.preventExtensions({}))
                }),
                l = function(e) {
                    a(e, r, {
                        value: {
                            i: "O" + ++s,
                            w: {}
                        }
                    })
                },
                f = function(e, t) {
                    if (!i(e)) return "symbol" == typeof e ? e : ("string" == typeof e ? "S" : "P") + e;
                    if (!o(e, r)) {
                        if (!c(e)) return "F";
                        if (!t) return "E";
                        l(e)
                    }
                    return e[r].i
                },
                h = function(e, t) {
                    if (!o(e, r)) {
                        if (!c(e)) return !0;
                        if (!t) return !1;
                        l(e)
                    }
                    return e[r].w
                },
                d = function(e) {
                    return u && p.NEED && c(e) && !o(e, r) && l(e), e
                },
                p = t.exports = {
                    KEY: r,
                    NEED: !1,
                    fastKey: f,
                    getWeak: h,
                    onFreeze: d
                }
        }, {
            "./_fails": 45,
            "./_has": 48,
            "./_is-object": 56,
            "./_object-dp": 68,
            "./_uid": 96
        }],
        66: [function(e, t, n) {
            var r, i, o, a = e("./_global"),
                s = e("./_task").set,
                c = a.MutationObserver || a.WebKitMutationObserver,
                u = a.process,
                l = a.Promise,
                f = "process" == e("./_cof")(u),
                h = function() {
                    var e, t, n;
                    for (f && (e = u.domain) && (u.domain = null, e.exit()); r;) t = r.domain, n = r.fn, t && t.enter(), n(), t && t.exit(), r = r.next;
                    i = void 0, e && e.enter()
                };
            if (f) o = function() {
                u.nextTick(h)
            };
            else if (c) {
                var d = 1,
                    p = document.createTextNode("");
                new c(h).observe(p, {
                    characterData: !0
                }), o = function() {
                    p.data = d = -d
                }
            } else o = l && l.resolve ? function() {
                l.resolve().then(h)
            } : function() {
                s.call(a, h)
            };
            t.exports = function(e) {
                var t = {
                    fn: e,
                    next: void 0,
                    domain: f && u.domain
                };
                i && (i.next = t), r || (r = t, o()), i = t
            }
        }, {
            "./_cof": 36,
            "./_global": 47,
            "./_task": 89
        }],
        67: [function(e, t, n) {
            var r = e("./_an-object"),
                i = e("./_object-dps"),
                o = e("./_enum-bug-keys"),
                a = e("./_shared-key")("IE_PROTO"),
                s = function() {},
                c = "prototype",
                u = function() {
                    var t, n = e("./_dom-create")("iframe"),
                        r = o.length,
                        i = ">";
                    for (n.style.display = "none", e("./_html").appendChild(n), n.src = "javascript:", t = n.contentWindow.document, t.open(), t.write("<script>document.F=Object</script" + i), t.close(), u = t.F; r--;) delete u[c][o[r]];
                    return u()
                };
            t.exports = Object.create || function(e, t) {
                var n;
                return null !== e ? (s[c] = r(e), n = new s, s[c] = null, n[a] = e) : n = u(), void 0 === t ? n : i(n, t)
            }
        }, {
            "./_an-object": 33,
            "./_dom-create": 41,
            "./_enum-bug-keys": 42,
            "./_html": 50,
            "./_object-dps": 69,
            "./_shared-key": 85
        }],
        68: [function(e, t, n) {
            var r = e("./_an-object"),
                i = e("./_ie8-dom-define"),
                o = e("./_to-primitive"),
                a = Object.defineProperty;
            n.f = e("./_descriptors") ? Object.defineProperty : function(e, t, n) {
                if (r(e), t = o(t, !0), r(n), i) try {
                    return a(e, t, n)
                } catch (s) {}
                if ("get" in n || "set" in n) throw TypeError("Accessors not supported!");
                return "value" in n && (e[t] = n.value), e
            }
        }, {
            "./_an-object": 33,
            "./_descriptors": 40,
            "./_ie8-dom-define": 51,
            "./_to-primitive": 95
        }],
        69: [function(e, t, n) {
            var r = e("./_object-dp"),
                i = e("./_an-object"),
                o = e("./_object-keys");
            t.exports = e("./_descriptors") ? Object.defineProperties : function(e, t) {
                i(e);
                for (var n, a = o(t), s = a.length, c = 0; s > c;) r.f(e, n = a[c++], t[n]);
                return e
            }
        }, {
            "./_an-object": 33,
            "./_descriptors": 40,
            "./_object-dp": 68,
            "./_object-keys": 76
        }],
        70: [function(e, t, n) {
            var r = e("./_object-pie"),
                i = e("./_property-desc"),
                o = e("./_to-iobject"),
                a = e("./_to-primitive"),
                s = e("./_has"),
                c = e("./_ie8-dom-define"),
                u = Object.getOwnPropertyDescriptor;
            n.f = e("./_descriptors") ? u : function(e, t) {
                if (e = o(e), t = a(t, !0), c) try {
                    return u(e, t)
                } catch (n) {}
                return s(e, t) ? i(!r.f.call(e, t), e[t]) : void 0
            }
        }, {
            "./_descriptors": 40,
            "./_has": 48,
            "./_ie8-dom-define": 51,
            "./_object-pie": 77,
            "./_property-desc": 79,
            "./_to-iobject": 92,
            "./_to-primitive": 95
        }],
        71: [function(e, t, n) {
            var r = e("./_to-iobject"),
                i = e("./_object-gopn").f,
                o = {}.toString,
                a = "object" == typeof window && window && Object.getOwnPropertyNames ? Object.getOwnPropertyNames(window) : [],
                s = function(e) {
                    try {
                        return i.f(e)
                    } catch (t) {
                        return a.slice()
                    }
                };
            t.exports.f = function(e) {
                return a && "[object Window]" == o.call(e) ? s(e) : i(r(e))
            }
        }, {
            "./_object-gopn": 72,
            "./_to-iobject": 92
        }],
        72: [function(e, t, n) {
            var r = e("./_object-keys-internal"),
                i = e("./_enum-bug-keys").concat("length", "prototype");
            n.f = Object.getOwnPropertyNames || function(e) {
                return r(e, i)
            }
        }, {
            "./_enum-bug-keys": 42,
            "./_object-keys-internal": 75
        }],
        73: [function(e, t, n) {
            n.f = Object.getOwnPropertySymbols
        }, {}],
        74: [function(e, t, n) {
            var r = e("./_has"),
                i = e("./_to-object"),
                o = e("./_shared-key")("IE_PROTO"),
                a = Object.prototype;
            t.exports = Object.getPrototypeOf || function(e) {
                return e = i(e), r(e, o) ? e[o] : "function" == typeof e.constructor && e instanceof e.constructor ? e.constructor.prototype : e instanceof Object ? a : null
            }
        }, {
            "./_has": 48,
            "./_shared-key": 85,
            "./_to-object": 94
        }],
        75: [function(e, t, n) {
            var r = e("./_has"),
                i = e("./_to-iobject"),
                o = e("./_array-includes")(!1),
                a = e("./_shared-key")("IE_PROTO");
            t.exports = function(e, t) {
                var n, s = i(e),
                    c = 0,
                    u = [];
                for (n in s) n != a && r(s, n) && u.push(n);
                for (; t.length > c;) r(s, n = t[c++]) && (~o(u, n) || u.push(n));
                return u
            }
        }, {
            "./_array-includes": 34,
            "./_has": 48,
            "./_shared-key": 85,
            "./_to-iobject": 92
        }],
        76: [function(e, t, n) {
            var r = e("./_object-keys-internal"),
                i = e("./_enum-bug-keys");
            t.exports = Object.keys || function(e) {
                return r(e, i)
            }
        }, {
            "./_enum-bug-keys": 42,
            "./_object-keys-internal": 75
        }],
        77: [function(e, t, n) {
            n.f = {}.propertyIsEnumerable
        }, {}],
        78: [function(e, t, n) {
            var r = e("./_export"),
                i = e("./_core"),
                o = e("./_fails");
            t.exports = function(e, t) {
                var n = (i.Object || {})[e] || Object[e],
                    a = {};
                a[e] = t(n), r(r.S + r.F * o(function() {
                    n(1)
                }), "Object", a)
            }
        }, {
            "./_core": 37,
            "./_export": 44,
            "./_fails": 45
        }],
        79: [function(e, t, n) {
            t.exports = function(e, t) {
                return {
                    enumerable: !(1 & e),
                    configurable: !(2 & e),
                    writable: !(4 & e),
                    value: t
                }
            }
        }, {}],
        80: [function(e, t, n) {
            var r = e("./_hide");
            t.exports = function(e, t, n) {
                for (var i in t) n && e[i] ? e[i] = t[i] : r(e, i, t[i]);
                return e
            }
        }, {
            "./_hide": 49
        }],
        81: [function(e, t, n) {
            t.exports = e("./_hide")
        }, {
            "./_hide": 49
        }],
        82: [function(e, t, n) {
            var r = e("./_is-object"),
                i = e("./_an-object"),
                o = function(e, t) {
                    if (i(e), !r(t) && null !== t) throw TypeError(t + ": can't set as prototype!")
                };
            t.exports = {
                set: Object.setPrototypeOf || ("__proto__" in {} ? function(t, n, r) {
                    try {
                        r = e("./_ctx")(Function.call, e("./_object-gopd").f(Object.prototype, "__proto__").set, 2), r(t, []), n = !(t instanceof Array)
                    } catch (i) {
                        n = !0
                    }
                    return function(e, t) {
                        return o(e, t), n ? e.__proto__ = t : r(e, t), e
                    }
                }({}, !1) : void 0),
                check: o
            }
        }, {
            "./_an-object": 33,
            "./_ctx": 38,
            "./_is-object": 56,
            "./_object-gopd": 70
        }],
        83: [function(e, t, n) {
            "use strict";
            var r = e("./_global"),
                i = e("./_core"),
                o = e("./_object-dp"),
                a = e("./_descriptors"),
                s = e("./_wks")("species");
            t.exports = function(e) {
                var t = "function" == typeof i[e] ? i[e] : r[e];
                a && t && !t[s] && o.f(t, s, {
                    configurable: !0,
                    get: function() {
                        return this
                    }
                })
            }
        }, {
            "./_core": 37,
            "./_descriptors": 40,
            "./_global": 47,
            "./_object-dp": 68,
            "./_wks": 97
        }],
        84: [function(e, t, n) {
            var r = e("./_object-dp").f,
                i = e("./_has"),
                o = e("./_wks")("toStringTag");
            t.exports = function(e, t, n) {
                e && !i(e = n ? e : e.prototype, o) && r(e, o, {
                    configurable: !0,
                    value: t
                })
            }
        }, {
            "./_has": 48,
            "./_object-dp": 68,
            "./_wks": 97
        }],
        85: [function(e, t, n) {
            var r = e("./_shared")("keys"),
                i = e("./_uid");
            t.exports = function(e) {
                return r[e] || (r[e] = i(e))
            }
        }, {
            "./_shared": 86,
            "./_uid": 96
        }],
        86: [function(e, t, n) {
            var r = e("./_global"),
                i = "__core-js_shared__",
                o = r[i] || (r[i] = {});
            t.exports = function(e) {
                return o[e] || (o[e] = {})
            }
        }, {
            "./_global": 47
        }],
        87: [function(e, t, n) {
            var r = e("./_an-object"),
                i = e("./_a-function"),
                o = e("./_wks")("species");
            t.exports = function(e, t) {
                var n, a = r(e).constructor;
                return void 0 === a || void 0 == (n = r(a)[o]) ? t : i(n)
            }
        }, {
            "./_a-function": 30,
            "./_an-object": 33,
            "./_wks": 97
        }],
        88: [function(e, t, n) {
            var r = e("./_to-integer"),
                i = e("./_defined");
            t.exports = function(e) {
                return function(t, n) {
                    var o, a, s = String(i(t)),
                        c = r(n),
                        u = s.length;
                    return 0 > c || c >= u ? e ? "" : void 0 : (o = s.charCodeAt(c), 55296 > o || o > 56319 || c + 1 === u || (a = s.charCodeAt(c + 1)) < 56320 || a > 57343 ? e ? s.charAt(c) : o : e ? s.slice(c, c + 2) : (o - 55296 << 10) + (a - 56320) + 65536)
                }
            }
        }, {
            "./_defined": 39,
            "./_to-integer": 91
        }],
        89: [function(e, t, n) {
            var r, i, o, a = e("./_ctx"),
                s = e("./_invoke"),
                c = e("./_html"),
                u = e("./_dom-create"),
                l = e("./_global"),
                f = l.process,
                h = l.setImmediate,
                d = l.clearImmediate,
                p = l.MessageChannel,
                m = 0,
                g = {},
                b = "onreadystatechange",
                v = function() {
                    var e = +this;
                    if (g.hasOwnProperty(e)) {
                        var t = g[e];
                        delete g[e], t()
                    }
                },
                y = function(e) {
                    v.call(e.data)
                };
            h && d || (h = function(e) {
                for (var t = [], n = 1; arguments.length > n;) t.push(arguments[n++]);
                return g[++m] = function() {
                    s("function" == typeof e ? e : Function(e), t)
                }, r(m), m
            }, d = function(e) {
                delete g[e]
            }, "process" == e("./_cof")(f) ? r = function(e) {
                f.nextTick(a(v, e, 1))
            } : p ? (i = new p, o = i.port2, i.port1.onmessage = y, r = a(o.postMessage, o, 1)) : l.addEventListener && "function" == typeof postMessage && !l.importScripts ? (r = function(e) {
                l.postMessage(e + "", "*")
            }, l.addEventListener("message", y, !1)) : r = b in u("script") ? function(e) {
                c.appendChild(u("script"))[b] = function() {
                    c.removeChild(this), v.call(e)
                }
            } : function(e) {
                setTimeout(a(v, e, 1), 0)
            }), t.exports = {
                set: h,
                clear: d
            }
        }, {
            "./_cof": 36,
            "./_ctx": 38,
            "./_dom-create": 41,
            "./_global": 47,
            "./_html": 50,
            "./_invoke": 52
        }],
        90: [function(e, t, n) {
            var r = e("./_to-integer"),
                i = Math.max,
                o = Math.min;
            t.exports = function(e, t) {
                return e = r(e), 0 > e ? i(e + t, 0) : o(e, t)
            }
        }, {
            "./_to-integer": 91
        }],
        91: [function(e, t, n) {
            var r = Math.ceil,
                i = Math.floor;
            t.exports = function(e) {
                return isNaN(e = +e) ? 0 : (e > 0 ? i : r)(e)
            }
        }, {}],
        92: [function(e, t, n) {
            var r = e("./_iobject"),
                i = e("./_defined");
            t.exports = function(e) {
                return r(i(e))
            }
        }, {
            "./_defined": 39,
            "./_iobject": 53
        }],
        93: [function(e, t, n) {
            var r = e("./_to-integer"),
                i = Math.min;
            t.exports = function(e) {
                return e > 0 ? i(r(e), 9007199254740991) : 0
            }
        }, {
            "./_to-integer": 91
        }],
        94: [function(e, t, n) {
            var r = e("./_defined");
            t.exports = function(e) {
                return Object(r(e))
            }
        }, {
            "./_defined": 39
        }],
        95: [function(e, t, n) {
            var r = e("./_is-object");
            t.exports = function(e, t) {
                if (!r(e)) return e;
                var n, i;
                if (t && "function" == typeof(n = e.toString) && !r(i = n.call(e))) return i;
                if ("function" == typeof(n = e.valueOf) && !r(i = n.call(e))) return i;
                if (!t && "function" == typeof(n = e.toString) && !r(i = n.call(e))) return i;
                throw TypeError("Can't convert object to primitive value")
            }
        }, {
            "./_is-object": 56
        }],
        96: [function(e, t, n) {
            var r = 0,
                i = Math.random();
            t.exports = function(e) {
                return "Symbol(".concat(void 0 === e ? "" : e, ")_", (++r + i).toString(36))
            }
        }, {}],
        97: [function(e, t, n) {
            var r = e("./_shared")("wks"),
                i = e("./_uid"),
                o = e("./_global").Symbol,
                a = "function" == typeof o;
            t.exports = function(e) {
                return r[e] || (r[e] = a && o[e] || (a ? o : i)("Symbol." + e))
            }
        }, {
            "./_global": 47,
            "./_shared": 86,
            "./_uid": 96
        }],
        98: [function(e, t, n) {
            var r = e("./_classof"),
                i = e("./_wks")("iterator"),
                o = e("./_iterators");
            t.exports = e("./_core").getIteratorMethod = function(e) {
                return void 0 != e ? e[i] || e["@@iterator"] || o[r(e)] : void 0
            }
        }, {
            "./_classof": 35,
            "./_core": 37,
            "./_iterators": 62,
            "./_wks": 97
        }],
        99: [function(e, t, n) {
            var r = e("./_an-object"),
                i = e("./core.get-iterator-method");
            t.exports = e("./_core").getIterator = function(e) {
                var t = i(e);
                if ("function" != typeof t) throw TypeError(e + " is not iterable!");
                return r(t.call(e))
            }
        }, {
            "./_an-object": 33,
            "./_core": 37,
            "./core.get-iterator-method": 98
        }],
        100: [function(e, t, n) {
            "use strict";
            var r = e("./_add-to-unscopables"),
                i = e("./_iter-step"),
                o = e("./_iterators"),
                a = e("./_to-iobject");
            t.exports = e("./_iter-define")(Array, "Array", function(e, t) {
                this._t = a(e), this._i = 0, this._k = t
            }, function() {
                var e = this._t,
                    t = this._k,
                    n = this._i++;
                return !e || n >= e.length ? (this._t = void 0, i(1)) : "keys" == t ? i(0, n) : "values" == t ? i(0, e[n]) : i(0, [n, e[n]])
            }, "values"), o.Arguments = o.Array, r("keys"), r("values"), r("entries")
        }, {
            "./_add-to-unscopables": 31,
            "./_iter-define": 59,
            "./_iter-step": 61,
            "./_iterators": 62,
            "./_to-iobject": 92
        }],
        101: [function(e, t, n) {
            var r = e("./_export");
            r(r.S, "Object", {
                create: e("./_object-create")
            })
        }, {
            "./_export": 44,
            "./_object-create": 67
        }],
        102: [function(e, t, n) {
            var r = e("./_export");
            r(r.S + r.F * !e("./_descriptors"), "Object", {
                defineProperty: e("./_object-dp").f
            })
        }, {
            "./_descriptors": 40,
            "./_export": 44,
            "./_object-dp": 68
        }],
        103: [function(e, t, n) {
            var r = e("./_to-object"),
                i = e("./_object-keys");
            e("./_object-sap")("keys", function() {
                return function(e) {
                    return i(r(e))
                }
            })
        }, {
            "./_object-keys": 76,
            "./_object-sap": 78,
            "./_to-object": 94
        }],
        104: [function(e, t, n) {
            var r = e("./_export");
            r(r.S, "Object", {
                setPrototypeOf: e("./_set-proto").set
            })
        }, {
            "./_export": 44,
            "./_set-proto": 82
        }],
        105: [function(e, t, n) {}, {}],
        106: [function(e, t, n) {
            "use strict";
            var r, i, o, a = e("./_library"),
                s = e("./_global"),
                c = e("./_ctx"),
                u = e("./_classof"),
                l = e("./_export"),
                f = e("./_is-object"),
                h = (e("./_an-object"), e("./_a-function")),
                d = e("./_an-instance"),
                p = e("./_for-of"),
                m = (e("./_set-proto").set, e("./_species-constructor")),
                g = e("./_task").set,
                b = e("./_microtask"),
                v = "Promise",
                y = s.TypeError,
                _ = s.process,
                w = s[v],
                k = "process" == u(_),
                x = function() {},
                S = !! function() {
                    try {
                        var t = w.resolve(1),
                            n = (t.constructor = {})[e("./_wks")("species")] = function(e) {
                                e(x, x)
                            };
                        return (k || "function" == typeof PromiseRejectionEvent) && t.then(x) instanceof n
                    } catch (r) {}
                }(),
                T = function(e, t) {
                    return e === t || e === w && t === o
                },
                j = function(e) {
                    var t;
                    return f(e) && "function" == typeof(t = e.then) ? t : !1
                },
                E = function(e) {
                    return T(w, e) ? new C(e) : new i(e)
                },
                C = i = function(e) {
                    var t, n;
                    this.promise = new e(function(e, r) {
                        if (void 0 !== t || void 0 !== n) throw y("Bad Promise constructor");
                        t = e, n = r
                    }), this.resolve = h(t), this.reject = h(n)
                },
                A = function(e) {
                    try {
                        e()
                    } catch (t) {
                        return {
                            error: t
                        }
                    }
                },
                D = function(e, t) {
                    if (!e._n) {
                        e._n = !0;
                        var n = e._c;
                        b(function() {
                            for (var r = e._v, i = 1 == e._s, o = 0, a = function(t) {
                                    var n, o, a = i ? t.ok : t.fail,
                                        s = t.resolve,
                                        c = t.reject;
                                    try {
                                        a ? (i || (2 == e._h && M(e), e._h = 1), n = a === !0 ? r : a(r), n === t.promise ? c(y("Promise-chain cycle")) : (o = j(n)) ? o.call(n, s, c) : s(n)) : c(r)
                                    } catch (u) {
                                        c(u)
                                    }
                                }; n.length > o;) a(n[o++]);
                            e._c = [], e._n = !1, t && !e._h && P(e)
                        })
                    }
                },
                P = function(e) {
                    g.call(s, function() {
                        var t, n, r, i = e._v;
                        if (B(e) && (t = A(function() {
                                k ? _.emit("unhandledRejection", i, e) : (n = s.onunhandledrejection) ? n({
                                    promise: e,
                                    reason: i
                                }) : (r = s.console) && r.error && r.error("Unhandled promise rejection", i)
                            }), e._h = k || B(e) ? 2 : 1), e._a = void 0, t) throw t.error
                    })
                },
                B = function(e) {
                    if (1 == e._h) return !1;
                    for (var t, n = e._a || e._c, r = 0; n.length > r;)
                        if (t = n[r++], t.fail || !B(t.promise)) return !1;
                    return !0
                },
                M = function(e) {
                    g.call(s, function() {
                        var t;
                        k ? _.emit("rejectionHandled", e) : (t = s.onrejectionhandled) && t({
                            promise: e,
                            reason: e._v
                        })
                    })
                },
                I = function(e) {
                    var t = this;
                    t._d || (t._d = !0, t = t._w || t, t._v = e, t._s = 2, t._a || (t._a = t._c.slice()), D(t, !0))
                },
                R = function(e) {
                    var t, n = this;
                    if (!n._d) {
                        n._d = !0, n = n._w || n;
                        try {
                            if (n === e) throw y("Promise can't be resolved itself");
                            (t = j(e)) ? b(function() {
                                var r = {
                                    _w: n,
                                    _d: !1
                                };
                                try {
                                    t.call(e, c(R, r, 1), c(I, r, 1))
                                } catch (i) {
                                    I.call(r, i)
                                }
                            }): (n._v = e, n._s = 1, D(n, !1))
                        } catch (r) {
                            I.call({
                                _w: n,
                                _d: !1
                            }, r)
                        }
                    }
                };
            S || (w = function(e) {
                d(this, w, v, "_h"), h(e), r.call(this);
                try {
                    e(c(R, this, 1), c(I, this, 1))
                } catch (t) {
                    I.call(this, t)
                }
            }, r = function(e) {
                this._c = [], this._a = void 0, this._s = 0, this._d = !1, this._v = void 0, this._h = 0, this._n = !1
            }, r.prototype = e("./_redefine-all")(w.prototype, {
                then: function(e, t) {
                    var n = E(m(this, w));
                    return n.ok = "function" == typeof e ? e : !0, n.fail = "function" == typeof t && t, this._c.push(n), this._a && this._a.push(n), this._s && D(this, !1), n.promise
                },
                "catch": function(e) {
                    return this.then(void 0, e)
                }
            }), C = function() {
                var e = new r;
                this.promise = e, this.resolve = c(R, e, 1), this.reject = c(I, e, 1)
            }), l(l.G + l.W + l.F * !S, {
                Promise: w
            }), e("./_set-to-string-tag")(w, v), e("./_set-species")(v), o = e("./_core")[v], l(l.S + l.F * !S, v, {
                reject: function(e) {
                    var t = E(this),
                        n = t.reject;
                    return n(e), t.promise
                }
            }), l(l.S + l.F * (a || !S), v, {
                resolve: function(e) {
                    if (e instanceof w && T(e.constructor, this)) return e;
                    var t = E(this),
                        n = t.resolve;
                    return n(e), t.promise
                }
            }), l(l.S + l.F * !(S && e("./_iter-detect")(function(e) {
                w.all(e)["catch"](x)
            })), v, {
                all: function(e) {
                    var t = this,
                        n = E(t),
                        r = n.resolve,
                        i = n.reject,
                        o = A(function() {
                            var n = [],
                                o = 0,
                                a = 1;
                            p(e, !1, function(e) {
                                var s = o++,
                                    c = !1;
                                n.push(void 0), a++, t.resolve(e).then(function(e) {
                                    c || (c = !0, n[s] = e, --a || r(n))
                                }, i)
                            }), --a || r(n)
                        });
                    return o && i(o.error), n.promise
                },
                race: function(e) {
                    var t = this,
                        n = E(t),
                        r = n.reject,
                        i = A(function() {
                            p(e, !1, function(e) {
                                t.resolve(e).then(n.resolve, r)
                            })
                        });
                    return i && r(i.error), n.promise
                }
            })
        }, {
            "./_a-function": 30,
            "./_an-instance": 32,
            "./_an-object": 33,
            "./_classof": 35,
            "./_core": 37,
            "./_ctx": 38,
            "./_export": 44,
            "./_for-of": 46,
            "./_global": 47,
            "./_is-object": 56,
            "./_iter-detect": 60,
            "./_library": 64,
            "./_microtask": 66,
            "./_redefine-all": 80,
            "./_set-proto": 82,
            "./_set-species": 83,
            "./_set-to-string-tag": 84,
            "./_species-constructor": 87,
            "./_task": 89,
            "./_wks": 97
        }],
        107: [function(e, t, n) {
            "use strict";
            var r = e("./_string-at")(!0);
            e("./_iter-define")(String, "String", function(e) {
                this._t = String(e), this._i = 0
            }, function() {
                var e, t = this._t,
                    n = this._i;
                return n >= t.length ? {
                    value: void 0,
                    done: !0
                } : (e = r(t, n), this._i += e.length, {
                    value: e,
                    done: !1
                })
            })
        }, {
            "./_iter-define": 59,
            "./_string-at": 88
        }],
        108: [function(e, t, n) {
            "use strict";
            var r = e("./_global"),
                i = e("./_core"),
                o = e("./_has"),
                a = e("./_descriptors"),
                s = e("./_export"),
                c = e("./_redefine"),
                u = e("./_meta").KEY,
                l = e("./_fails"),
                f = e("./_shared"),
                h = e("./_set-to-string-tag"),
                d = e("./_uid"),
                p = e("./_wks"),
                m = e("./_keyof"),
                g = e("./_enum-keys"),
                b = e("./_is-array"),
                v = e("./_an-object"),
                y = e("./_to-iobject"),
                _ = e("./_to-primitive"),
                w = e("./_property-desc"),
                k = e("./_object-create"),
                x = e("./_object-gopn-ext"),
                S = e("./_object-gopd"),
                T = e("./_object-dp"),
                j = S.f,
                E = T.f,
                C = x.f,
                A = r.Symbol,
                D = r.JSON,
                P = D && D.stringify,
                B = !1,
                M = p("_hidden"),
                I = {}.propertyIsEnumerable,
                R = f("symbol-registry"),
                O = f("symbols"),
                L = Object.prototype,
                U = "function" == typeof A,
                N = a && l(function() {
                    return 7 != k(E({}, "a", {
                        get: function() {
                            return E(this, "a", {
                                value: 7
                            }).a
                        }
                    })).a
                }) ? function(e, t, n) {
                    var r = j(L, t);
                    r && delete L[t], E(e, t, n), r && e !== L && E(L, t, r)
                } : E,
                F = function(e) {
                    var t = O[e] = k(A.prototype);
                    return t._k = e, a && B && N(L, e, {
                        configurable: !0,
                        set: function(t) {
                            o(this, M) && o(this[M], e) && (this[M][e] = !1), N(this, e, w(1, t))
                        }
                    }), t
                },
                z = function(e) {
                    return "symbol" == typeof e
                },
                V = function(e, t, n) {
                    return v(e), t = _(t, !0), v(n), o(O, t) ? (n.enumerable ? (o(e, M) && e[M][t] && (e[M][t] = !1), n = k(n, {
                        enumerable: w(0, !1)
                    })) : (o(e, M) || E(e, M, w(1, {})), e[M][t] = !0), N(e, t, n)) : E(e, t, n)
                },
                W = function(e, t) {
                    v(e);
                    for (var n, r = g(t = y(t)), i = 0, o = r.length; o > i;) V(e, n = r[i++], t[n]);
                    return e
                },
                Y = function(e, t) {
                    return void 0 === t ? k(e) : W(k(e), t)
                },
                q = function(e) {
                    var t = I.call(this, e = _(e, !0));
                    return t || !o(this, e) || !o(O, e) || o(this, M) && this[M][e] ? t : !0
                },
                H = function(e, t) {
                    var n = j(e = y(e), t = _(t, !0));
                    return !n || !o(O, t) || o(e, M) && e[M][t] || (n.enumerable = !0), n
                },
                G = function(e) {
                    for (var t, n = C(y(e)), r = [], i = 0; n.length > i;) o(O, t = n[i++]) || t == M || t == u || r.push(t);
                    return r
                },
                J = function(e) {
                    for (var t, n = C(y(e)), r = [], i = 0; n.length > i;) o(O, t = n[i++]) && r.push(O[t]);
                    return r
                },
                X = function(e) {
                    if (void 0 !== e && !z(e)) {
                        for (var t, n, r = [e], i = 1; arguments.length > i;) r.push(arguments[i++]);
                        return t = r[1], "function" == typeof t && (n = t), !n && b(t) || (t = function(e, t) {
                            return n && (t = n.call(this, e, t)), z(t) ? void 0 : t
                        }), r[1] = t, P.apply(D, r)
                    }
                },
                K = l(function() {
                    var e = A();
                    return "[null]" != P([e]) || "{}" != P({
                        a: e
                    }) || "{}" != P(Object(e))
                });
            U || (A = function() {
                if (z(this)) throw TypeError("Symbol is not a constructor");
                return F(d(arguments.length > 0 ? arguments[0] : void 0))
            }, c(A.prototype, "toString", function() {
                return this._k
            }), z = function(e) {
                return e instanceof A
            }, S.f = H, T.f = V, e("./_object-gopn").f = x.f = G, e("./_object-pie").f = q, e("./_object-gops").f = J, a && !e("./_library") && c(L, "propertyIsEnumerable", q, !0)), s(s.G + s.W + s.F * !U, {
                Symbol: A
            });
            for (var $ = "hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables".split(","), Z = 0; $.length > Z;) {
                var Q = $[Z++],
                    ee = i.Symbol,
                    te = p(Q);
                Q in ee || E(ee, Q, {
                    value: U ? te : F(te)
                })
            }
            B = !0, s(s.S + s.F * !U, "Symbol", {
                "for": function(e) {
                    return o(R, e += "") ? R[e] : R[e] = A(e)
                },
                keyFor: function(e) {
                    return m(R, e)
                },
                useSetter: function() {
                    B = !0
                },
                useSimple: function() {
                    B = !1
                }
            }), s(s.S + s.F * !U, "Object", {
                create: Y,
                defineProperty: V,
                defineProperties: W,
                getOwnPropertyDescriptor: H,
                getOwnPropertyNames: G,
                getOwnPropertySymbols: J
            }), D && s(s.S + s.F * (!U || K), "JSON", {
                stringify: X
            }), h(A, "Symbol"), h(Math, "Math", !0), h(r.JSON, "JSON", !0)
        }, {
            "./_an-object": 33,
            "./_core": 37,
            "./_descriptors": 40,
            "./_enum-keys": 43,
            "./_export": 44,
            "./_fails": 45,
            "./_global": 47,
            "./_has": 48,
            "./_is-array": 55,
            "./_keyof": 63,
            "./_library": 64,
            "./_meta": 65,
            "./_object-create": 67,
            "./_object-dp": 68,
            "./_object-gopd": 70,
            "./_object-gopn": 72,
            "./_object-gopn-ext": 71,
            "./_object-gops": 73,
            "./_object-pie": 77,
            "./_property-desc": 79,
            "./_redefine": 81,
            "./_set-to-string-tag": 84,
            "./_shared": 86,
            "./_to-iobject": 92,
            "./_to-primitive": 95,
            "./_uid": 96,
            "./_wks": 97
        }],
        109: [function(e, t, n) {
            e("./es6.array.iterator");
            for (var r = e("./_global"), i = e("./_hide"), o = e("./_iterators"), a = e("./_wks")("toStringTag"), s = ["NodeList", "DOMTokenList", "MediaList", "StyleSheetList", "CSSRuleList"], c = 0; 5 > c; c++) {
                var u = s[c],
                    l = r[u],
                    f = l && l.prototype;
                f && !f[a] && i(f, a, u), o[u] = o.Array
            }
        }, {
            "./_global": 47,
            "./_hide": 49,
            "./_iterators": 62,
            "./_wks": 97,
            "./es6.array.iterator": 100
        }],
        110: [function(e, t, n) {
            (function(n) {
                var r = "object" == typeof n ? n : "object" == typeof window ? window : "object" == typeof self ? self : this,
                    i = r.regeneratorRuntime && Object.getOwnPropertyNames(r).indexOf("regeneratorRuntime") >= 0,
                    o = i && r.regeneratorRuntime;
                if (r.regeneratorRuntime = void 0, t.exports = e("./runtime"), i) r.regeneratorRuntime = o;
                else try {
                    delete r.regeneratorRuntime
                } catch (a) {
                    r.regeneratorRuntime = void 0
                }
                t.exports = {
                    "default": t.exports,
                    __esModule: !0
                }
            }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {
            "./runtime": 111
        }],
        111: [function(e, t, n) {
            (function(n, r) {
                "use strict";

                function i(e) {
                    return e && e.__esModule ? e : {
                        "default": e
                    }
                }
                var o = e("babel-runtime/core-js/promise"),
                    a = i(o),
                    s = e("babel-runtime/core-js/object/set-prototype-of"),
                    c = i(s),
                    u = e("babel-runtime/core-js/object/create"),
                    l = i(u),
                    f = e("babel-runtime/helpers/typeof"),
                    h = i(f),
                    d = e("babel-runtime/core-js/symbol/iterator"),
                    p = i(d),
                    m = e("babel-runtime/core-js/symbol"),
                    g = i(m);
                ! function(e) {
                    function r(e, t, n, r) {
                        var i = (0, l["default"])((t || o).prototype),
                            a = new _(r || []);
                        return i._invoke = b(e, n, a), i
                    }

                    function i(e, t, n) {
                        try {
                            return {
                                type: "normal",
                                arg: e.call(t, n)
                            }
                        } catch (r) {
                            return {
                                type: "throw",
                                arg: r
                            }
                        }
                    }

                    function o() {}

                    function s() {}

                    function u() {}

                    function f(e) {
                        ["next", "throw", "return"].forEach(function(t) {
                            e[t] = function(e) {
                                return this._invoke(t, e)
                            }
                        })
                    }

                    function d(e) {
                        this.arg = e
                    }

                    function m(e) {
                        function t(t, n) {
                            var r = e[t](n),
                                i = r.value;
                            return i instanceof d ? a["default"].resolve(i.arg).then(o, s) : a["default"].resolve(i).then(function(e) {
                                return r.value = e, r
                            })
                        }

                        function r(e, n) {
                            function r() {
                                return t(e, n)
                            }
                            return i = i ? i.then(r, r) : new a["default"](function(e) {
                                e(r())
                            })
                        }
                        "object" === ("undefined" == typeof n ? "undefined" : (0, h["default"])(n)) && n.domain && (t = n.domain.bind(t));
                        var i, o = t.bind(e, "next"),
                            s = t.bind(e, "throw");
                        t.bind(e, "return");
                        this._invoke = r
                    }

                    function b(e, t, n) {
                        var r = C;
                        return function(o, a) {
                            if (r === D) throw new Error("Generator is already running");
                            if (r === P) {
                                if ("throw" === o) throw a;
                                return k()
                            }
                            for (;;) {
                                var s = n.delegate;
                                if (s) {
                                    if ("return" === o || "throw" === o && s.iterator[o] === x) {
                                        n.delegate = null;
                                        var c = s.iterator["return"];
                                        if (c) {
                                            var u = i(c, s.iterator, a);
                                            if ("throw" === u.type) {
                                                o = "throw", a = u.arg;
                                                continue
                                            }
                                        }
                                        if ("return" === o) continue
                                    }
                                    var u = i(s.iterator[o], s.iterator, a);
                                    if ("throw" === u.type) {
                                        n.delegate = null, o = "throw", a = u.arg;
                                        continue
                                    }
                                    o = "next", a = x;
                                    var l = u.arg;
                                    if (!l.done) return r = A, l;
                                    n[s.resultName] = l.value, n.next = s.nextLoc, n.delegate = null
                                }
                                if ("next" === o) n._sent = a, r === A ? n.sent = a : n.sent = x;
                                else if ("throw" === o) {
                                    if (r === C) throw r = P, a;
                                    n.dispatchException(a) && (o = "next", a = x)
                                } else "return" === o && n.abrupt("return", a);
                                r = D;
                                var u = i(e, t, n);
                                if ("normal" === u.type) {
                                    r = n.done ? P : A;
                                    var l = {
                                        value: u.arg,
                                        done: n.done
                                    };
                                    if (u.arg !== B) return l;
                                    n.delegate && "next" === o && (a = x)
                                } else "throw" === u.type && (r = P, o = "throw", a = u.arg)
                            }
                        }
                    }

                    function v(e) {
                        var t = {
                            tryLoc: e[0]
                        };
                        1 in e && (t.catchLoc = e[1]), 2 in e && (t.finallyLoc = e[2], t.afterLoc = e[3]), this.tryEntries.push(t)
                    }

                    function y(e) {
                        var t = e.completion || {};
                        t.type = "normal", delete t.arg, e.completion = t
                    }

                    function _(e) {
                        this.tryEntries = [{
                            tryLoc: "root"
                        }], e.forEach(v, this), this.reset(!0)
                    }

                    function w(e) {
                        if (e) {
                            var t = e[T];
                            if (t) return t.call(e);
                            if ("function" == typeof e.next) return e;
                            if (!isNaN(e.length)) {
                                var n = -1,
                                    r = function i() {
                                        for (; ++n < e.length;)
                                            if (S.call(e, n)) return i.value = e[n], i.done = !1, i;
                                        return i.value = x, i.done = !0, i
                                    };
                                return r.next = r
                            }
                        }
                        return {
                            next: k
                        }
                    }

                    function k() {
                        return {
                            value: x,
                            done: !0
                        }
                    }
                    var x, S = Object.prototype.hasOwnProperty,
                        T = "function" == typeof g["default"] && p["default"] || "@@iterator",
                        j = "object" === ("undefined" == typeof t ? "undefined" : (0, h["default"])(t)),
                        E = e.regeneratorRuntime;
                    if (E) return void(j && (t.exports = E));
                    E = e.regeneratorRuntime = j ? t.exports : {}, E.wrap = r;
                    var C = "suspendedStart",
                        A = "suspendedYield",
                        D = "executing",
                        P = "completed",
                        B = {},
                        M = u.prototype = o.prototype;
                    s.prototype = M.constructor = u, u.constructor = s, s.displayName = "GeneratorFunction", E.isGeneratorFunction = function(e) {
                        var t = "function" == typeof e && e.constructor;
                        return t ? t === s || "GeneratorFunction" === (t.displayName || t.name) : !1
                    }, E.mark = function(e) {
                        return c["default"] ? (0, c["default"])(e, u) : e.__proto__ = u, e.prototype = (0, l["default"])(M), e
                    }, E.awrap = function(e) {
                        return new d(e)
                    }, f(m.prototype), E.async = function(e, t, n, i) {
                        var o = new m(r(e, t, n, i));
                        return E.isGeneratorFunction(t) ? o : o.next().then(function(e) {
                            return e.done ? e.value : o.next()
                        })
                    }, f(M), M[T] = function() {
                        return this
                    }, M.toString = function() {
                        return "[object Generator]"
                    }, E.keys = function(e) {
                        var t = [];
                        for (var n in e) t.push(n);
                        return t.reverse(),
                            function r() {
                                for (; t.length;) {
                                    var n = t.pop();
                                    if (n in e) return r.value = n, r.done = !1, r
                                }
                                return r.done = !0, r
                            }
                    }, E.values = w, _.prototype = {
                        constructor: _,
                        reset: function(e) {
                            if (this.prev = 0, this.next = 0, this.sent = x, this.done = !1, this.delegate = null, this.tryEntries.forEach(y), !e)
                                for (var t in this) "t" === t.charAt(0) && S.call(this, t) && !isNaN(+t.slice(1)) && (this[t] = x)
                        },
                        stop: function() {
                            this.done = !0;
                            var e = this.tryEntries[0],
                                t = e.completion;
                            if ("throw" === t.type) throw t.arg;
                            return this.rval
                        },
                        dispatchException: function(e) {
                            function t(t, r) {
                                return o.type = "throw", o.arg = e, n.next = t, !!r
                            }
                            if (this.done) throw e;
                            for (var n = this, r = this.tryEntries.length - 1; r >= 0; --r) {
                                var i = this.tryEntries[r],
                                    o = i.completion;
                                if ("root" === i.tryLoc) return t("end");
                                if (i.tryLoc <= this.prev) {
                                    var a = S.call(i, "catchLoc"),
                                        s = S.call(i, "finallyLoc");
                                    if (a && s) {
                                        if (this.prev < i.catchLoc) return t(i.catchLoc, !0);
                                        if (this.prev < i.finallyLoc) return t(i.finallyLoc)
                                    } else if (a) {
                                        if (this.prev < i.catchLoc) return t(i.catchLoc, !0)
                                    } else {
                                        if (!s) throw new Error("try statement without catch or finally");
                                        if (this.prev < i.finallyLoc) return t(i.finallyLoc)
                                    }
                                }
                            }
                        },
                        abrupt: function(e, t) {
                            for (var n = this.tryEntries.length - 1; n >= 0; --n) {
                                var r = this.tryEntries[n];
                                if (r.tryLoc <= this.prev && S.call(r, "finallyLoc") && this.prev < r.finallyLoc) {
                                    var i = r;
                                    break
                                }
                            }
                            i && ("break" === e || "continue" === e) && i.tryLoc <= t && t <= i.finallyLoc && (i = null);
                            var o = i ? i.completion : {};
                            return o.type = e, o.arg = t, i ? this.next = i.finallyLoc : this.complete(o), B
                        },
                        complete: function(e, t) {
                            if ("throw" === e.type) throw e.arg;
                            "break" === e.type || "continue" === e.type ? this.next = e.arg : "return" === e.type ? (this.rval = e.arg, this.next = "end") : "normal" === e.type && t && (this.next = t)
                        },
                        finish: function(e) {
                            for (var t = this.tryEntries.length - 1; t >= 0; --t) {
                                var n = this.tryEntries[t];
                                if (n.finallyLoc === e) return this.complete(n.completion, n.afterLoc), y(n), B
                            }
                        },
                        "catch": function(e) {
                            for (var t = this.tryEntries.length - 1; t >= 0; --t) {
                                var n = this.tryEntries[t];
                                if (n.tryLoc === e) {
                                    var r = n.completion;
                                    if ("throw" === r.type) {
                                        var i = r.arg;
                                        y(n)
                                    }
                                    return i
                                }
                            }
                            throw new Error("illegal catch attempt")
                        },
                        delegateYield: function(e, t, n) {
                            return this.delegate = {
                                iterator: w(e),
                                resultName: t,
                                nextLoc: n
                            }, B
                        }
                    }
                }("object" === ("undefined" == typeof r ? "undefined" : (0, h["default"])(r)) ? r : "object" === ("undefined" == typeof window ? "undefined" : (0, h["default"])(window)) ? window : "object" === ("undefined" == typeof self ? "undefined" : (0, h["default"])(self)) ? self : void 0)
            }).call(this, e("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {
            _process: 121,
            "babel-runtime/core-js/object/create": 11,
            "babel-runtime/core-js/object/set-prototype-of": 14,
            "babel-runtime/core-js/promise": 15,
            "babel-runtime/core-js/symbol": 16,
            "babel-runtime/core-js/symbol/iterator": 17,
            "babel-runtime/helpers/typeof": 21
        }],
        112: [function(e, t, n) {
            arguments[4][105][0].apply(n, arguments)
        }, {
            dup: 105
        }],
        113: [function(e, t, n) {
            (function(t) {
                "use strict";

                function r() {
                    try {
                        var e = new Uint8Array(1);
                        return e.foo = function() {
                            return 42
                        }, 42 === e.foo() && "function" == typeof e.subarray && 0 === e.subarray(1, 1).byteLength
                    } catch (t) {
                        return !1
                    }
                }

                function i() {
                    return o.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823
                }

                function o(e) {
                    return this instanceof o ? (o.TYPED_ARRAY_SUPPORT || (this.length = 0, this.parent = void 0), "number" == typeof e ? a(this, e) : "string" == typeof e ? s(this, e, arguments.length > 1 ? arguments[1] : "utf8") : c(this, e)) : arguments.length > 1 ? new o(e, arguments[1]) : new o(e)
                }

                function a(e, t) {
                    if (e = m(e, 0 > t ? 0 : 0 | g(t)), !o.TYPED_ARRAY_SUPPORT)
                        for (var n = 0; t > n; n++) e[n] = 0;
                    return e
                }

                function s(e, t, n) {
                    "string" == typeof n && "" !== n || (n = "utf8");
                    var r = 0 | v(t, n);
                    return e = m(e, r), e.write(t, n), e
                }

                function c(e, t) {
                    if (o.isBuffer(t)) return u(e, t);
                    if (K(t)) return l(e, t);
                    if (null == t) throw new TypeError("must start with number, buffer, array or string");
                    if ("undefined" != typeof ArrayBuffer) {
                        if (t.buffer instanceof ArrayBuffer) return f(e, t);
                        if (t instanceof ArrayBuffer) return h(e, t)
                    }
                    return t.length ? d(e, t) : p(e, t)
                }

                function u(e, t) {
                    var n = 0 | g(t.length);
                    return e = m(e, n), t.copy(e, 0, 0, n), e
                }

                function l(e, t) {
                    var n = 0 | g(t.length);
                    e = m(e, n);
                    for (var r = 0; n > r; r += 1) e[r] = 255 & t[r];
                    return e
                }

                function f(e, t) {
                    var n = 0 | g(t.length);
                    e = m(e, n);
                    for (var r = 0; n > r; r += 1) e[r] = 255 & t[r];
                    return e
                }

                function h(e, t) {
                    return t.byteLength, o.TYPED_ARRAY_SUPPORT ? (e = new Uint8Array(t), e.__proto__ = o.prototype) : e = f(e, new Uint8Array(t)), e
                }

                function d(e, t) {
                    var n = 0 | g(t.length);
                    e = m(e, n);
                    for (var r = 0; n > r; r += 1) e[r] = 255 & t[r];
                    return e
                }

                function p(e, t) {
                    var n, r = 0;
                    "Buffer" === t.type && K(t.data) && (n = t.data, r = 0 | g(n.length)), e = m(e, r);
                    for (var i = 0; r > i; i += 1) e[i] = 255 & n[i];
                    return e
                }

                function m(e, t) {
                    o.TYPED_ARRAY_SUPPORT ? (e = new Uint8Array(t), e.__proto__ = o.prototype) : e.length = t;
                    var n = 0 !== t && t <= o.poolSize >>> 1;
                    return n && (e.parent = $), e
                }

                function g(e) {
                    if (e >= i()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + i().toString(16) + " bytes");
                    return 0 | e
                }

                function b(e, t) {
                    if (!(this instanceof b)) return new b(e, t);
                    var n = new o(e, t);
                    return delete n.parent, n
                }

                function v(e, t) {
                    "string" != typeof e && (e = "" + e);
                    var n = e.length;
                    if (0 === n) return 0;
                    for (var r = !1;;) switch (t) {
                        case "ascii":
                        case "binary":
                        case "raw":
                        case "raws":
                            return n;
                        case "utf8":
                        case "utf-8":
                            return W(e).length;
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return 2 * n;
                        case "hex":
                            return n >>> 1;
                        case "base64":
                            return H(e).length;
                        default:
                            if (r) return W(e).length;
                            t = ("" + t).toLowerCase(), r = !0
                    }
                }

                function y(e, t, n) {
                    var r = !1;
                    if (t = 0 | t, n = void 0 === n || n === 1 / 0 ? this.length : 0 | n, e || (e = "utf8"), 0 > t && (t = 0), n > this.length && (n = this.length), t >= n) return "";
                    for (;;) switch (e) {
                        case "hex":
                            return P(this, t, n);
                        case "utf8":
                        case "utf-8":
                            return E(this, t, n);
                        case "ascii":
                            return A(this, t, n);
                        case "binary":
                            return D(this, t, n);
                        case "base64":
                            return j(this, t, n);
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return B(this, t, n);
                        default:
                            if (r) throw new TypeError("Unknown encoding: " + e);
                            e = (e + "").toLowerCase(), r = !0
                    }
                }

                function _(e, t, n, r) {
                    n = Number(n) || 0;
                    var i = e.length - n;
                    r ? (r = Number(r), r > i && (r = i)) : r = i;
                    var o = t.length;
                    if (o % 2 !== 0) throw new Error("Invalid hex string");
                    r > o / 2 && (r = o / 2);
                    for (var a = 0; r > a; a++) {
                        var s = parseInt(t.substr(2 * a, 2), 16);
                        if (isNaN(s)) throw new Error("Invalid hex string");
                        e[n + a] = s
                    }
                    return a
                }

                function w(e, t, n, r) {
                    return G(W(t, e.length - n), e, n, r)
                }

                function k(e, t, n, r) {
                    return G(Y(t), e, n, r)
                }

                function x(e, t, n, r) {
                    return k(e, t, n, r)
                }

                function S(e, t, n, r) {
                    return G(H(t), e, n, r)
                }

                function T(e, t, n, r) {
                    return G(q(t, e.length - n), e, n, r)
                }

                function j(e, t, n) {
                    return 0 === t && n === e.length ? J.fromByteArray(e) : J.fromByteArray(e.slice(t, n))
                }

                function E(e, t, n) {
                    n = Math.min(e.length, n);
                    for (var r = [], i = t; n > i;) {
                        var o = e[i],
                            a = null,
                            s = o > 239 ? 4 : o > 223 ? 3 : o > 191 ? 2 : 1;
                        if (n >= i + s) {
                            var c, u, l, f;
                            switch (s) {
                                case 1:
                                    128 > o && (a = o);
                                    break;
                                case 2:
                                    c = e[i + 1], 128 === (192 & c) && (f = (31 & o) << 6 | 63 & c, f > 127 && (a = f));
                                    break;
                                case 3:
                                    c = e[i + 1], u = e[i + 2], 128 === (192 & c) && 128 === (192 & u) && (f = (15 & o) << 12 | (63 & c) << 6 | 63 & u, f > 2047 && (55296 > f || f > 57343) && (a = f));
                                    break;
                                case 4:
                                    c = e[i + 1], u = e[i + 2], l = e[i + 3], 128 === (192 & c) && 128 === (192 & u) && 128 === (192 & l) && (f = (15 & o) << 18 | (63 & c) << 12 | (63 & u) << 6 | 63 & l, f > 65535 && 1114112 > f && (a = f))
                            }
                        }
                        null === a ? (a = 65533, s = 1) : a > 65535 && (a -= 65536, r.push(a >>> 10 & 1023 | 55296), a = 56320 | 1023 & a), r.push(a), i += s
                    }
                    return C(r)
                }

                function C(e) {
                    var t = e.length;
                    if (Z >= t) return String.fromCharCode.apply(String, e);
                    for (var n = "", r = 0; t > r;) n += String.fromCharCode.apply(String, e.slice(r, r += Z));
                    return n
                }

                function A(e, t, n) {
                    var r = "";
                    n = Math.min(e.length, n);
                    for (var i = t; n > i; i++) r += String.fromCharCode(127 & e[i]);
                    return r
                }

                function D(e, t, n) {
                    var r = "";
                    n = Math.min(e.length, n);
                    for (var i = t; n > i; i++) r += String.fromCharCode(e[i]);
                    return r
                }

                function P(e, t, n) {
                    var r = e.length;
                    (!t || 0 > t) && (t = 0), (!n || 0 > n || n > r) && (n = r);
                    for (var i = "", o = t; n > o; o++) i += V(e[o]);
                    return i
                }

                function B(e, t, n) {
                    for (var r = e.slice(t, n), i = "", o = 0; o < r.length; o += 2) i += String.fromCharCode(r[o] + 256 * r[o + 1]);
                    return i
                }

                function M(e, t, n) {
                    if (e % 1 !== 0 || 0 > e) throw new RangeError("offset is not uint");
                    if (e + t > n) throw new RangeError("Trying to access beyond buffer length")
                }

                function I(e, t, n, r, i, a) {
                    if (!o.isBuffer(e)) throw new TypeError("buffer must be a Buffer instance");
                    if (t > i || a > t) throw new RangeError("value is out of bounds");
                    if (n + r > e.length) throw new RangeError("index out of range")
                }

                function R(e, t, n, r) {
                    0 > t && (t = 65535 + t + 1);
                    for (var i = 0, o = Math.min(e.length - n, 2); o > i; i++) e[n + i] = (t & 255 << 8 * (r ? i : 1 - i)) >>> 8 * (r ? i : 1 - i)
                }

                function O(e, t, n, r) {
                    0 > t && (t = 4294967295 + t + 1);
                    for (var i = 0, o = Math.min(e.length - n, 4); o > i; i++) e[n + i] = t >>> 8 * (r ? i : 3 - i) & 255
                }

                function L(e, t, n, r, i, o) {
                    if (n + r > e.length) throw new RangeError("index out of range");
                    if (0 > n) throw new RangeError("index out of range")
                }

                function U(e, t, n, r, i) {
                    return i || L(e, t, n, 4, 3.4028234663852886e38, -3.4028234663852886e38), X.write(e, t, n, r, 23, 4), n + 4
                }

                function N(e, t, n, r, i) {
                    return i || L(e, t, n, 8, 1.7976931348623157e308, -1.7976931348623157e308), X.write(e, t, n, r, 52, 8), n + 8
                }

                function F(e) {
                    if (e = z(e).replace(Q, ""), e.length < 2) return "";
                    for (; e.length % 4 !== 0;) e += "=";
                    return e
                }

                function z(e) {
                    return e.trim ? e.trim() : e.replace(/^\s+|\s+$/g, "")
                }

                function V(e) {
                    return 16 > e ? "0" + e.toString(16) : e.toString(16)
                }

                function W(e, t) {
                    t = t || 1 / 0;
                    for (var n, r = e.length, i = null, o = [], a = 0; r > a; a++) {
                        if (n = e.charCodeAt(a), n > 55295 && 57344 > n) {
                            if (!i) {
                                if (n > 56319) {
                                    (t -= 3) > -1 && o.push(239, 191, 189);
                                    continue
                                }
                                if (a + 1 === r) {
                                    (t -= 3) > -1 && o.push(239, 191, 189);
                                    continue
                                }
                                i = n;
                                continue
                            }
                            if (56320 > n) {
                                (t -= 3) > -1 && o.push(239, 191, 189), i = n;
                                continue
                            }
                            n = (i - 55296 << 10 | n - 56320) + 65536
                        } else i && (t -= 3) > -1 && o.push(239, 191, 189);
                        if (i = null, 128 > n) {
                            if ((t -= 1) < 0) break;
                            o.push(n)
                        } else if (2048 > n) {
                            if ((t -= 2) < 0) break;
                            o.push(n >> 6 | 192, 63 & n | 128)
                        } else if (65536 > n) {
                            if ((t -= 3) < 0) break;
                            o.push(n >> 12 | 224, n >> 6 & 63 | 128, 63 & n | 128)
                        } else {
                            if (!(1114112 > n)) throw new Error("Invalid code point");
                            if ((t -= 4) < 0) break;
                            o.push(n >> 18 | 240, n >> 12 & 63 | 128, n >> 6 & 63 | 128, 63 & n | 128)
                        }
                    }
                    return o
                }

                function Y(e) {
                    for (var t = [], n = 0; n < e.length; n++) t.push(255 & e.charCodeAt(n));
                    return t
                }

                function q(e, t) {
                    for (var n, r, i, o = [], a = 0; a < e.length && !((t -= 2) < 0); a++) n = e.charCodeAt(a), r = n >> 8, i = n % 256, o.push(i), o.push(r);
                    return o
                }

                function H(e) {
                    return J.toByteArray(F(e))
                }

                function G(e, t, n, r) {
                    for (var i = 0; r > i && !(i + n >= t.length || i >= e.length); i++) t[i + n] = e[i];
                    return i
                }
                var J = e("base64-js"),
                    X = e("ieee754"),
                    K = e("isarray");
                n.Buffer = o, n.SlowBuffer = b, n.INSPECT_MAX_BYTES = 50, o.poolSize = 8192;
                var $ = {};
                o.TYPED_ARRAY_SUPPORT = void 0 !== t.TYPED_ARRAY_SUPPORT ? t.TYPED_ARRAY_SUPPORT : r(), o._augment = function(e) {
                    return e.__proto__ = o.prototype, e
                }, o.TYPED_ARRAY_SUPPORT ? (o.prototype.__proto__ = Uint8Array.prototype, o.__proto__ = Uint8Array, "undefined" != typeof Symbol && Symbol.species && o[Symbol.species] === o && Object.defineProperty(o, Symbol.species, {
                    value: null,
                    configurable: !0
                })) : (o.prototype.length = void 0, o.prototype.parent = void 0), o.isBuffer = function(e) {
                    return !(null == e || !e._isBuffer)
                }, o.compare = function(e, t) {
                    if (!o.isBuffer(e) || !o.isBuffer(t)) throw new TypeError("Arguments must be Buffers");
                    if (e === t) return 0;
                    for (var n = e.length, r = t.length, i = 0, a = Math.min(n, r); a > i && e[i] === t[i];) ++i;
                    return i !== a && (n = e[i], r = t[i]), r > n ? -1 : n > r ? 1 : 0
                }, o.isEncoding = function(e) {
                    switch (String(e).toLowerCase()) {
                        case "hex":
                        case "utf8":
                        case "utf-8":
                        case "ascii":
                        case "binary":
                        case "base64":
                        case "raw":
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return !0;
                        default:
                            return !1
                    }
                }, o.concat = function(e, t) {
                    if (!K(e)) throw new TypeError("list argument must be an Array of Buffers.");
                    if (0 === e.length) return new o(0);
                    var n;
                    if (void 0 === t)
                        for (t = 0, n = 0; n < e.length; n++) t += e[n].length;
                    var r = new o(t),
                        i = 0;
                    for (n = 0; n < e.length; n++) {
                        var a = e[n];
                        a.copy(r, i), i += a.length
                    }
                    return r
                }, o.byteLength = v, o.prototype._isBuffer = !0, o.prototype.toString = function() {
                    var e = 0 | this.length;
                    return 0 === e ? "" : 0 === arguments.length ? E(this, 0, e) : y.apply(this, arguments)
                }, o.prototype.equals = function(e) {
                    if (!o.isBuffer(e)) throw new TypeError("Argument must be a Buffer");
                    return this === e ? !0 : 0 === o.compare(this, e)
                }, o.prototype.inspect = function() {
                    var e = "",
                        t = n.INSPECT_MAX_BYTES;
                    return this.length > 0 && (e = this.toString("hex", 0, t).match(/.{2}/g).join(" "), this.length > t && (e += " ... ")), "<Buffer " + e + ">"
                }, o.prototype.compare = function(e) {
                    if (!o.isBuffer(e)) throw new TypeError("Argument must be a Buffer");
                    return this === e ? 0 : o.compare(this, e)
                }, o.prototype.indexOf = function(e, t) {
                    function n(e, t, n) {
                        for (var r = -1, i = 0; n + i < e.length; i++)
                            if (e[n + i] === t[-1 === r ? 0 : i - r]) {
                                if (-1 === r && (r = i), i - r + 1 === t.length) return n + r
                            } else r = -1;
                        return -1
                    }
                    if (t > 2147483647 ? t = 2147483647 : -2147483648 > t && (t = -2147483648), t >>= 0, 0 === this.length) return -1;
                    if (t >= this.length) return -1;
                    if (0 > t && (t = Math.max(this.length + t, 0)), "string" == typeof e) return 0 === e.length ? -1 : String.prototype.indexOf.call(this, e, t);
                    if (o.isBuffer(e)) return n(this, e, t);
                    if ("number" == typeof e) return o.TYPED_ARRAY_SUPPORT && "function" === Uint8Array.prototype.indexOf ? Uint8Array.prototype.indexOf.call(this, e, t) : n(this, [e], t);
                    throw new TypeError("val must be string, number or Buffer")
                }, o.prototype.write = function(e, t, n, r) {
                    if (void 0 === t) r = "utf8", n = this.length, t = 0;
                    else if (void 0 === n && "string" == typeof t) r = t, n = this.length, t = 0;
                    else if (isFinite(t)) t = 0 | t, isFinite(n) ? (n = 0 | n, void 0 === r && (r = "utf8")) : (r = n, n = void 0);
                    else {
                        var i = r;
                        r = t, t = 0 | n, n = i
                    }
                    var o = this.length - t;
                    if ((void 0 === n || n > o) && (n = o), e.length > 0 && (0 > n || 0 > t) || t > this.length) throw new RangeError("attempt to write outside buffer bounds");
                    r || (r = "utf8");
                    for (var a = !1;;) switch (r) {
                        case "hex":
                            return _(this, e, t, n);
                        case "utf8":
                        case "utf-8":
                            return w(this, e, t, n);
                        case "ascii":
                            return k(this, e, t, n);
                        case "binary":
                            return x(this, e, t, n);
                        case "base64":
                            return S(this, e, t, n);
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return T(this, e, t, n);
                        default:
                            if (a) throw new TypeError("Unknown encoding: " + r);
                            r = ("" + r).toLowerCase(), a = !0
                    }
                }, o.prototype.toJSON = function() {
                    return {
                        type: "Buffer",
                        data: Array.prototype.slice.call(this._arr || this, 0)
                    }
                };
                var Z = 4096;
                o.prototype.slice = function(e, t) {
                    var n = this.length;
                    e = ~~e, t = void 0 === t ? n : ~~t, 0 > e ? (e += n, 0 > e && (e = 0)) : e > n && (e = n), 0 > t ? (t += n, 0 > t && (t = 0)) : t > n && (t = n), e > t && (t = e);
                    var r;
                    if (o.TYPED_ARRAY_SUPPORT) r = this.subarray(e, t), r.__proto__ = o.prototype;
                    else {
                        var i = t - e;
                        r = new o(i, void 0);
                        for (var a = 0; i > a; a++) r[a] = this[a + e]
                    }
                    return r.length && (r.parent = this.parent || this), r
                }, o.prototype.readUIntLE = function(e, t, n) {
                    e = 0 | e, t = 0 | t, n || M(e, t, this.length);
                    for (var r = this[e], i = 1, o = 0; ++o < t && (i *= 256);) r += this[e + o] * i;
                    return r
                }, o.prototype.readUIntBE = function(e, t, n) {
                    e = 0 | e, t = 0 | t, n || M(e, t, this.length);
                    for (var r = this[e + --t], i = 1; t > 0 && (i *= 256);) r += this[e + --t] * i;
                    return r
                }, o.prototype.readUInt8 = function(e, t) {
                    return t || M(e, 1, this.length), this[e]
                }, o.prototype.readUInt16LE = function(e, t) {
                    return t || M(e, 2, this.length), this[e] | this[e + 1] << 8
                }, o.prototype.readUInt16BE = function(e, t) {
                    return t || M(e, 2, this.length), this[e] << 8 | this[e + 1]
                }, o.prototype.readUInt32LE = function(e, t) {
                    return t || M(e, 4, this.length), (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + 16777216 * this[e + 3]
                }, o.prototype.readUInt32BE = function(e, t) {
                    return t || M(e, 4, this.length), 16777216 * this[e] + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3])
                }, o.prototype.readIntLE = function(e, t, n) {
                    e = 0 | e, t = 0 | t, n || M(e, t, this.length);
                    for (var r = this[e], i = 1, o = 0; ++o < t && (i *= 256);) r += this[e + o] * i;
                    return i *= 128, r >= i && (r -= Math.pow(2, 8 * t)), r
                }, o.prototype.readIntBE = function(e, t, n) {
                    e = 0 | e, t = 0 | t, n || M(e, t, this.length);
                    for (var r = t, i = 1, o = this[e + --r]; r > 0 && (i *= 256);) o += this[e + --r] * i;
                    return i *= 128, o >= i && (o -= Math.pow(2, 8 * t)), o
                }, o.prototype.readInt8 = function(e, t) {
                    return t || M(e, 1, this.length), 128 & this[e] ? -1 * (255 - this[e] + 1) : this[e]
                }, o.prototype.readInt16LE = function(e, t) {
                    t || M(e, 2, this.length);
                    var n = this[e] | this[e + 1] << 8;
                    return 32768 & n ? 4294901760 | n : n
                }, o.prototype.readInt16BE = function(e, t) {
                    t || M(e, 2, this.length);
                    var n = this[e + 1] | this[e] << 8;
                    return 32768 & n ? 4294901760 | n : n
                }, o.prototype.readInt32LE = function(e, t) {
                    return t || M(e, 4, this.length), this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24
                }, o.prototype.readInt32BE = function(e, t) {
                    return t || M(e, 4, this.length), this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]
                }, o.prototype.readFloatLE = function(e, t) {
                    return t || M(e, 4, this.length), X.read(this, e, !0, 23, 4)
                }, o.prototype.readFloatBE = function(e, t) {
                    return t || M(e, 4, this.length), X.read(this, e, !1, 23, 4)
                }, o.prototype.readDoubleLE = function(e, t) {
                    return t || M(e, 8, this.length), X.read(this, e, !0, 52, 8)
                }, o.prototype.readDoubleBE = function(e, t) {
                    return t || M(e, 8, this.length), X.read(this, e, !1, 52, 8)
                }, o.prototype.writeUIntLE = function(e, t, n, r) {
                    e = +e, t = 0 | t, n = 0 | n, r || I(this, e, t, n, Math.pow(2, 8 * n), 0);
                    var i = 1,
                        o = 0;
                    for (this[t] = 255 & e; ++o < n && (i *= 256);) this[t + o] = e / i & 255;
                    return t + n
                }, o.prototype.writeUIntBE = function(e, t, n, r) {
                    e = +e, t = 0 | t, n = 0 | n, r || I(this, e, t, n, Math.pow(2, 8 * n), 0);
                    var i = n - 1,
                        o = 1;
                    for (this[t + i] = 255 & e; --i >= 0 && (o *= 256);) this[t + i] = e / o & 255;
                    return t + n
                }, o.prototype.writeUInt8 = function(e, t, n) {
                    return e = +e, t = 0 | t, n || I(this, e, t, 1, 255, 0), o.TYPED_ARRAY_SUPPORT || (e = Math.floor(e)), this[t] = 255 & e, t + 1
                }, o.prototype.writeUInt16LE = function(e, t, n) {
                    return e = +e, t = 0 | t, n || I(this, e, t, 2, 65535, 0), o.TYPED_ARRAY_SUPPORT ? (this[t] = 255 & e, this[t + 1] = e >>> 8) : R(this, e, t, !0), t + 2
                }, o.prototype.writeUInt16BE = function(e, t, n) {
                    return e = +e, t = 0 | t, n || I(this, e, t, 2, 65535, 0), o.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 8, this[t + 1] = 255 & e) : R(this, e, t, !1), t + 2
                }, o.prototype.writeUInt32LE = function(e, t, n) {
                    return e = +e, t = 0 | t, n || I(this, e, t, 4, 4294967295, 0), o.TYPED_ARRAY_SUPPORT ? (this[t + 3] = e >>> 24, this[t + 2] = e >>> 16, this[t + 1] = e >>> 8, this[t] = 255 & e) : O(this, e, t, !0), t + 4
                }, o.prototype.writeUInt32BE = function(e, t, n) {
                    return e = +e, t = 0 | t, n || I(this, e, t, 4, 4294967295, 0), o.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = 255 & e) : O(this, e, t, !1), t + 4
                }, o.prototype.writeIntLE = function(e, t, n, r) {
                    if (e = +e, t = 0 | t, !r) {
                        var i = Math.pow(2, 8 * n - 1);
                        I(this, e, t, n, i - 1, -i)
                    }
                    var o = 0,
                        a = 1,
                        s = 0 > e ? 1 : 0;
                    for (this[t] = 255 & e; ++o < n && (a *= 256);) this[t + o] = (e / a >> 0) - s & 255;
                    return t + n
                }, o.prototype.writeIntBE = function(e, t, n, r) {
                    if (e = +e, t = 0 | t, !r) {
                        var i = Math.pow(2, 8 * n - 1);
                        I(this, e, t, n, i - 1, -i)
                    }
                    var o = n - 1,
                        a = 1,
                        s = 0 > e ? 1 : 0;
                    for (this[t + o] = 255 & e; --o >= 0 && (a *= 256);) this[t + o] = (e / a >> 0) - s & 255;
                    return t + n
                }, o.prototype.writeInt8 = function(e, t, n) {
                    return e = +e, t = 0 | t, n || I(this, e, t, 1, 127, -128), o.TYPED_ARRAY_SUPPORT || (e = Math.floor(e)), 0 > e && (e = 255 + e + 1), this[t] = 255 & e, t + 1
                }, o.prototype.writeInt16LE = function(e, t, n) {
                    return e = +e, t = 0 | t, n || I(this, e, t, 2, 32767, -32768), o.TYPED_ARRAY_SUPPORT ? (this[t] = 255 & e, this[t + 1] = e >>> 8) : R(this, e, t, !0), t + 2
                }, o.prototype.writeInt16BE = function(e, t, n) {
                    return e = +e, t = 0 | t, n || I(this, e, t, 2, 32767, -32768), o.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 8, this[t + 1] = 255 & e) : R(this, e, t, !1), t + 2
                }, o.prototype.writeInt32LE = function(e, t, n) {
                    return e = +e, t = 0 | t, n || I(this, e, t, 4, 2147483647, -2147483648), o.TYPED_ARRAY_SUPPORT ? (this[t] = 255 & e, this[t + 1] = e >>> 8, this[t + 2] = e >>> 16, this[t + 3] = e >>> 24) : O(this, e, t, !0), t + 4
                }, o.prototype.writeInt32BE = function(e, t, n) {
                    return e = +e, t = 0 | t, n || I(this, e, t, 4, 2147483647, -2147483648), 0 > e && (e = 4294967295 + e + 1), o.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = 255 & e) : O(this, e, t, !1), t + 4
                }, o.prototype.writeFloatLE = function(e, t, n) {
                    return U(this, e, t, !0, n)
                }, o.prototype.writeFloatBE = function(e, t, n) {
                    return U(this, e, t, !1, n)
                }, o.prototype.writeDoubleLE = function(e, t, n) {
                    return N(this, e, t, !0, n)
                }, o.prototype.writeDoubleBE = function(e, t, n) {
                    return N(this, e, t, !1, n)
                }, o.prototype.copy = function(e, t, n, r) {
                    if (n || (n = 0), r || 0 === r || (r = this.length), t >= e.length && (t = e.length), t || (t = 0), r > 0 && n > r && (r = n), r === n) return 0;
                    if (0 === e.length || 0 === this.length) return 0;
                    if (0 > t) throw new RangeError("targetStart out of bounds");
                    if (0 > n || n >= this.length) throw new RangeError("sourceStart out of bounds");
                    if (0 > r) throw new RangeError("sourceEnd out of bounds");
                    r > this.length && (r = this.length), e.length - t < r - n && (r = e.length - t + n);
                    var i, a = r - n;
                    if (this === e && t > n && r > t)
                        for (i = a - 1; i >= 0; i--) e[i + t] = this[i + n];
                    else if (1e3 > a || !o.TYPED_ARRAY_SUPPORT)
                        for (i = 0; a > i; i++) e[i + t] = this[i + n];
                    else Uint8Array.prototype.set.call(e, this.subarray(n, n + a), t);
                    return a
                }, o.prototype.fill = function(e, t, n) {
                    if (e || (e = 0), t || (t = 0), n || (n = this.length), t > n) throw new RangeError("end < start");
                    if (n !== t && 0 !== this.length) {
                        if (0 > t || t >= this.length) throw new RangeError("start out of bounds");
                        if (0 > n || n > this.length) throw new RangeError("end out of bounds");
                        var r;
                        if ("number" == typeof e)
                            for (r = t; n > r; r++) this[r] = e;
                        else {
                            var i = W(e.toString()),
                                o = i.length;
                            for (r = t; n > r; r++) this[r] = i[r % o]
                        }
                        return this
                    }
                };
                var Q = /[^+\/0-9A-Za-z-_]/g
            }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {
            "base64-js": 114,
            ieee754: 115,
            isarray: 116
        }],
        114: [function(e, t, n) {
            "use strict";

            function r() {
                var e, t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
                    n = t.length;
                for (e = 0; n > e; e++) c[e] = t[e];
                for (e = 0; n > e; ++e) u[t.charCodeAt(e)] = e;
                u["-".charCodeAt(0)] = 62, u["_".charCodeAt(0)] = 63
            }

            function i(e) {
                var t, n, r, i, o, a, s = e.length;
                if (s % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
                o = "=" === e[s - 2] ? 2 : "=" === e[s - 1] ? 1 : 0, a = new l(3 * s / 4 - o), r = o > 0 ? s - 4 : s;
                var c = 0;
                for (t = 0, n = 0; r > t; t += 4, n += 3) i = u[e.charCodeAt(t)] << 18 | u[e.charCodeAt(t + 1)] << 12 | u[e.charCodeAt(t + 2)] << 6 | u[e.charCodeAt(t + 3)], a[c++] = (16711680 & i) >> 16, a[c++] = (65280 & i) >> 8, a[c++] = 255 & i;
                return 2 === o ? (i = u[e.charCodeAt(t)] << 2 | u[e.charCodeAt(t + 1)] >> 4, a[c++] = 255 & i) : 1 === o && (i = u[e.charCodeAt(t)] << 10 | u[e.charCodeAt(t + 1)] << 4 | u[e.charCodeAt(t + 2)] >> 2, a[c++] = i >> 8 & 255, a[c++] = 255 & i), a
            }

            function o(e) {
                return c[e >> 18 & 63] + c[e >> 12 & 63] + c[e >> 6 & 63] + c[63 & e]
            }

            function a(e, t, n) {
                for (var r, i = [], a = t; n > a; a += 3) r = (e[a] << 16) + (e[a + 1] << 8) + e[a + 2], i.push(o(r));
                return i.join("")
            }

            function s(e) {
                for (var t, n = e.length, r = n % 3, i = "", o = [], s = 16383, u = 0, l = n - r; l > u; u += s) o.push(a(e, u, u + s > l ? l : u + s));
                return 1 === r ? (t = e[n - 1], i += c[t >> 2], i += c[t << 4 & 63], i += "==") : 2 === r && (t = (e[n - 2] << 8) + e[n - 1], i += c[t >> 10], i += c[t >> 4 & 63], i += c[t << 2 & 63], i += "="), o.push(i), o.join("")
            }
            n.toByteArray = i, n.fromByteArray = s;
            var c = [],
                u = [],
                l = "undefined" != typeof Uint8Array ? Uint8Array : Array;
            r()
        }, {}],
        115: [function(e, t, n) {
            n.read = function(e, t, n, r, i) {
                var o, a, s = 8 * i - r - 1,
                    c = (1 << s) - 1,
                    u = c >> 1,
                    l = -7,
                    f = n ? i - 1 : 0,
                    h = n ? -1 : 1,
                    d = e[t + f];
                for (f += h, o = d & (1 << -l) - 1, d >>= -l, l += s; l > 0; o = 256 * o + e[t + f], f += h, l -= 8);
                for (a = o & (1 << -l) - 1, o >>= -l, l += r; l > 0; a = 256 * a + e[t + f], f += h, l -= 8);
                if (0 === o) o = 1 - u;
                else {
                    if (o === c) return a ? NaN : (d ? -1 : 1) * (1 / 0);
                    a += Math.pow(2, r), o -= u
                }
                return (d ? -1 : 1) * a * Math.pow(2, o - r)
            }, n.write = function(e, t, n, r, i, o) {
                var a, s, c, u = 8 * o - i - 1,
                    l = (1 << u) - 1,
                    f = l >> 1,
                    h = 23 === i ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
                    d = r ? 0 : o - 1,
                    p = r ? 1 : -1,
                    m = 0 > t || 0 === t && 0 > 1 / t ? 1 : 0;
                for (t = Math.abs(t), isNaN(t) || t === 1 / 0 ? (s = isNaN(t) ? 1 : 0, a = l) : (a = Math.floor(Math.log(t) / Math.LN2), t * (c = Math.pow(2, -a)) < 1 && (a--, c *= 2), t += a + f >= 1 ? h / c : h * Math.pow(2, 1 - f), t * c >= 2 && (a++, c /= 2), a + f >= l ? (s = 0, a = l) : a + f >= 1 ? (s = (t * c - 1) * Math.pow(2, i), a += f) : (s = t * Math.pow(2, f - 1) * Math.pow(2, i), a = 0)); i >= 8; e[n + d] = 255 & s, d += p, s /= 256, i -= 8);
                for (a = a << i | s, u += i; u > 0; e[n + d] = 255 & a, d += p, a /= 256, u -= 8);
                e[n + d - p] |= 128 * m
            }
        }, {}],
        116: [function(e, t, n) {
            var r = {}.toString;
            t.exports = Array.isArray || function(e) {
                return "[object Array]" == r.call(e)
            }
        }, {}],
        117: [function(e, t, n) {
            function r() {
                this._events = this._events || {}, this._maxListeners = this._maxListeners || void 0
            }

            function i(e) {
                return "function" == typeof e
            }

            function o(e) {
                return "number" == typeof e
            }

            function a(e) {
                return "object" == typeof e && null !== e
            }

            function s(e) {
                return void 0 === e
            }
            t.exports = r, r.EventEmitter = r, r.prototype._events = void 0, r.prototype._maxListeners = void 0, r.defaultMaxListeners = 10, r.prototype.setMaxListeners = function(e) {
                if (!o(e) || 0 > e || isNaN(e)) throw TypeError("n must be a positive number");
                return this._maxListeners = e, this
            }, r.prototype.emit = function(e) {
                var t, n, r, o, c, u;
                if (this._events || (this._events = {}), "error" === e && (!this._events.error || a(this._events.error) && !this._events.error.length)) {
                    if (t = arguments[1], t instanceof Error) throw t;
                    throw TypeError('Uncaught, unspecified "error" event.')
                }
                if (n = this._events[e], s(n)) return !1;
                if (i(n)) switch (arguments.length) {
                    case 1:
                        n.call(this);
                        break;
                    case 2:
                        n.call(this, arguments[1]);
                        break;
                    case 3:
                        n.call(this, arguments[1], arguments[2]);
                        break;
                    default:
                        o = Array.prototype.slice.call(arguments, 1), n.apply(this, o)
                } else if (a(n))
                    for (o = Array.prototype.slice.call(arguments, 1), u = n.slice(), r = u.length, c = 0; r > c; c++) u[c].apply(this, o);
                return !0
            }, r.prototype.addListener = function(e, t) {
                var n;
                if (!i(t)) throw TypeError("listener must be a function");
                return this._events || (this._events = {}), this._events.newListener && this.emit("newListener", e, i(t.listener) ? t.listener : t), this._events[e] ? a(this._events[e]) ? this._events[e].push(t) : this._events[e] = [this._events[e], t] : this._events[e] = t, a(this._events[e]) && !this._events[e].warned && (n = s(this._maxListeners) ? r.defaultMaxListeners : this._maxListeners, n && n > 0 && this._events[e].length > n && (this._events[e].warned = !0, console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.", this._events[e].length), "function" == typeof console.trace && console.trace())), this
            }, r.prototype.on = r.prototype.addListener, r.prototype.once = function(e, t) {
                function n() {
                    this.removeListener(e, n), r || (r = !0, t.apply(this, arguments))
                }
                if (!i(t)) throw TypeError("listener must be a function");
                var r = !1;
                return n.listener = t, this.on(e, n), this
            }, r.prototype.removeListener = function(e, t) {
                var n, r, o, s;
                if (!i(t)) throw TypeError("listener must be a function");
                if (!this._events || !this._events[e]) return this;
                if (n = this._events[e], o = n.length, r = -1, n === t || i(n.listener) && n.listener === t) delete this._events[e], this._events.removeListener && this.emit("removeListener", e, t);
                else if (a(n)) {
                    for (s = o; s-- > 0;)
                        if (n[s] === t || n[s].listener && n[s].listener === t) {
                            r = s;
                            break
                        }
                    if (0 > r) return this;
                    1 === n.length ? (n.length = 0, delete this._events[e]) : n.splice(r, 1), this._events.removeListener && this.emit("removeListener", e, t)
                }
                return this
            }, r.prototype.removeAllListeners = function(e) {
                var t, n;
                if (!this._events) return this;
                if (!this._events.removeListener) return 0 === arguments.length ? this._events = {} : this._events[e] && delete this._events[e], this;
                if (0 === arguments.length) {
                    for (t in this._events) "removeListener" !== t && this.removeAllListeners(t);
                    return this.removeAllListeners("removeListener"), this._events = {}, this
                }
                if (n = this._events[e], i(n)) this.removeListener(e, n);
                else if (n)
                    for (; n.length;) this.removeListener(e, n[n.length - 1]);
                return delete this._events[e], this
            }, r.prototype.listeners = function(e) {
                var t;
                return t = this._events && this._events[e] ? i(this._events[e]) ? [this._events[e]] : this._events[e].slice() : []
            }, r.prototype.listenerCount = function(e) {
                if (this._events) {
                    var t = this._events[e];
                    if (i(t)) return 1;
                    if (t) return t.length
                }
                return 0
            }, r.listenerCount = function(e, t) {
                return e.listenerCount(t)
            }
        }, {}],
        118: [function(e, t, n) {
            "function" == typeof Object.create ? t.exports = function(e, t) {
                e.super_ = t, e.prototype = Object.create(t.prototype, {
                    constructor: {
                        value: e,
                        enumerable: !1,
                        writable: !0,
                        configurable: !0
                    }
                })
            } : t.exports = function(e, t) {
                e.super_ = t;
                var n = function() {};
                n.prototype = t.prototype, e.prototype = new n, e.prototype.constructor = e
            }
        }, {}],
        119: [function(e, t, n) {
            t.exports = function(e) {
                return !(null == e || !(e._isBuffer || e.constructor && "function" == typeof e.constructor.isBuffer && e.constructor.isBuffer(e)))
            }
        }, {}],
        120: [function(e, t, n) {
            t.exports = Array.isArray || function(e) {
                return "[object Array]" == Object.prototype.toString.call(e)
            }
        }, {}],
        121: [function(e, t, n) {
            function r() {
                l = !1, s.length ? u = s.concat(u) : f = -1, u.length && i()
            }

            function i() {
                if (!l) {
                    var e = setTimeout(r);
                    l = !0;
                    for (var t = u.length; t;) {
                        for (s = u, u = []; ++f < t;) s && s[f].run();
                        f = -1, t = u.length
                    }
                    s = null, l = !1, clearTimeout(e)
                }
            }

            function o(e, t) {
                this.fun = e, this.array = t
            }

            function a() {}
            var s, c = t.exports = {},
                u = [],
                l = !1,
                f = -1;
            c.nextTick = function(e) {
                var t = new Array(arguments.length - 1);
                if (arguments.length > 1)
                    for (var n = 1; n < arguments.length; n++) t[n - 1] = arguments[n];
                u.push(new o(e, t)), 1 !== u.length || l || setTimeout(i, 0)
            }, o.prototype.run = function() {
                this.fun.apply(null, this.array)
            }, c.title = "browser", c.browser = !0, c.env = {}, c.argv = [], c.version = "", c.versions = {}, c.on = a, c.addListener = a, c.once = a, c.off = a, c.removeListener = a, c.removeAllListeners = a, c.emit = a, c.binding = function(e) {
                throw new Error("process.binding is not supported")
            }, c.cwd = function() {
                return "/"
            }, c.chdir = function(e) {
                throw new Error("process.chdir is not supported")
            }, c.umask = function() {
                return 0
            }
        }, {}],
        122: [function(e, t, n) {
            t.exports = e("./lib/_stream_duplex.js")
        }, {
            "./lib/_stream_duplex.js": 123
        }],
        123: [function(e, t, n) {
            "use strict";

            function r(e) {
                return this instanceof r ? (u.call(this, e), l.call(this, e), e && e.readable === !1 && (this.readable = !1), e && e.writable === !1 && (this.writable = !1), this.allowHalfOpen = !0, e && e.allowHalfOpen === !1 && (this.allowHalfOpen = !1), void this.once("end", i)) : new r(e)
            }

            function i() {
                this.allowHalfOpen || this._writableState.ended || s(o, this)
            }

            function o(e) {
                e.end()
            }
            var a = Object.keys || function(e) {
                var t = [];
                for (var n in e) t.push(n);
                return t
            };
            t.exports = r;
            var s = e("process-nextick-args"),
                c = e("core-util-is");
            c.inherits = e("inherits");
            var u = e("./_stream_readable"),
                l = e("./_stream_writable");
            c.inherits(r, u);
            for (var f = a(l.prototype), h = 0; h < f.length; h++) {
                var d = f[h];
                r.prototype[d] || (r.prototype[d] = l.prototype[d])
            }
        }, {
            "./_stream_readable": 125,
            "./_stream_writable": 127,
            "core-util-is": 128,
            inherits: 118,
            "process-nextick-args": 129
        }],
        124: [function(e, t, n) {
            "use strict";

            function r(e) {
                return this instanceof r ? void i.call(this, e) : new r(e)
            }
            t.exports = r;
            var i = e("./_stream_transform"),
                o = e("core-util-is");
            o.inherits = e("inherits"), o.inherits(r, i), r.prototype._transform = function(e, t, n) {
                n(null, e)
            }
        }, {
            "./_stream_transform": 126,
            "core-util-is": 128,
            inherits: 118
        }],
        125: [function(e, t, n) {
            (function(n) {
                "use strict";

                function r(t, n) {
                    I = I || e("./_stream_duplex"), t = t || {}, this.objectMode = !!t.objectMode, n instanceof I && (this.objectMode = this.objectMode || !!t.readableObjectMode);
                    var r = t.highWaterMark,
                        i = this.objectMode ? 16 : 16384;
                    this.highWaterMark = r || 0 === r ? r : i, this.highWaterMark = ~~this.highWaterMark, this.buffer = [], this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.defaultEncoding = t.defaultEncoding || "utf8", this.ranOut = !1, this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, t.encoding && (M || (M = e("string_decoder/").StringDecoder), this.decoder = new M(t.encoding), this.encoding = t.encoding)
                }

                function i(t) {
                    return I = I || e("./_stream_duplex"), this instanceof i ? (this._readableState = new r(t, this), this.readable = !0, t && "function" == typeof t.read && (this._read = t.read), void C.call(this)) : new i(t)
                }

                function o(e, t, n, r, i) {
                    var o = u(t, n);
                    if (o) e.emit("error", o);
                    else if (null === n) t.reading = !1, l(e, t);
                    else if (t.objectMode || n && n.length > 0)
                        if (t.ended && !i) {
                            var s = new Error("stream.push() after EOF");
                            e.emit("error", s)
                        } else if (t.endEmitted && i) {
                        var s = new Error("stream.unshift() after end event");
                        e.emit("error", s)
                    } else !t.decoder || i || r || (n = t.decoder.write(n)), i || (t.reading = !1), t.flowing && 0 === t.length && !t.sync ? (e.emit("data", n), e.read(0)) : (t.length += t.objectMode ? 1 : n.length, i ? t.buffer.unshift(n) : t.buffer.push(n), t.needReadable && f(e)), d(e, t);
                    else i || (t.reading = !1);
                    return a(t)
                }

                function a(e) {
                    return !e.ended && (e.needReadable || e.length < e.highWaterMark || 0 === e.length)
                }

                function s(e) {
                    return e >= R ? e = R : (e--, e |= e >>> 1, e |= e >>> 2, e |= e >>> 4, e |= e >>> 8, e |= e >>> 16, e++), e
                }

                function c(e, t) {
                    return 0 === t.length && t.ended ? 0 : t.objectMode ? 0 === e ? 0 : 1 : null === e || isNaN(e) ? t.flowing && t.buffer.length ? t.buffer[0].length : t.length : 0 >= e ? 0 : (e > t.highWaterMark && (t.highWaterMark = s(e)), e > t.length ? t.ended ? t.length : (t.needReadable = !0, 0) : e)
                }

                function u(e, t) {
                    var n = null;
                    return E.isBuffer(t) || "string" == typeof t || null === t || void 0 === t || e.objectMode || (n = new TypeError("Invalid non-string/buffer chunk")), n
                }

                function l(e, t) {
                    if (!t.ended) {
                        if (t.decoder) {
                            var n = t.decoder.end();
                            n && n.length && (t.buffer.push(n), t.length += t.objectMode ? 1 : n.length)
                        }
                        t.ended = !0, f(e)
                    }
                }

                function f(e) {
                    var t = e._readableState;
                    t.needReadable = !1, t.emittedReadable || (P("emitReadable", t.flowing), t.emittedReadable = !0, t.sync ? T(h, e) : h(e))
                }

                function h(e) {
                    P("emit readable"), e.emit("readable"), y(e)
                }

                function d(e, t) {
                    t.readingMore || (t.readingMore = !0, T(p, e, t))
                }

                function p(e, t) {
                    for (var n = t.length; !t.reading && !t.flowing && !t.ended && t.length < t.highWaterMark && (P("maybeReadMore read 0"), e.read(0), n !== t.length);) n = t.length;
                    t.readingMore = !1
                }

                function m(e) {
                    return function() {
                        var t = e._readableState;
                        P("pipeOnDrain", t.awaitDrain), t.awaitDrain && t.awaitDrain--, 0 === t.awaitDrain && A(e, "data") && (t.flowing = !0, y(e))
                    }
                }

                function g(e) {
                    P("readable nexttick read 0"), e.read(0)
                }

                function b(e, t) {
                    t.resumeScheduled || (t.resumeScheduled = !0, T(v, e, t))
                }

                function v(e, t) {
                    t.reading || (P("resume read 0"), e.read(0)), t.resumeScheduled = !1, e.emit("resume"), y(e), t.flowing && !t.reading && e.read(0)
                }

                function y(e) {
                    var t = e._readableState;
                    if (P("flow", t.flowing), t.flowing)
                        do var n = e.read(); while (null !== n && t.flowing)
                }

                function _(e, t) {
                    var n, r = t.buffer,
                        i = t.length,
                        o = !!t.decoder,
                        a = !!t.objectMode;
                    if (0 === r.length) return null;
                    if (0 === i) n = null;
                    else if (a) n = r.shift();
                    else if (!e || e >= i) n = o ? r.join("") : 1 === r.length ? r[0] : E.concat(r, i), r.length = 0;
                    else if (e < r[0].length) {
                        var s = r[0];
                        n = s.slice(0, e), r[0] = s.slice(e)
                    } else if (e === r[0].length) n = r.shift();
                    else {
                        n = o ? "" : new E(e);
                        for (var c = 0, u = 0, l = r.length; l > u && e > c; u++) {
                            var s = r[0],
                                f = Math.min(e - c, s.length);
                            o ? n += s.slice(0, f) : s.copy(n, c, 0, f), f < s.length ? r[0] = s.slice(f) : r.shift(), c += f
                        }
                    }
                    return n
                }

                function w(e) {
                    var t = e._readableState;
                    if (t.length > 0) throw new Error("endReadable called on non-empty stream");
                    t.endEmitted || (t.ended = !0, T(k, t, e))
                }

                function k(e, t) {
                    e.endEmitted || 0 !== e.length || (e.endEmitted = !0, t.readable = !1, t.emit("end"))
                }

                function x(e, t) {
                    for (var n = 0, r = e.length; r > n; n++) t(e[n], n)
                }

                function S(e, t) {
                    for (var n = 0, r = e.length; r > n; n++)
                        if (e[n] === t) return n;
                    return -1
                }
                t.exports = i;
                var T = e("process-nextick-args"),
                    j = e("isarray"),
                    E = e("buffer").Buffer;
                i.ReadableState = r;
                var C, A = (e("events"), function(e, t) {
                    return e.listeners(t).length
                });
                ! function() {
                    try {
                        C = e("stream")
                    } catch (t) {} finally {
                        C || (C = e("events").EventEmitter)
                    }
                }();
                var E = e("buffer").Buffer,
                    D = e("core-util-is");
                D.inherits = e("inherits");
                var P, B = e("util");
                P = B && B.debuglog ? B.debuglog("stream") : function() {};
                var M;
                D.inherits(i, C);
                var I, I;
                i.prototype.push = function(e, t) {
                    var n = this._readableState;
                    return n.objectMode || "string" != typeof e || (t = t || n.defaultEncoding, t !== n.encoding && (e = new E(e, t), t = "")), o(this, n, e, t, !1)
                }, i.prototype.unshift = function(e) {
                    var t = this._readableState;
                    return o(this, t, e, "", !0)
                }, i.prototype.isPaused = function() {
                    return this._readableState.flowing === !1
                }, i.prototype.setEncoding = function(t) {
                    return M || (M = e("string_decoder/").StringDecoder), this._readableState.decoder = new M(t), this._readableState.encoding = t, this
                };
                var R = 8388608;
                i.prototype.read = function(e) {
                    P("read", e);
                    var t = this._readableState,
                        n = e;
                    if (("number" != typeof e || e > 0) && (t.emittedReadable = !1), 0 === e && t.needReadable && (t.length >= t.highWaterMark || t.ended)) return P("read: emitReadable", t.length, t.ended), 0 === t.length && t.ended ? w(this) : f(this), null;
                    if (e = c(e, t), 0 === e && t.ended) return 0 === t.length && w(this), null;
                    var r = t.needReadable;
                    P("need readable", r), (0 === t.length || t.length - e < t.highWaterMark) && (r = !0, P("length less than watermark", r)), (t.ended || t.reading) && (r = !1, P("reading or ended", r)), r && (P("do read"), t.reading = !0, t.sync = !0, 0 === t.length && (t.needReadable = !0), this._read(t.highWaterMark), t.sync = !1), r && !t.reading && (e = c(n, t));
                    var i;
                    return i = e > 0 ? _(e, t) : null, null === i && (t.needReadable = !0, e = 0), t.length -= e, 0 !== t.length || t.ended || (t.needReadable = !0), n !== e && t.ended && 0 === t.length && w(this), null !== i && this.emit("data", i), i
                }, i.prototype._read = function(e) {
                    this.emit("error", new Error("not implemented"))
                }, i.prototype.pipe = function(e, t) {
                    function r(e) {
                        P("onunpipe"), e === f && o()
                    }

                    function i() {
                        P("onend"), e.end()
                    }

                    function o() {
                        P("cleanup"), e.removeListener("close", c), e.removeListener("finish", u), e.removeListener("drain", g), e.removeListener("error", s), e.removeListener("unpipe", r), f.removeListener("end", i), f.removeListener("end", o), f.removeListener("data", a), b = !0, !h.awaitDrain || e._writableState && !e._writableState.needDrain || g()
                    }

                    function a(t) {
                        P("ondata");
                        var n = e.write(t);
                        !1 === n && (1 !== h.pipesCount || h.pipes[0] !== e || 1 !== f.listenerCount("data") || b || (P("false write response, pause", f._readableState.awaitDrain), f._readableState.awaitDrain++), f.pause())
                    }

                    function s(t) {
                        P("onerror", t), l(), e.removeListener("error", s), 0 === A(e, "error") && e.emit("error", t)
                    }

                    function c() {
                        e.removeListener("finish", u), l()
                    }

                    function u() {
                        P("onfinish"), e.removeListener("close", c), l()
                    }

                    function l() {
                        P("unpipe"), f.unpipe(e)
                    }
                    var f = this,
                        h = this._readableState;
                    switch (h.pipesCount) {
                        case 0:
                            h.pipes = e;
                            break;
                        case 1:
                            h.pipes = [h.pipes, e];
                            break;
                        default:
                            h.pipes.push(e)
                    }
                    h.pipesCount += 1, P("pipe count=%d opts=%j", h.pipesCount, t);
                    var d = (!t || t.end !== !1) && e !== n.stdout && e !== n.stderr,
                        p = d ? i : o;
                    h.endEmitted ? T(p) : f.once("end", p), e.on("unpipe", r);
                    var g = m(f);
                    e.on("drain", g);
                    var b = !1;
                    return f.on("data", a), e._events && e._events.error ? j(e._events.error) ? e._events.error.unshift(s) : e._events.error = [s, e._events.error] : e.on("error", s), e.once("close", c), e.once("finish", u), e.emit("pipe", f), h.flowing || (P("pipe resume"), f.resume()), e
                }, i.prototype.unpipe = function(e) {
                    var t = this._readableState;
                    if (0 === t.pipesCount) return this;
                    if (1 === t.pipesCount) return e && e !== t.pipes ? this : (e || (e = t.pipes), t.pipes = null, t.pipesCount = 0, t.flowing = !1, e && e.emit("unpipe", this), this);
                    if (!e) {
                        var n = t.pipes,
                            r = t.pipesCount;
                        t.pipes = null, t.pipesCount = 0, t.flowing = !1;
                        for (var i = 0; r > i; i++) n[i].emit("unpipe", this);
                        return this
                    }
                    var i = S(t.pipes, e);
                    return -1 === i ? this : (t.pipes.splice(i, 1), t.pipesCount -= 1, 1 === t.pipesCount && (t.pipes = t.pipes[0]), e.emit("unpipe", this), this)
                }, i.prototype.on = function(e, t) {
                    var n = C.prototype.on.call(this, e, t);
                    if ("data" === e && !1 !== this._readableState.flowing && this.resume(), "readable" === e && this.readable) {
                        var r = this._readableState;
                        r.readableListening || (r.readableListening = !0, r.emittedReadable = !1, r.needReadable = !0, r.reading ? r.length && f(this, r) : T(g, this))
                    }
                    return n
                }, i.prototype.addListener = i.prototype.on, i.prototype.resume = function() {
                    var e = this._readableState;
                    return e.flowing || (P("resume"), e.flowing = !0, b(this, e)), this
                }, i.prototype.pause = function() {
                    return P("call pause flowing=%j", this._readableState.flowing), !1 !== this._readableState.flowing && (P("pause"), this._readableState.flowing = !1, this.emit("pause")), this
                }, i.prototype.wrap = function(e) {
                    var t = this._readableState,
                        n = !1,
                        r = this;
                    e.on("end", function() {
                        if (P("wrapped end"), t.decoder && !t.ended) {
                            var e = t.decoder.end();
                            e && e.length && r.push(e)
                        }
                        r.push(null)
                    }), e.on("data", function(i) {
                        if (P("wrapped data"), t.decoder && (i = t.decoder.write(i)), (!t.objectMode || null !== i && void 0 !== i) && (t.objectMode || i && i.length)) {
                            var o = r.push(i);
                            o || (n = !0, e.pause())
                        }
                    });
                    for (var i in e) void 0 === this[i] && "function" == typeof e[i] && (this[i] = function(t) {
                        return function() {
                            return e[t].apply(e, arguments)
                        }
                    }(i));
                    var o = ["error", "close", "destroy", "pause", "resume"];
                    return x(o, function(t) {
                        e.on(t, r.emit.bind(r, t))
                    }), r._read = function(t) {
                        P("wrapped _read", t), n && (n = !1, e.resume())
                    }, r
                }, i._fromList = _
            }).call(this, e("_process"))
        }, {
            "./_stream_duplex": 123,
            _process: 121,
            buffer: 113,
            "core-util-is": 128,
            events: 117,
            inherits: 118,
            isarray: 120,
            "process-nextick-args": 129,
            "string_decoder/": 136,
            util: 112
        }],
        126: [function(e, t, n) {
            "use strict";

            function r(e) {
                this.afterTransform = function(t, n) {
                    return i(e, t, n)
                }, this.needTransform = !1, this.transforming = !1, this.writecb = null, this.writechunk = null
            }

            function i(e, t, n) {
                var r = e._transformState;
                r.transforming = !1;
                var i = r.writecb;
                if (!i) return e.emit("error", new Error("no writecb in Transform class"));
                r.writechunk = null, r.writecb = null, null !== n && void 0 !== n && e.push(n), i && i(t);
                var o = e._readableState;
                o.reading = !1, (o.needReadable || o.length < o.highWaterMark) && e._read(o.highWaterMark)
            }

            function o(e) {
                if (!(this instanceof o)) return new o(e);
                s.call(this, e), this._transformState = new r(this);
                var t = this;
                this._readableState.needReadable = !0, this._readableState.sync = !1, e && ("function" == typeof e.transform && (this._transform = e.transform), "function" == typeof e.flush && (this._flush = e.flush)), this.once("prefinish", function() {
                    "function" == typeof this._flush ? this._flush(function(e) {
                        a(t, e)
                    }) : a(t)
                })
            }

            function a(e, t) {
                if (t) return e.emit("error", t);
                var n = e._writableState,
                    r = e._transformState;
                if (n.length) throw new Error("calling transform done when ws.length != 0");
                if (r.transforming) throw new Error("calling transform done when still transforming");
                return e.push(null)
            }
            t.exports = o;
            var s = e("./_stream_duplex"),
                c = e("core-util-is");
            c.inherits = e("inherits"), c.inherits(o, s), o.prototype.push = function(e, t) {
                return this._transformState.needTransform = !1, s.prototype.push.call(this, e, t)
            }, o.prototype._transform = function(e, t, n) {
                throw new Error("not implemented")
            }, o.prototype._write = function(e, t, n) {
                var r = this._transformState;
                if (r.writecb = n, r.writechunk = e, r.writeencoding = t, !r.transforming) {
                    var i = this._readableState;
                    (r.needTransform || i.needReadable || i.length < i.highWaterMark) && this._read(i.highWaterMark)
                }
            }, o.prototype._read = function(e) {
                var t = this._transformState;
                null !== t.writechunk && t.writecb && !t.transforming ? (t.transforming = !0, this._transform(t.writechunk, t.writeencoding, t.afterTransform)) : t.needTransform = !0
            }
        }, {
            "./_stream_duplex": 123,
            "core-util-is": 128,
            inherits: 118
        }],
        127: [function(e, t, n) {
            "use strict";

            function r() {}

            function i(e, t, n) {
                this.chunk = e, this.encoding = t, this.callback = n, this.next = null
            }

            function o(t, n) {
                E = E || e("./_stream_duplex"), t = t || {}, this.objectMode = !!t.objectMode, n instanceof E && (this.objectMode = this.objectMode || !!t.writableObjectMode);
                var r = t.highWaterMark,
                    i = this.objectMode ? 16 : 16384;
                this.highWaterMark = r || 0 === r ? r : i, this.highWaterMark = ~~this.highWaterMark, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1;
                var o = t.decodeStrings === !1;
                this.decodeStrings = !o, this.defaultEncoding = t.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function(e) {
                    p(n, e)
                }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1
            }

            function a(t) {
                return E = E || e("./_stream_duplex"), this instanceof a || this instanceof E ? (this._writableState = new o(t, this), this.writable = !0, t && ("function" == typeof t.write && (this._write = t.write), "function" == typeof t.writev && (this._writev = t.writev)), void T.call(this)) : new a(t)
            }

            function s(e, t) {
                var n = new Error("write after end");
                e.emit("error", n), k(t, n)
            }

            function c(e, t, n, r) {
                var i = !0;
                if (!x.isBuffer(n) && "string" != typeof n && null !== n && void 0 !== n && !t.objectMode) {
                    var o = new TypeError("Invalid non-string/buffer chunk");
                    e.emit("error", o), k(r, o), i = !1
                }
                return i
            }

            function u(e, t, n) {
                return e.objectMode || e.decodeStrings === !1 || "string" != typeof t || (t = new x(t, n)), t
            }

            function l(e, t, n, r, o) {
                n = u(t, n, r), x.isBuffer(n) && (r = "buffer");
                var a = t.objectMode ? 1 : n.length;
                t.length += a;
                var s = t.length < t.highWaterMark;
                if (s || (t.needDrain = !0), t.writing || t.corked) {
                    var c = t.lastBufferedRequest;
                    t.lastBufferedRequest = new i(n, r, o), c ? c.next = t.lastBufferedRequest : t.bufferedRequest = t.lastBufferedRequest
                } else f(e, t, !1, a, n, r, o);
                return s
            }

            function f(e, t, n, r, i, o, a) {
                t.writelen = r, t.writecb = a, t.writing = !0, t.sync = !0, n ? e._writev(i, t.onwrite) : e._write(i, o, t.onwrite), t.sync = !1
            }

            function h(e, t, n, r, i) {
                --t.pendingcb, n ? k(i, r) : i(r), e._writableState.errorEmitted = !0, e.emit("error", r)
            }

            function d(e) {
                e.writing = !1, e.writecb = null, e.length -= e.writelen, e.writelen = 0
            }

            function p(e, t) {
                var n = e._writableState,
                    r = n.sync,
                    i = n.writecb;
                if (d(n), t) h(e, n, r, t, i);
                else {
                    var o = v(n);
                    o || n.corked || n.bufferProcessing || !n.bufferedRequest || b(e, n), r ? k(m, e, n, o, i) : m(e, n, o, i)
                }
            }

            function m(e, t, n, r) {
                n || g(e, t), t.pendingcb--, r(), _(e, t)
            }

            function g(e, t) {
                0 === t.length && t.needDrain && (t.needDrain = !1, e.emit("drain"))
            }

            function b(e, t) {
                t.bufferProcessing = !0;
                var n = t.bufferedRequest;
                if (e._writev && n && n.next) {
                    for (var r = [], i = []; n;) i.push(n.callback), r.push(n), n = n.next;
                    t.pendingcb++, t.lastBufferedRequest = null, f(e, t, !0, t.length, r, "", function(e) {
                        for (var n = 0; n < i.length; n++) t.pendingcb--, i[n](e)
                    })
                } else {
                    for (; n;) {
                        var o = n.chunk,
                            a = n.encoding,
                            s = n.callback,
                            c = t.objectMode ? 1 : o.length;
                        if (f(e, t, !1, c, o, a, s), n = n.next, t.writing) break
                    }
                    null === n && (t.lastBufferedRequest = null)
                }
                t.bufferedRequest = n, t.bufferProcessing = !1
            }

            function v(e) {
                return e.ending && 0 === e.length && null === e.bufferedRequest && !e.finished && !e.writing
            }

            function y(e, t) {
                t.prefinished || (t.prefinished = !0, e.emit("prefinish"))
            }

            function _(e, t) {
                var n = v(t);
                return n && (0 === t.pendingcb ? (y(e, t), t.finished = !0, e.emit("finish")) : y(e, t)), n
            }

            function w(e, t, n) {
                t.ending = !0, _(e, t), n && (t.finished ? k(n) : e.once("finish", n)), t.ended = !0
            }
            t.exports = a;
            var k = e("process-nextick-args"),
                x = e("buffer").Buffer;
            a.WritableState = o;
            var S = e("core-util-is");
            S.inherits = e("inherits");
            var T, j = {
                deprecate: e("util-deprecate")
            };
            ! function() {
                try {
                    T = e("stream")
                } catch (t) {} finally {
                    T || (T = e("events").EventEmitter)
                }
            }();
            var x = e("buffer").Buffer;
            S.inherits(a, T);
            var E;
            o.prototype.getBuffer = function() {
                    for (var e = this.bufferedRequest, t = []; e;) t.push(e), e = e.next;
                    return t
                },
                function() {
                    try {
                        Object.defineProperty(o.prototype, "buffer", {
                            get: j.deprecate(function() {
                                return this.getBuffer()
                            }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.")
                        })
                    } catch (e) {}
                }();
            var E;
            a.prototype.pipe = function() {
                this.emit("error", new Error("Cannot pipe. Not readable."))
            }, a.prototype.write = function(e, t, n) {
                var i = this._writableState,
                    o = !1;
                return "function" == typeof t && (n = t, t = null), x.isBuffer(e) ? t = "buffer" : t || (t = i.defaultEncoding), "function" != typeof n && (n = r), i.ended ? s(this, n) : c(this, i, e, n) && (i.pendingcb++, o = l(this, i, e, t, n)), o
            }, a.prototype.cork = function() {
                var e = this._writableState;
                e.corked++
            }, a.prototype.uncork = function() {
                var e = this._writableState;
                e.corked && (e.corked--, e.writing || e.corked || e.finished || e.bufferProcessing || !e.bufferedRequest || b(this, e))
            }, a.prototype.setDefaultEncoding = function(e) {
                if ("string" == typeof e && (e = e.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((e + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + e);
                this._writableState.defaultEncoding = e
            }, a.prototype._write = function(e, t, n) {
                n(new Error("not implemented"))
            }, a.prototype._writev = null, a.prototype.end = function(e, t, n) {
                var r = this._writableState;
                "function" == typeof e ? (n = e, e = null, t = null) : "function" == typeof t && (n = t, t = null), null !== e && void 0 !== e && this.write(e, t), r.corked && (r.corked = 1, this.uncork()), r.ending || r.finished || w(this, r, n)
            }
        }, {
            "./_stream_duplex": 123,
            buffer: 113,
            "core-util-is": 128,
            events: 117,
            inherits: 118,
            "process-nextick-args": 129,
            "util-deprecate": 130
        }],
        128: [function(e, t, n) {
            (function(e) {
                function t(e) {
                    return Array.isArray ? Array.isArray(e) : "[object Array]" === g(e)
                }

                function r(e) {
                    return "boolean" == typeof e
                }

                function i(e) {
                    return null === e
                }

                function o(e) {
                    return null == e
                }

                function a(e) {
                    return "number" == typeof e
                }

                function s(e) {
                    return "string" == typeof e
                }

                function c(e) {
                    return "symbol" == typeof e
                }

                function u(e) {
                    return void 0 === e
                }

                function l(e) {
                    return "[object RegExp]" === g(e)
                }

                function f(e) {
                    return "object" == typeof e && null !== e
                }

                function h(e) {
                    return "[object Date]" === g(e)
                }

                function d(e) {
                    return "[object Error]" === g(e) || e instanceof Error
                }

                function p(e) {
                    return "function" == typeof e
                }

                function m(e) {
                    return null === e || "boolean" == typeof e || "number" == typeof e || "string" == typeof e || "symbol" == typeof e || "undefined" == typeof e
                }

                function g(e) {
                    return Object.prototype.toString.call(e)
                }
                n.isArray = t, n.isBoolean = r, n.isNull = i, n.isNullOrUndefined = o, n.isNumber = a, n.isString = s, n.isSymbol = c, n.isUndefined = u, n.isRegExp = l, n.isObject = f, n.isDate = h, n.isError = d, n.isFunction = p, n.isPrimitive = m, n.isBuffer = e.isBuffer
            }).call(this, {
                isBuffer: e("../../../../insert-module-globals/node_modules/is-buffer/index.js")
            })
        }, {
            "../../../../insert-module-globals/node_modules/is-buffer/index.js": 119
        }],
        129: [function(e, t, n) {
            (function(e) {
                "use strict";

                function n(t) {
                    for (var n = new Array(arguments.length - 1), r = 0; r < n.length;) n[r++] = arguments[r];
                    e.nextTick(function() {
                        t.apply(null, n)
                    })
                }!e.version || 0 === e.version.indexOf("v0.") || 0 === e.version.indexOf("v1.") && 0 !== e.version.indexOf("v1.8.") ? t.exports = n : t.exports = e.nextTick
            }).call(this, e("_process"))
        }, {
            _process: 121
        }],
        130: [function(e, t, n) {
            (function(e) {
                function n(e, t) {
                    function n() {
                        if (!i) {
                            if (r("throwDeprecation")) throw new Error(t);
                            r("traceDeprecation") ? console.trace(t) : console.warn(t), i = !0
                        }
                        return e.apply(this, arguments)
                    }
                    if (r("noDeprecation")) return e;
                    var i = !1;
                    return n
                }

                function r(t) {
                    try {
                        if (!e.localStorage) return !1
                    } catch (n) {
                        return !1
                    }
                    var r = e.localStorage[t];
                    return null == r ? !1 : "true" === String(r).toLowerCase()
                }
                t.exports = n
            }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {}],
        131: [function(e, t, n) {
            t.exports = e("./lib/_stream_passthrough.js")
        }, {
            "./lib/_stream_passthrough.js": 124
        }],
        132: [function(e, t, n) {
            var r = function() {
                try {
                    return e("stream")
                } catch (t) {}
            }();
            n = t.exports = e("./lib/_stream_readable.js"), n.Stream = r || n, n.Readable = n, n.Writable = e("./lib/_stream_writable.js"), n.Duplex = e("./lib/_stream_duplex.js"), n.Transform = e("./lib/_stream_transform.js"), n.PassThrough = e("./lib/_stream_passthrough.js")
        }, {
            "./lib/_stream_duplex.js": 123,
            "./lib/_stream_passthrough.js": 124,
            "./lib/_stream_readable.js": 125,
            "./lib/_stream_transform.js": 126,
            "./lib/_stream_writable.js": 127
        }],
        133: [function(e, t, n) {
            t.exports = e("./lib/_stream_transform.js")
        }, {
            "./lib/_stream_transform.js": 126
        }],
        134: [function(e, t, n) {
            t.exports = e("./lib/_stream_writable.js")
        }, {
            "./lib/_stream_writable.js": 127
        }],
        135: [function(e, t, n) {
            function r() {
                i.call(this)
            }
            t.exports = r;
            var i = e("events").EventEmitter,
                o = e("inherits");
            o(r, i), r.Readable = e("readable-stream/readable.js"), r.Writable = e("readable-stream/writable.js"), r.Duplex = e("readable-stream/duplex.js"), r.Transform = e("readable-stream/transform.js"), r.PassThrough = e("readable-stream/passthrough.js"), r.Stream = r, r.prototype.pipe = function(e, t) {
                function n(t) {
                    e.writable && !1 === e.write(t) && u.pause && u.pause()
                }

                function r() {
                    u.readable && u.resume && u.resume()
                }

                function o() {
                    l || (l = !0, e.end())
                }

                function a() {
                    l || (l = !0, "function" == typeof e.destroy && e.destroy())
                }

                function s(e) {
                    if (c(), 0 === i.listenerCount(this, "error")) throw e
                }

                function c() {
                    u.removeListener("data", n), e.removeListener("drain", r), u.removeListener("end", o), u.removeListener("close", a), u.removeListener("error", s), e.removeListener("error", s), u.removeListener("end", c), u.removeListener("close", c), e.removeListener("close", c)
                }
                var u = this;
                u.on("data", n), e.on("drain", r), e._isStdio || t && t.end === !1 || (u.on("end", o), u.on("close", a));
                var l = !1;
                return u.on("error", s), e.on("error", s), u.on("end", c), u.on("close", c), e.on("close", c), e.emit("pipe", u), e
            }
        }, {
            events: 117,
            inherits: 118,
            "readable-stream/duplex.js": 122,
            "readable-stream/passthrough.js": 131,
            "readable-stream/readable.js": 132,
            "readable-stream/transform.js": 133,
            "readable-stream/writable.js": 134
        }],
        136: [function(e, t, n) {
            function r(e) {
                if (e && !c(e)) throw new Error("Unknown encoding: " + e)
            }

            function i(e) {
                return e.toString(this.encoding)
            }

            function o(e) {
                this.charReceived = e.length % 2, this.charLength = this.charReceived ? 2 : 0
            }

            function a(e) {
                this.charReceived = e.length % 3, this.charLength = this.charReceived ? 3 : 0
            }
            var s = e("buffer").Buffer,
                c = s.isEncoding || function(e) {
                    switch (e && e.toLowerCase()) {
                        case "hex":
                        case "utf8":
                        case "utf-8":
                        case "ascii":
                        case "binary":
                        case "base64":
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                        case "raw":
                            return !0;
                        default:
                            return !1
                    }
                },
                u = n.StringDecoder = function(e) {
                    switch (this.encoding = (e || "utf8").toLowerCase().replace(/[-_]/, ""), r(e), this.encoding) {
                        case "utf8":
                            this.surrogateSize = 3;
                            break;
                        case "ucs2":
                        case "utf16le":
                            this.surrogateSize = 2, this.detectIncompleteChar = o;
                            break;
                        case "base64":
                            this.surrogateSize = 3, this.detectIncompleteChar = a;
                            break;
                        default:
                            return void(this.write = i)
                    }
                    this.charBuffer = new s(6), this.charReceived = 0, this.charLength = 0
                };
            u.prototype.write = function(e) {
                for (var t = ""; this.charLength;) {
                    var n = e.length >= this.charLength - this.charReceived ? this.charLength - this.charReceived : e.length;
                    if (e.copy(this.charBuffer, this.charReceived, 0, n), this.charReceived += n, this.charReceived < this.charLength) return "";
                    e = e.slice(n, e.length), t = this.charBuffer.slice(0, this.charLength).toString(this.encoding);
                    var r = t.charCodeAt(t.length - 1);
                    if (!(r >= 55296 && 56319 >= r)) {
                        if (this.charReceived = this.charLength = 0, 0 === e.length) return t;
                        break
                    }
                    this.charLength += this.surrogateSize, t = ""
                }
                this.detectIncompleteChar(e);
                var i = e.length;
                this.charLength && (e.copy(this.charBuffer, 0, e.length - this.charReceived, i), i -= this.charReceived), t += e.toString(this.encoding, 0, i);
                var i = t.length - 1,
                    r = t.charCodeAt(i);
                if (r >= 55296 && 56319 >= r) {
                    var o = this.surrogateSize;
                    return this.charLength += o, this.charReceived += o, this.charBuffer.copy(this.charBuffer, o, 0, o), e.copy(this.charBuffer, 0, 0, o), t.substring(0, i)
                }
                return t
            }, u.prototype.detectIncompleteChar = function(e) {
                for (var t = e.length >= 3 ? 3 : e.length; t > 0; t--) {
                    var n = e[e.length - t];
                    if (1 == t && n >> 5 == 6) {
                        this.charLength = 2;
                        break
                    }
                    if (2 >= t && n >> 4 == 14) {
                        this.charLength = 3;
                        break
                    }
                    if (3 >= t && n >> 3 == 30) {
                        this.charLength = 4;
                        break
                    }
                }
                this.charReceived = t
            }, u.prototype.end = function(e) {
                var t = "";
                if (e && e.length && (t = this.write(e)), this.charReceived) {
                    var n = this.charReceived,
                        r = this.charBuffer,
                        i = this.encoding;
                    t += r.slice(0, n).toString(i)
                }
                return t
            }
        }, {
            buffer: 113
        }],
        137: [function(e, t, n) {
            (function(e) {
                function n(e) {
                    return this instanceof n ? (this.buffers = e || [], void(this.length = this.buffers.reduce(function(e, t) {
                        return e + t.length
                    }, 0))) : new n(e)
                }
                t.exports = n, n.prototype.push = function() {
                    for (var t = 0; t < arguments.length; t++)
                        if (!e.isBuffer(arguments[t])) throw new TypeError("Tried to push a non-buffer");
                    for (var t = 0; t < arguments.length; t++) {
                        var n = arguments[t];
                        this.buffers.push(n), this.length += n.length
                    }
                    return this.length
                }, n.prototype.unshift = function() {
                    for (var t = 0; t < arguments.length; t++)
                        if (!e.isBuffer(arguments[t])) throw new TypeError("Tried to unshift a non-buffer");
                    for (var t = 0; t < arguments.length; t++) {
                        var n = arguments[t];
                        this.buffers.unshift(n), this.length += n.length
                    }
                    return this.length
                }, n.prototype.copy = function(e, t, n, r) {
                    return this.slice(n, r).copy(e, t, 0, r - n)
                }, n.prototype.splice = function(t, r) {
                    var i = this.buffers,
                        o = t >= 0 ? t : this.length - t,
                        a = [].slice.call(arguments, 2);
                    void 0 === r ? r = this.length - o : r > this.length - o && (r = this.length - o);
                    for (var t = 0; t < a.length; t++) this.length += a[t].length;
                    for (var s = new n, c = 0, u = 0; u < i.length && c + i[u].length < o; u++) c += i[u].length;
                    if (o - c > 0) {
                        var l = o - c;
                        if (l + r < i[u].length) {
                            s.push(i[u].slice(l, l + r));
                            for (var f = i[u], h = new e(l), t = 0; l > t; t++) h[t] = f[t];
                            for (var d = new e(f.length - l - r), t = l + r; t < f.length; t++) d[t - r - l] = f[t];
                            if (a.length > 0) {
                                var p = a.slice();
                                p.unshift(h), p.push(d), i.splice.apply(i, [u, 1].concat(p)), u += p.length, a = []
                            } else i.splice(u, 1, h, d), u += 2
                        } else s.push(i[u].slice(l)), i[u] = i[u].slice(0, l), u++
                    }
                    for (a.length > 0 && (i.splice.apply(i, [u, 0].concat(a)), u += a.length); s.length < r;) {
                        var m = i[u],
                            g = m.length,
                            b = Math.min(g, r - s.length);
                        b === g ? (s.push(m), i.splice(u, 1)) : (s.push(m.slice(0, b)), i[u] = i[u].slice(b))
                    }
                    return this.length -= s.length, s
                }, n.prototype.slice = function(t, n) {
                    var r = this.buffers;
                    void 0 === n && (n = this.length), void 0 === t && (t = 0), n > this.length && (n = this.length);
                    for (var i = 0, o = 0; o < r.length && i + r[o].length <= t; o++) i += r[o].length;
                    for (var a = new e(n - t), s = 0, c = o; n - t > s && c < r.length; c++) {
                        var u = r[c].length,
                            l = 0 === s ? t - i : 0,
                            f = s + u >= n - t ? Math.min(l + (n - t) - s, u) : u;
                        r[c].copy(a, s, l, f), s += f - l
                    }
                    return a
                }, n.prototype.pos = function(e) {
                    if (0 > e || e >= this.length) throw new Error("oob");
                    for (var t = e, n = 0, r = null;;) {
                        if (r = this.buffers[n], t < r.length) return {
                            buf: n,
                            offset: t
                        };
                        t -= r.length, n++
                    }
                }, n.prototype.get = function(e) {
                    var t = this.pos(e);
                    return this.buffers[t.buf].get(t.offset)
                }, n.prototype.set = function(e, t) {
                    var n = this.pos(e);
                    return this.buffers[n.buf].set(n.offset, t)
                }, n.prototype.indexOf = function(t, n) {
                    if ("string" == typeof t) t = new e(t);
                    else if (!(t instanceof e)) throw new Error("Invalid type for a search string");
                    if (!t.length) return 0;
                    if (!this.length) return -1;
                    var r, i = 0,
                        o = 0,
                        a = 0,
                        s = 0;
                    if (n) {
                        var c = this.pos(n);
                        i = c.buf, o = c.offset, s = n
                    }
                    for (;;) {
                        for (; o >= this.buffers[i].length;)
                            if (o = 0, i++, i >= this.buffers.length) return -1;
                        var u = this.buffers[i][o];
                        if (u == t[a]) {
                            if (0 == a && (r = {
                                    i: i,
                                    j: o,
                                    pos: s
                                }), a++, a == t.length) return r.pos
                        } else 0 != a && (i = r.i, o = r.j, s = r.pos, a = 0);
                        o++, s++
                    }
                }, n.prototype.toBuffer = function() {
                    return this.slice()
                }, n.prototype.toString = function(e, t, n) {
                    return this.slice(t, n).toString(e)
                }
            }).call(this, e("buffer").Buffer)
        }, {
            buffer: 113
        }],
        138: [function(e, t, n) {
            function r(e) {
                var t = this,
                    n = h.call(arguments, 1);
                return new Promise(function(r, o) {
                    function a(t) {
                        var n;
                        try {
                            n = e.next(t)
                        } catch (r) {
                            return o(r)
                        }
                        u(n)
                    }

                    function s(t) {
                        var n;
                        try {
                            n = e["throw"](t)
                        } catch (r) {
                            return o(r)
                        }
                        u(n)
                    }

                    function u(e) {
                        if (e.done) return r(e.value);
                        var n = i.call(t, e.value);
                        return n && c(n) ? n.then(a, s) : s(new TypeError('You may only yield a function, promise, generator, array, or object, but the following object was passed: "' + String(e.value) + '"'))
                    }
                    return "function" == typeof e && (e = e.apply(t, n)), e && "function" == typeof e.next ? void a() : r(e)
                })
            }

            function i(e) {
                return e ? c(e) ? e : l(e) || u(e) ? r.call(this, e) : "function" == typeof e ? o.call(this, e) : Array.isArray(e) ? a.call(this, e) : f(e) ? s.call(this, e) : e : e
            }

            function o(e) {
                var t = this;
                return new Promise(function(n, r) {
                    e.call(t, function(e, t) {
                        return e ? r(e) : (arguments.length > 2 && (t = h.call(arguments, 1)), void n(t))
                    })
                })
            }

            function a(e) {
                return Promise.all(e.map(i, this))
            }

            function s(e) {
                function t(e, t) {
                    n[t] = void 0, o.push(e.then(function(e) {
                        n[t] = e
                    }))
                }
                for (var n = new e.constructor, r = Object.keys(e), o = [], a = 0; a < r.length; a++) {
                    var s = r[a],
                        u = i.call(this, e[s]);
                    u && c(u) ? t(u, s) : n[s] = e[s]
                }
                return Promise.all(o).then(function() {
                    return n
                })
            }

            function c(e) {
                return "function" == typeof e.then
            }

            function u(e) {
                return "function" == typeof e.next && "function" == typeof e["throw"]
            }

            function l(e) {
                var t = e.constructor;
                return t ? "GeneratorFunction" === t.name || "GeneratorFunction" === t.displayName ? !0 : u(t.prototype) : !1
            }

            function f(e) {
                return Object == e.constructor
            }
            var h = Array.prototype.slice;
            t.exports = r["default"] = r.co = r, r.wrap = function(e) {
                function t() {
                    return r.call(this, e.apply(this, arguments))
                }
                return t.__generatorFunction__ = e, t
            }
        }, {}],
        139: [function(e, t, n) {
            function r() {
                return "WebkitAppearance" in document.documentElement.style || window.console && (console.firebug || console.exception && console.table) || navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31
            }

            function i() {
                var e = arguments,
                    t = this.useColors;
                if (e[0] = (t ? "%c" : "") + this.namespace + (t ? " %c" : " ") + e[0] + (t ? "%c " : " ") + "+" + n.humanize(this.diff), !t) return e;
                var r = "color: " + this.color;
                e = [e[0], r, "color: inherit"].concat(Array.prototype.slice.call(e, 1));
                var i = 0,
                    o = 0;
                return e[0].replace(/%[a-z%]/g, function(e) {
                    "%%" !== e && (i++, "%c" === e && (o = i))
                }), e.splice(o, 0, r), e
            }

            function o() {
                return "object" == typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments)
            }

            function a(e) {
                try {
                    null == e ? n.storage.removeItem("debug") : n.storage.debug = e
                } catch (t) {}
            }

            function s() {
                var e;
                try {
                    e = n.storage.debug
                } catch (t) {}
                return e
            }

            function c() {
                try {
                    return window.localStorage
                } catch (e) {}
            }
            n = t.exports = e("./debug"), n.log = o, n.formatArgs = i, n.save = a, n.load = s, n.useColors = r, n.storage = "undefined" != typeof chrome && "undefined" != typeof chrome.storage ? chrome.storage.local : c(), n.colors = ["lightseagreen", "forestgreen", "goldenrod", "dodgerblue", "darkorchid", "crimson"], n.formatters.j = function(e) {
                return JSON.stringify(e)
            }, n.enable(s())
        }, {
            "./debug": 140
        }],
        140: [function(e, t, n) {
            function r() {
                return n.colors[l++ % n.colors.length]
            }

            function i(e) {
                function t() {}

                function i() {
                    var e = i,
                        t = +new Date,
                        o = t - (u || t);
                    e.diff = o, e.prev = u, e.curr = t, u = t, null == e.useColors && (e.useColors = n.useColors()), null == e.color && e.useColors && (e.color = r());
                    var a = Array.prototype.slice.call(arguments);
                    a[0] = n.coerce(a[0]), "string" != typeof a[0] && (a = ["%o"].concat(a));
                    var s = 0;
                    a[0] = a[0].replace(/%([a-z%])/g, function(t, r) {
                        if ("%%" === t) return t;
                        s++;
                        var i = n.formatters[r];
                        if ("function" == typeof i) {
                            var o = a[s];
                            t = i.call(e, o), a.splice(s, 1), s--
                        }
                        return t
                    }), "function" == typeof n.formatArgs && (a = n.formatArgs.apply(e, a));
                    var c = i.log || n.log || console.log.bind(console);
                    c.apply(e, a)
                }
                t.enabled = !1, i.enabled = !0;
                var o = n.enabled(e) ? i : t;
                return o.namespace = e, o
            }

            function o(e) {
                n.save(e);
                for (var t = (e || "").split(/[\s,]+/), r = t.length, i = 0; r > i; i++) t[i] && (e = t[i].replace(/\*/g, ".*?"), "-" === e[0] ? n.skips.push(new RegExp("^" + e.substr(1) + "$")) : n.names.push(new RegExp("^" + e + "$")))
            }

            function a() {
                n.enable("")
            }

            function s(e) {
                var t, r;
                for (t = 0, r = n.skips.length; r > t; t++)
                    if (n.skips[t].test(e)) return !1;
                for (t = 0, r = n.names.length; r > t; t++)
                    if (n.names[t].test(e)) return !0;
                return !1
            }

            function c(e) {
                return e instanceof Error ? e.stack || e.message : e
            }
            n = t.exports = i, n.coerce = c, n.disable = a, n.enable = o, n.enabled = s, n.humanize = e("ms"), n.names = [], n.skips = [], n.formatters = {};
            var u, l = 0
        }, {
            ms: 141
        }],
        141: [function(e, t, n) {
            function r(e) {
                if (e = "" + e, !(e.length > 1e4)) {
                    var t = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(e);
                    if (t) {
                        var n = parseFloat(t[1]),
                            r = (t[2] || "ms").toLowerCase();
                        switch (r) {
                            case "years":
                            case "year":
                            case "yrs":
                            case "yr":
                            case "y":
                                return n * f;
                            case "days":
                            case "day":
                            case "d":
                                return n * l;
                            case "hours":
                            case "hour":
                            case "hrs":
                            case "hr":
                            case "h":
                                return n * u;
                            case "minutes":
                            case "minute":
                            case "mins":
                            case "min":
                            case "m":
                                return n * c;
                            case "seconds":
                            case "second":
                            case "secs":
                            case "sec":
                            case "s":
                                return n * s;
                            case "milliseconds":
                            case "millisecond":
                            case "msecs":
                            case "msec":
                            case "ms":
                                return n
                        }
                    }
                }
            }

            function i(e) {
                return e >= l ? Math.round(e / l) + "d" : e >= u ? Math.round(e / u) + "h" : e >= c ? Math.round(e / c) + "m" : e >= s ? Math.round(e / s) + "s" : e + "ms"
            }

            function o(e) {
                return a(e, l, "day") || a(e, u, "hour") || a(e, c, "minute") || a(e, s, "second") || e + " ms"
            }

            function a(e, t, n) {
                return t > e ? void 0 : 1.5 * t > e ? Math.floor(e / t) + " " + n : Math.ceil(e / t) + " " + n + "s"
            }
            var s = 1e3,
                c = 60 * s,
                u = 60 * c,
                l = 24 * u,
                f = 365.25 * l;
            t.exports = function(e, t) {
                return t = t || {}, "string" == typeof e ? r(e) : t["long"] ? o(e) : i(e)
            }
        }, {}],
        142: [function(e, t, n) {
            t.exports = e("./lib/ebml/index.js")
        }, {
            "./lib/ebml/index.js": 145
        }],
        143: [function(e, t, n) {
            (function(n) {
                function r(e) {
                    e = e || {}, e.readableObjectMode = !0, i.call(this, e), this._buffer = null, this._tag_stack = [], this._state = c, this._cursor = 0, this._total = 0, this._schema = a
                }
                var i = e("stream").Transform,
                    o = e("./tools.js"),
                    a = e("./schema.js"),
                    s = e("debug")("ebml:decoder"),
                    c = 1,
                    u = 2,
                    l = 3;
                e("util").inherits(r, i), r.prototype._transform = function(e, t, r) {
                    for (null === this._buffer ? this._buffer = e : this._buffer = n.concat([this._buffer, e]); this._cursor < this._buffer.length && (this._state !== c || this.readTag()) && (this._state !== u || this.readSize()) && (this._state !== l || this.readContent()););
                    r()
                }, r.prototype.getSchemaInfo = function(e) {
                    return this._schema[e] || {
                        type: "unknown",
                        name: "unknown"
                    }
                }, r.prototype.readTag = function() {
                    if (s("parsing tag"), this._cursor >= this._buffer.length) return s("waiting for more data"), !1;
                    var e = this._total,
                        t = o.readVint(this._buffer, this._cursor);
                    if (null == t) return s("waiting for more data"), !1;
                    var n = this._buffer.toString("hex", this._cursor, this._cursor + t.length);
                    this._cursor += t.length, this._total += t.length, this._state = u;
                    var r = this.getSchemaInfo(n);
                    return tagObj = {
                        tag: t.value,
                        tagStr: n,
                        type: r.type,
                        name: r.name,
                        level: r.level,
                        start: e,
                        end: e + t.length
                    }, s("read tag: " + n), tagObj.level >= 0 && this.closeTags(tagObj.level), this._tag_stack.push(tagObj), !0
                }, r.prototype.readSize = function() {
                    var e = this._tag_stack[this._tag_stack.length - 1];
                    if (s("parsing size for tag: " + e.tagStr), this._cursor >= this._buffer.length) return s("waiting for more data"), !1;
                    var t = o.readVint(this._buffer, this._cursor);
                    return null == t ? (s("waiting for more data"), !1) : (this._cursor += t.length, this._total += t.length, this._state = l, e.dataSize = t.value, -1 === t.value ? e.end = -1 : e.end += t.value + t.length, s("read size: " + t.value), !0)
                }, r.prototype.closeTags = function(e) {
                    for ("undefined" == typeof e && (e = Number.MAX_VALUE); this._tag_stack.length > 0;) {
                        var t = this._tag_stack[this._tag_stack.length - 1];
                        if (t.end < 0 && t.level < e || this._total < t.end) return;
                        this.push(["end", t]), this._tag_stack.pop()
                    }
                }, r.prototype.readContent = function() {
                    var e = this._tag_stack[this._tag_stack.length - 1];
                    if (s("parsing content for tag: " + e.tagStr), "m" === e.type) return s("content should be tags"), this.push(["start", e]), this._state = c, this.closeTags(), !0;
                    if (this._buffer.length < this._cursor + e.dataSize) return s("got: " + this._buffer.length), s("need: " + (this._cursor + e.dataSize)), s("waiting for more data"), !1;
                    var t = this._buffer.slice(this._cursor, this._cursor + e.dataSize);
                    return this._total += e.dataSize, this._state = c, this._buffer = this._buffer.slice(this._cursor + e.dataSize), this._cursor = 0, this._tag_stack.pop(), e.data = t, this.push(["tag", e]), this.closeTags(), !0
                }, r.prototype._flush = function() {
                    for (; this._tag_stack.length;) {
                        var e = this._tag_stack.pop();
                        this.push(["end", e])
                    }
                    this.push(null)
                }, t.exports = r
            }).call(this, e("buffer").Buffer)
        }, {
            "./schema.js": 146,
            "./tools.js": 147,
            buffer: 113,
            debug: 149,
            stream: 135,
            util: 153
        }],
        144: [function(e, t, n) {
            (function(n) {
                function r(e) {
                    e = e || {}, e.writableObjectMode = !0, i.call(this, e), this._schema = a, this._buffer = null, this._corked = !1, this._stack = []
                }
                var i = e("stream").Transform,
                    o = e("./tools.js"),
                    a = e("./schema.js"),
                    s = e("debug")("ebml:encoder"),
                    c = e("buffers");
                e("util").inherits(r, i), r.prototype._transform = function(e, t, n) {
                    s("encode " + e[0] + " " + e[1].name), "start" === e[0] ? this.startTag(e[1].name) : "tag" === e[0] ? this.writeTag(e[1].name, e[1].data) : "end" === e[0] && this.endTag(e[1].name), n()
                }, r.prototype._flush = function(e) {
                    if (e = e || function() {}, !this._buffer || this._corked) return s("no buffer/nothing pending"), void e();
                    s("writing " + this._buffer.length + " bytes");
                    var t = this._buffer.toBuffer();
                    this._buffer = null, this.push(t), e()
                }, r.prototype._bufferAndFlush = function(e) {
                    this._buffer ? this._buffer.push(e) : this._buffer = c([e]), this._flush()
                }, r.prototype.getSchemaInfo = function(e) {
                    for (var t = Object.keys(this._schema), r = 0; r < t.length; r++) {
                        var i = t[r];
                        if (this._schema[i].name === e) return new n(i, "hex")
                    }
                    return null
                }, r.prototype.cork = function() {
                    this._corked = !0
                }, r.prototype.uncork = function() {
                    this._corked = !1, this._flush()
                }, r.prototype._encodeTag = function(e, t) {
                    return c([e, o.writeVint(t.length), t])
                }, r.prototype.writeTag = function(e, t) {
                    var n = this.getSchemaInfo(e);
                    if (!n) throw new Error("No schema entry found for " + e);
                    var r = this._encodeTag(n, t);
                    this._stack.length > 0 ? this._stack[this._stack.length - 1].children.push({
                        data: r
                    }) : this._bufferAndFlush(r.toBuffer())
                }, r.prototype.startTag = function(e) {
                    var t = this.getSchemaInfo(e);
                    if (!t) throw new Error("No schema entry found for " + e);
                    var n = {
                        id: t,
                        name: e,
                        children: []
                    };
                    this._stack.length > 0 && this._stack[this._stack.length - 1].children.push(n), this._stack.push(n)
                }, r.prototype.endTag = function(e) {
                    var t = this._stack.pop(),
                        n = t.children.map(function(e) {
                            return e.data
                        });
                    t.data = this._encodeTag(t.id, c(n)), this._stack.length < 1 && this._bufferAndFlush(t.data.toBuffer())
                }, t.exports = r
            }).call(this, e("buffer").Buffer)
        }, {
            "./schema.js": 146,
            "./tools.js": 147,
            buffer: 113,
            buffers: 148,
            debug: 149,
            stream: 135,
            util: 153
        }],
        145: [function(e, t, n) {
            t.exports = {
                tools: e("./tools.js"),
                schema: e("./schema.js"),
                Decoder: e("./decoder.js"),
                Encoder: e("./encoder.js")
            }
        }, {
            "./decoder.js": 143,
            "./encoder.js": 144,
            "./schema.js": 146,
            "./tools.js": 147
        }],
        146: [function(e, t, n) {
            var r = {
                80: {
                    name: "ChapterDisplay",
                    level: "4",
                    type: "m",
                    multiple: "1",
                    minver: "1",
                    webm: "1",
                    description: "Contains all possible strings to use for the chapter display."
                },
                83: {
                    name: "TrackType",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    range: "1-254",
                    description: "A set of track types coded on 8 bits (1: video, 2: audio, 3: complex, 0x10: logo, 0x11: subtitle, 0x12: buttons, 0x20: control)."
                },
                85: {
                    name: "ChapString",
                    cppname: "ChapterString",
                    level: "5",
                    type: "8",
                    mandatory: "1",
                    minver: "1",
                    webm: "1",
                    description: "Contains the string to use as the chapter atom."
                },
                86: {
                    name: "CodecID",
                    level: "3",
                    type: "s",
                    mandatory: "1",
                    minver: "1",
                    description: "An ID corresponding to the codec, see the codec page for more info."
                },
                88: {
                    name: "FlagDefault",
                    cppname: "TrackFlagDefault",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    "default": "1",
                    range: "0-1",
                    description: "Set if that track (audio, video or subs) SHOULD be active if no language found matches the user preference. (1 bit)"
                },
                89: {
                    name: "ChapterTrackNumber",
                    level: "5",
                    type: "u",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    range: "not 0",
                    description: "UID of the Track to apply this chapter too. In the absense of a control track, choosing this chapter will select the listed Tracks and deselect unlisted tracks. Absense of this element indicates that the Chapter should be applied to any currently used Tracks."
                },
                91: {
                    name: "ChapterTimeStart",
                    level: "4",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "1",
                    description: "Timestamp of the start of Chapter (not scaled)."
                },
                92: {
                    name: "ChapterTimeEnd",
                    level: "4",
                    type: "u",
                    minver: "1",
                    webm: "0",
                    description: "Timestamp of the end of Chapter (timestamp excluded, not scaled)."
                },
                96: {
                    name: "CueRefTime",
                    level: "5",
                    type: "u",
                    mandatory: "1",
                    minver: "2",
                    webm: "0",
                    description: "Timestamp of the referenced Block."
                },
                97: {
                    name: "CueRefCluster",
                    level: "5",
                    type: "u",
                    mandatory: "1",
                    webm: "0",
                    description: "The Position of the Cluster containing the referenced Block."
                },
                98: {
                    name: "ChapterFlagHidden",
                    level: "4",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    range: "0-1",
                    description: "If a chapter is hidden (1), it should not be available to the user interface (but still to Control Tracks; see flag notes). (1 bit)"
                },
                4254: {
                    name: "ContentCompAlgo",
                    level: "6",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    br: ["", "", "", ""],
                    del: ["1 - bzlib,", "2 - lzo1x"],
                    description: "The compression algorithm used. Algorithms that have been specified so far are: 0 - zlib,   3 - Header Stripping"
                },
                4255: {
                    name: "ContentCompSettings",
                    level: "6",
                    type: "b",
                    minver: "1",
                    webm: "0",
                    description: "Settings that might be needed by the decompressor. For Header Stripping (ContentCompAlgo=3), the bytes that were removed from the beggining of each frames of the track."
                },
                4282: {
                    name: "DocType",
                    level: "1",
                    type: "s",
                    mandatory: "1",
                    "default": "matroska",
                    minver: "1",
                    description: "A string that describes the type of document that follows this EBML header. 'matroska' in our case or 'webm' for webm files."
                },
                4285: {
                    name: "DocTypeReadVersion",
                    level: "1",
                    type: "u",
                    mandatory: "1",
                    "default": "1",
                    minver: "1",
                    description: "The minimum DocType version an interpreter has to support to read this file."
                },
                4286: {
                    name: "EBMLVersion",
                    level: "1",
                    type: "u",
                    mandatory: "1",
                    "default": "1",
                    minver: "1",
                    description: "The version of EBML parser used to create the file."
                },
                4287: {
                    name: "DocTypeVersion",
                    level: "1",
                    type: "u",
                    mandatory: "1",
                    "default": "1",
                    minver: "1",
                    description: "The version of DocType interpreter used to create the file."
                },
                4444: {
                    name: "SegmentFamily",
                    level: "2",
                    type: "b",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    bytesize: "16",
                    description: "A randomly generated unique ID that all segments related to each other must use (128 bits)."
                },
                4461: {
                    name: "DateUTC",
                    level: "2",
                    type: "d",
                    minver: "1",
                    description: "Date of the origin of timestamp (value 0), i.e. production date."
                },
                4484: {
                    name: "TagDefault",
                    level: "4",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "1",
                    range: "0-1",
                    description: "Indication to know if this is the default/original language to use for the given tag. (1 bit)"
                },
                4485: {
                    name: "TagBinary",
                    level: "4",
                    type: "b",
                    minver: "1",
                    webm: "0",
                    description: "The values of the Tag if it is binary. Note that this cannot be used in the same SimpleTag as TagString."
                },
                4487: {
                    name: "TagString",
                    level: "4",
                    type: "8",
                    minver: "1",
                    webm: "0",
                    description: "The value of the Tag."
                },
                4489: {
                    name: "Duration",
                    level: "2",
                    type: "f",
                    minver: "1",
                    range: "> 0",
                    description: "Duration of the segment (based on TimecodeScale)."
                },
                4598: {
                    name: "ChapterFlagEnabled",
                    level: "4",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "1",
                    range: "0-1",
                    description: "Specify wether the chapter is enabled. It can be enabled/disabled by a Control Track. When disabled, the movie should skip all the content between the TimeStart and TimeEnd of this chapter (see flag notes). (1 bit)"
                },
                4660: {
                    name: "FileMimeType",
                    level: "3",
                    type: "s",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    description: "MIME type of the file."
                },
                4661: {
                    name: "FileUsedStartTime",
                    level: "3",
                    type: "u",
                    divx: "1",
                    description: "DivX font extension"
                },
                4662: {
                    name: "FileUsedEndTime",
                    level: "3",
                    type: "u",
                    divx: "1",
                    description: "DivX font extension"
                },
                4675: {
                    name: "FileReferral",
                    level: "3",
                    type: "b",
                    webm: "0",
                    description: "A binary value that a track/codec can refer to when the attachment is needed."
                },
                5031: {
                    name: "ContentEncodingOrder",
                    level: "5",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    description: "Tells when this modification was used during encoding/muxing starting with 0 and counting upwards. The decoder/demuxer has to start with the highest order number it finds and work its way down. This value has to be unique over all ContentEncodingOrder elements in the segment."
                },
                5032: {
                    name: "ContentEncodingScope",
                    level: "5",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "1",
                    range: "not 0",
                    br: ["", "", ""],
                    description: "A bit field that describes which elements have been modified in this way. Values (big endian) can be OR'ed. Possible values: 1 - all frame contents, 2 - the track's private data, 4 - the next ContentEncoding (next ContentEncodingOrder. Either the data inside ContentCompression and/or ContentEncryption)"
                },
                5033: {
                    name: "ContentEncodingType",
                    level: "5",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    br: ["", ""],
                    description: "A value describing what kind of transformation has been done. Possible values: 0 - compression, 1 - encryption"
                },
                5034: {
                    name: "ContentCompression",
                    level: "5",
                    type: "m",
                    minver: "1",
                    webm: "0",
                    description: "Settings describing the compression used. Must be present if the value of ContentEncodingType is 0 and absent otherwise. Each block must be decompressable even if no previous block is available in order not to prevent seeking."
                },
                5035: {
                    name: "ContentEncryption",
                    level: "5",
                    type: "m",
                    minver: "1",
                    webm: "0",
                    description: "Settings describing the encryption used. Must be present if the value of ContentEncodingType is 1 and absent otherwise."
                },
                5378: {
                    name: "CueBlockNumber",
                    level: "4",
                    type: "u",
                    minver: "1",
                    "default": "1",
                    range: "not 0",
                    description: "Number of the Block in the specified Cluster."
                },
                5654: {
                    name: "ChapterStringUID",
                    level: "4",
                    type: "8",
                    mandatory: "0",
                    minver: "3",
                    webm: "1",
                    description: "A unique string ID to identify the Chapter. Use for WebVTT cue identifier storage."
                },
                5741: {
                    name: "WritingApp",
                    level: "2",
                    type: "8",
                    mandatory: "1",
                    minver: "1",
                    description: 'Writing application ("mkvmerge-0.3.3").'
                },
                5854: {
                    name: "SilentTracks",
                    cppname: "ClusterSilentTracks",
                    level: "2",
                    type: "m",
                    minver: "1",
                    webm: "0",
                    description: "The list of tracks that are not used in that part of the stream. It is useful when using overlay tracks on seeking. Then you should decide what track to use."
                },
                6240: {
                    name: "ContentEncoding",
                    level: "4",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "Settings for one content encoding like compression or encryption."
                },
                6264: {
                    name: "BitDepth",
                    cppname: "AudioBitDepth",
                    level: "4",
                    type: "u",
                    minver: "1",
                    range: "not 0",
                    description: "Bits per sample, mostly used for PCM."
                },
                6532: {
                    name: "SignedElement",
                    level: "3",
                    type: "b",
                    multiple: "1",
                    webm: "0",
                    description: "An element ID whose data will be used to compute the signature."
                },
                6624: {
                    name: "TrackTranslate",
                    level: "3",
                    type: "m",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "The track identification for the given Chapter Codec."
                },
                6911: {
                    name: "ChapProcessCommand",
                    cppname: "ChapterProcessCommand",
                    level: "5",
                    type: "m",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "Contains all the commands associated to the Atom."
                },
                6922: {
                    name: "ChapProcessTime",
                    cppname: "ChapterProcessTime",
                    level: "6",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    description: "Defines when the process command should be handled (0: during the whole chapter, 1: before starting playback, 2: after playback of the chapter)."
                },
                6924: {
                    name: "ChapterTranslate",
                    level: "2",
                    type: "m",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "A tuple of corresponding ID used by chapter codecs to represent this segment."
                },
                6933: {
                    name: "ChapProcessData",
                    cppname: "ChapterProcessData",
                    level: "6",
                    type: "b",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    description: "Contains the command information. The data should be interpreted depending on the ChapProcessCodecID value. For ChapProcessCodecID = 1, the data correspond to the binary DVD cell pre/post commands."
                },
                6944: {
                    name: "ChapProcess",
                    cppname: "ChapterProcess",
                    level: "4",
                    type: "m",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "Contains all the commands associated to the Atom."
                },
                6955: {
                    name: "ChapProcessCodecID",
                    cppname: "ChapterProcessCodecID",
                    level: "5",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    description: "Contains the type of the codec used for the processing. A value of 0 means native Matroska processing (to be defined), a value of 1 means the DVD command set is used. More codec IDs can be added later."
                },
                7373: {
                    name: "Tag",
                    level: "2",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "Element containing elements specific to Tracks/Chapters."
                },
                7384: {
                    name: "SegmentFilename",
                    level: "2",
                    type: "8",
                    minver: "1",
                    webm: "0",
                    description: "A filename corresponding to this segment."
                },
                7446: {
                    name: "AttachmentLink",
                    cppname: "TrackAttachmentLink",
                    level: "3",
                    type: "u",
                    minver: "1",
                    webm: "0",
                    range: "not 0",
                    description: "The UID of an attachment that is used by this codec."
                },
                258688: {
                    name: "CodecName",
                    level: "3",
                    type: "8",
                    minver: "1",
                    description: "A human-readable string specifying the codec."
                },
                18538067: {
                    name: "Segment",
                    level: "0",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    description: "This element contains all other top-level (level 1) elements. Typically a Matroska file is composed of 1 segment."
                },
                "447a": {
                    name: "TagLanguage",
                    level: "4",
                    type: "s",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "und",
                    description: "Specifies the language of the tag specified, in the Matroska languages form."
                },
                "45a3": {
                    name: "TagName",
                    level: "4",
                    type: "8",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    description: "The name of the Tag that is going to be stored."
                },
                "67c8": {
                    name: "SimpleTag",
                    cppname: "TagSimple",
                    level: "3",
                    recursive: "1",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "Contains general information about the target."
                },
                "63c6": {
                    name: "TagAttachmentUID",
                    level: "4",
                    type: "u",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    description: "A unique ID to identify the Attachment(s) the tags belong to. If the value is 0 at this level, the tags apply to all the attachments in the Segment."
                },
                "63c4": {
                    name: "TagChapterUID",
                    level: "4",
                    type: "u",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    description: "A unique ID to identify the Chapter(s) the tags belong to. If the value is 0 at this level, the tags apply to all chapters in the Segment."
                },
                "63c9": {
                    name: "TagEditionUID",
                    level: "4",
                    type: "u",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    description: "A unique ID to identify the EditionEntry(s) the tags belong to. If the value is 0 at this level, the tags apply to all editions in the Segment."
                },
                "63c5": {
                    name: "TagTrackUID",
                    level: "4",
                    type: "u",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    description: "A unique ID to identify the Track(s) the tags belong to. If the value is 0 at this level, the tags apply to all tracks in the Segment."
                },
                "63ca": {
                    name: "TargetType",
                    cppname: "TagTargetType",
                    level: "4",
                    type: "s",
                    minver: "1",
                    webm: "0",
                    strong: "informational",
                    description: 'An  string that can be used to display the logical level of the target like "ALBUM", "TRACK", "MOVIE", "CHAPTER", etc (see TargetType).'
                },
                "68ca": {
                    name: "TargetTypeValue",
                    cppname: "TagTargetTypeValue",
                    level: "4",
                    type: "u",
                    minver: "1",
                    webm: "0",
                    "default": "50",
                    description: "A number to indicate the logical level of the target (see TargetType)."
                },
                "63c0": {
                    name: "Targets",
                    cppname: "TagTargets",
                    level: "3",
                    type: "m",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    description: "Contain all UIDs where the specified meta data apply. It is empty to describe everything in the segment."
                },
                "1254c367": {
                    name: "Tags",
                    level: "1",
                    type: "m",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "Element containing elements specific to Tracks/Chapters. A list of valid tags can be found here."
                },
                "450d": {
                    name: "ChapProcessPrivate",
                    cppname: "ChapterProcessPrivate",
                    level: "5",
                    type: "b",
                    minver: "1",
                    webm: "0",
                    description: 'Some optional data attached to the ChapProcessCodecID information. For ChapProcessCodecID = 1, it is the "DVD level" equivalent.'
                },
                "437e": {
                    name: "ChapCountry",
                    cppname: "ChapterCountry",
                    level: "5",
                    type: "s",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "The countries corresponding to the string, same 2 octets as in Internet domains."
                },
                "437c": {
                    name: "ChapLanguage",
                    cppname: "ChapterLanguage",
                    level: "5",
                    type: "s",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    webm: "1",
                    "default": "eng",
                    description: "The languages corresponding to the string, in the bibliographic ISO-639-2 form."
                },
                "8f": {
                    name: "ChapterTrack",
                    level: "4",
                    type: "m",
                    minver: "1",
                    webm: "0",
                    description: "List of tracks on which the chapter applies. If this element is not present, all tracks apply"
                },
                "63c3": {
                    name: "ChapterPhysicalEquiv",
                    level: "4",
                    type: "u",
                    minver: "1",
                    webm: "0",
                    description: 'Specify the physical equivalent of this ChapterAtom like "DVD" (60) or "SIDE" (50), see complete list of values.'
                },
                "6ebc": {
                    name: "ChapterSegmentEditionUID",
                    level: "4",
                    type: "u",
                    minver: "1",
                    webm: "0",
                    range: "not 0",
                    description: "The EditionUID to play from the segment linked in ChapterSegmentUID."
                },
                "6e67": {
                    name: "ChapterSegmentUID",
                    level: "4",
                    type: "b",
                    minver: "1",
                    webm: "0",
                    range: ">0",
                    bytesize: "16",
                    description: "A segment to play in place of this chapter. Edition ChapterSegmentEditionUID should be used for this segment, otherwise no edition is used."
                },
                "73c4": {
                    name: "ChapterUID",
                    level: "4",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "1",
                    range: "not 0",
                    description: "A unique ID to identify the Chapter."
                },
                b6: {
                    name: "ChapterAtom",
                    level: "3",
                    recursive: "1",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    webm: "1",
                    description: "Contains the atom information to use as the chapter atom (apply to all tracks)."
                },
                "45dd": {
                    name: "EditionFlagOrdered",
                    level: "3",
                    type: "u",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    range: "0-1",
                    description: "Specify if the chapters can be defined multiple times and the order to play them is enforced. (1 bit)"
                },
                "45db": {
                    name: "EditionFlagDefault",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    range: "0-1",
                    description: "If a flag is set (1) the edition should be used as the default one. (1 bit)"
                },
                "45bd": {
                    name: "EditionFlagHidden",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    range: "0-1",
                    description: "If an edition is hidden (1), it should not be available to the user interface (but still to Control Tracks; see flag notes). (1 bit)"
                },
                "45bc": {
                    name: "EditionUID",
                    level: "3",
                    type: "u",
                    minver: "1",
                    webm: "0",
                    range: "not 0",
                    description: "A unique ID to identify the edition. It's useful for tagging an edition."
                },
                "45b9": {
                    name: "EditionEntry",
                    level: "2",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    webm: "1",
                    description: "Contains all information about a segment edition."
                },
                "1043a770": {
                    name: "Chapters",
                    level: "1",
                    type: "m",
                    minver: "1",
                    webm: "1",
                    description: "A system to define basic menus and partition data. For more detailed information, look at the Chapters Explanation."
                },
                "46ae": {
                    name: "FileUID",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    range: "not 0",
                    description: "Unique ID representing the file, as random as possible."
                },
                "465c": {
                    name: "FileData",
                    level: "3",
                    type: "b",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    description: "The data of the file."
                },
                "466e": {
                    name: "FileName",
                    level: "3",
                    type: "8",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    description: "Filename of the attached file."
                },
                "467e": {
                    name: "FileDescription",
                    level: "3",
                    type: "8",
                    minver: "1",
                    webm: "0",
                    description: "A human-friendly name for the attached file."
                },
                "61a7": {
                    name: "AttachedFile",
                    level: "2",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "An attached file."
                },
                "1941a469": {
                    name: "Attachments",
                    level: "1",
                    type: "m",
                    minver: "1",
                    webm: "0",
                    description: "Contain attached files."
                },
                eb: {
                    name: "CueRefCodecState",
                    level: "5",
                    type: "u",
                    webm: "0",
                    "default": "0",
                    description: "The position of the Codec State corresponding to this referenced element. 0 means that the data is taken from the initial Track Entry."
                },
                "535f": {
                    name: "CueRefNumber",
                    level: "5",
                    type: "u",
                    webm: "0",
                    "default": "1",
                    range: "not 0",
                    description: "Number of the referenced Block of Track X in the specified Cluster."
                },
                db: {
                    name: "CueReference",
                    level: "4",
                    type: "m",
                    multiple: "1",
                    minver: "2",
                    webm: "0",
                    description: "The Clusters containing the required referenced Blocks."
                },
                ea: {
                    name: "CueCodecState",
                    level: "4",
                    type: "u",
                    minver: "2",
                    webm: "0",
                    "default": "0",
                    description: "The position of the Codec State corresponding to this Cue element. 0 means that the data is taken from the initial Track Entry."
                },
                b2: {
                    name: "CueDuration",
                    level: "4",
                    type: "u",
                    mandatory: "0",
                    minver: "4",
                    webm: "0",
                    description: "The duration of the block according to the segment time base. If missing the track's DefaultDuration does not apply and no duration information is available in terms of the cues."
                },
                f0: {
                    name: "CueRelativePosition",
                    level: "4",
                    type: "u",
                    mandatory: "0",
                    minver: "4",
                    webm: "0",
                    description: "The relative position of the referenced block inside the cluster with 0 being the first possible position for an element inside that cluster."
                },
                f1: {
                    name: "CueClusterPosition",
                    level: "4",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    description: "The position of the Cluster containing the required Block."
                },
                f7: {
                    name: "CueTrack",
                    level: "4",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    range: "not 0",
                    description: "The track for which a position is given."
                },
                b7: {
                    name: "CueTrackPositions",
                    level: "3",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    description: "Contain positions for different tracks corresponding to the timestamp."
                },
                b3: {
                    name: "CueTime",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    description: "Absolute timestamp according to the segment time base."
                },
                bb: {
                    name: "CuePoint",
                    level: "2",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    description: "Contains all information relative to a seek point in the segment."
                },
                "1c53bb6b": {
                    name: "Cues",
                    level: "1",
                    type: "m",
                    minver: "1",
                    description: 'A top-level element to speed seeking access. All entries are local to the segment. Should be mandatory for non "live" streams.'
                },
                "47e6": {
                    name: "ContentSigHashAlgo",
                    level: "6",
                    type: "u",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    br: ["", ""],
                    description: "The hash algorithm used for the signature. A value of '0' means that the contents have not been signed but only encrypted. Predefined values: 1 - SHA1-160 2 - MD5"
                },
                "47e5": {
                    name: "ContentSigAlgo",
                    level: "6",
                    type: "u",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    br: "",
                    description: "The algorithm used for the signature. A value of '0' means that the contents have not been signed but only encrypted. Predefined values: 1 - RSA"
                },
                "47e4": {
                    name: "ContentSigKeyID",
                    level: "6",
                    type: "b",
                    minver: "1",
                    webm: "0",
                    description: "This is the ID of the private key the data was signed with."
                },
                "47e3": {
                    name: "ContentSignature",
                    level: "6",
                    type: "b",
                    minver: "1",
                    webm: "0",
                    description: "A cryptographic signature of the contents."
                },
                "47e2": {
                    name: "ContentEncKeyID",
                    level: "6",
                    type: "b",
                    minver: "1",
                    webm: "0",
                    description: "For public key algorithms this is the ID of the public key the the data was encrypted with."
                },
                "47e1": {
                    name: "ContentEncAlgo",
                    level: "6",
                    type: "u",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    br: "",
                    description: "The encryption algorithm used. The value '0' means that the contents have not been encrypted but only signed. Predefined values: 1 - DES, 2 - 3DES, 3 - Twofish, 4 - Blowfish, 5 - AES"
                },
                "6d80": {
                    name: "ContentEncodings",
                    level: "3",
                    type: "m",
                    minver: "1",
                    webm: "0",
                    description: "Settings for several content encoding mechanisms like compression or encryption."
                },
                c4: {
                    name: "TrickMasterTrackSegmentUID",
                    level: "3",
                    type: "b",
                    divx: "1",
                    bytesize: "16",
                    description: "DivX trick track extenstions"
                },
                c7: {
                    name: "TrickMasterTrackUID",
                    level: "3",
                    type: "u",
                    divx: "1",
                    description: "DivX trick track extenstions"
                },
                c6: {
                    name: "TrickTrackFlag",
                    level: "3",
                    type: "u",
                    divx: "1",
                    "default": "0",
                    description: "DivX trick track extenstions"
                },
                c1: {
                    name: "TrickTrackSegmentUID",
                    level: "3",
                    type: "b",
                    divx: "1",
                    bytesize: "16",
                    description: "DivX trick track extenstions"
                },
                c0: {
                    name: "TrickTrackUID",
                    level: "3",
                    type: "u",
                    divx: "1",
                    description: "DivX trick track extenstions"
                },
                ed: {
                    name: "TrackJoinUID",
                    level: "5",
                    type: "u",
                    mandatory: "1",
                    multiple: "1",
                    minver: "3",
                    webm: "0",
                    range: "not 0",
                    description: "The trackUID number of a track whose blocks are used to create this virtual track."
                },
                e9: {
                    name: "TrackJoinBlocks",
                    level: "4",
                    type: "m",
                    minver: "3",
                    webm: "0",
                    description: "Contains the list of all tracks whose Blocks need to be combined to create this virtual track"
                },
                e6: {
                    name: "TrackPlaneType",
                    level: "6",
                    type: "u",
                    mandatory: "1",
                    minver: "3",
                    webm: "0",
                    description: "The kind of plane this track corresponds to (0: left eye, 1: right eye, 2: background)."
                },
                e5: {
                    name: "TrackPlaneUID",
                    level: "6",
                    type: "u",
                    mandatory: "1",
                    minver: "3",
                    webm: "0",
                    range: "not 0",
                    description: "The trackUID number of the track representing the plane."
                },
                e4: {
                    name: "TrackPlane",
                    level: "5",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "3",
                    webm: "0",
                    description: "Contains a video plane track that need to be combined to create this 3D track"
                },
                e3: {
                    name: "TrackCombinePlanes",
                    level: "4",
                    type: "m",
                    minver: "3",
                    webm: "0",
                    description: "Contains the list of all video plane tracks that need to be combined to create this 3D track"
                },
                e2: {
                    name: "TrackOperation",
                    level: "3",
                    type: "m",
                    minver: "3",
                    webm: "0",
                    description: "Operation that needs to be applied on tracks to create this virtual track. For more details look at the Specification Notes on the subject."
                },
                "7d7b": {
                    name: "ChannelPositions",
                    cppname: "AudioPosition",
                    level: "4",
                    type: "b",
                    webm: "0",
                    description: "Table of horizontal angles for each successive channel, see appendix."
                },
                "9f": {
                    name: "Channels",
                    cppname: "AudioChannels",
                    level: "4",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    "default": "1",
                    range: "not 0",
                    description: "Numbers of channels in the track."
                },
                "78b5": {
                    name: "OutputSamplingFrequency",
                    cppname: "AudioOutputSamplingFreq",
                    level: "4",
                    type: "f",
                    minver: "1",
                    "default": "Sampling Frequency",
                    range: "> 0",
                    description: "Real output sampling frequency in Hz (used for SBR techniques)."
                },
                b5: {
                    name: "SamplingFrequency",
                    cppname: "AudioSamplingFreq",
                    level: "4",
                    type: "f",
                    mandatory: "1",
                    minver: "1",
                    "default": "8000.0",
                    range: "> 0",
                    description: "Sampling frequency in Hz."
                },
                e1: {
                    name: "Audio",
                    cppname: "TrackAudio",
                    level: "3",
                    type: "m",
                    minver: "1",
                    description: "Audio settings."
                },
                "2383e3": {
                    name: "FrameRate",
                    cppname: "VideoFrameRate",
                    level: "4",
                    type: "f",
                    range: "> 0",
                    strong: "Informational",
                    description: "Number of frames per second.  only."
                },
                "2fb523": {
                    name: "GammaValue",
                    cppname: "VideoGamma",
                    level: "4",
                    type: "f",
                    webm: "0",
                    range: "> 0",
                    description: "Gamma Value."
                },
                "2eb524": {
                    name: "ColourSpace",
                    cppname: "VideoColourSpace",
                    level: "4",
                    type: "b",
                    minver: "1",
                    webm: "0",
                    bytesize: "4",
                    description: "Same value as in AVI (32 bits)."
                },
                "54b3": {
                    name: "AspectRatioType",
                    cppname: "VideoAspectRatio",
                    level: "4",
                    type: "u",
                    minver: "1",
                    "default": "0",
                    description: "Specify the possible modifications to the aspect ratio (0: free resizing, 1: keep aspect ratio, 2: fixed)."
                },
                "54b2": {
                    name: "DisplayUnit",
                    cppname: "VideoDisplayUnit",
                    level: "4",
                    type: "u",
                    minver: "1",
                    "default": "0",
                    description: "How DisplayWidth & DisplayHeight should be interpreted (0: pixels, 1: centimeters, 2: inches, 3: Display Aspect Ratio)."
                },
                "54ba": {
                    name: "DisplayHeight",
                    cppname: "VideoDisplayHeight",
                    level: "4",
                    type: "u",
                    minver: "1",
                    "default": "PixelHeight",
                    range: "not 0",
                    description: "Height of the video frames to display. The default value is only valid when DisplayUnit is 0."
                },
                "54b0": {
                    name: "DisplayWidth",
                    cppname: "VideoDisplayWidth",
                    level: "4",
                    type: "u",
                    minver: "1",
                    "default": "PixelWidth",
                    range: "not 0",
                    description: "Width of the video frames to display. The default value is only valid when DisplayUnit is 0."
                },
                "54dd": {
                    name: "PixelCropRight",
                    cppname: "VideoPixelCropRight",
                    level: "4",
                    type: "u",
                    minver: "1",
                    "default": "0",
                    description: "The number of video pixels to remove on the right of the image."
                },
                "54cc": {
                    name: "PixelCropLeft",
                    cppname: "VideoPixelCropLeft",
                    level: "4",
                    type: "u",
                    minver: "1",
                    "default": "0",
                    description: "The number of video pixels to remove on the left of the image."
                },
                "54bb": {
                    name: "PixelCropTop",
                    cppname: "VideoPixelCropTop",
                    level: "4",
                    type: "u",
                    minver: "1",
                    "default": "0",
                    description: "The number of video pixels to remove at the top of the image."
                },
                "54aa": {
                    name: "PixelCropBottom",
                    cppname: "VideoPixelCropBottom",
                    level: "4",
                    type: "u",
                    minver: "1",
                    "default": "0",
                    description: "The number of video pixels to remove at the bottom of the image (for HDTV content)."
                },
                ba: {
                    name: "PixelHeight",
                    cppname: "VideoPixelHeight",
                    level: "4",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    range: "not 0",
                    description: "Height of the encoded video frames in pixels."
                },
                b0: {
                    name: "PixelWidth",
                    cppname: "VideoPixelWidth",
                    level: "4",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    range: "not 0",
                    description: "Width of the encoded video frames in pixels."
                },
                "53b9": {
                    name: "OldStereoMode",
                    level: "4",
                    type: "u",
                    maxver: "0",
                    webm: "0",
                    divx: "0",
                    description: "DEPRECATED, DO NOT USE. Bogus StereoMode value used in old versions of libmatroska. (0: mono, 1: right eye, 2: left eye, 3: both eyes)."
                },
                "53c0": {
                    name: "AlphaMode",
                    cppname: "VideoAlphaMode",
                    level: "4",
                    type: "u",
                    minver: "3",
                    webm: "1",
                    "default": "0",
                    description: "Alpha Video Mode. Presence of this element indicates that the BlockAdditional element could contain Alpha data."
                },
                "53b8": {
                    name: "StereoMode",
                    cppname: "VideoStereoMode",
                    level: "4",
                    type: "u",
                    minver: "3",
                    webm: "1",
                    "default": "0",
                    description: "Stereo-3D video mode (0: mono, 1: side by side (left eye is first), 2: top-bottom (right eye is first), 3: top-bottom (left eye is first), 4: checkboard (right is first), 5: checkboard (left is first), 6: row interleaved (right is first), 7: row interleaved (left is first), 8: column interleaved (right is first), 9: column interleaved (left is first), 10: anaglyph (cyan/red), 11: side by side (right eye is first), 12: anaglyph (green/magenta), 13 both eyes laced in one Block (left eye is first), 14 both eyes laced in one Block (right eye is first)) . There are some more details on 3D support in the Specification Notes."
                },
                "9a": {
                    name: "FlagInterlaced",
                    cppname: "VideoFlagInterlaced",
                    level: "4",
                    type: "u",
                    mandatory: "1",
                    minver: "2",
                    webm: "1",
                    "default": "0",
                    range: "0-1",
                    description: "Set if the video is interlaced. (1 bit)"
                },
                e0: {
                    name: "Video",
                    cppname: "TrackVideo",
                    level: "3",
                    type: "m",
                    minver: "1",
                    description: "Video settings."
                },
                "66a5": {
                    name: "TrackTranslateTrackID",
                    level: "4",
                    type: "b",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    description: "The binary value used to represent this track in the chapter codec data. The format depends on the ChapProcessCodecID used."
                },
                "66bf": {
                    name: "TrackTranslateCodec",
                    level: "4",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    description: "The chapter codec using this ID (0: Matroska Script, 1: DVD-menu)."
                },
                "66fc": {
                    name: "TrackTranslateEditionUID",
                    level: "4",
                    type: "u",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "Specify an edition UID on which this translation applies. When not specified, it means for all editions found in the segment."
                },
                "56bb": {
                    name: "SeekPreRoll",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    multiple: "0",
                    "default": "0",
                    minver: "4",
                    webm: "1",
                    description: "After a discontinuity, SeekPreRoll is the duration in nanoseconds of the data the decoder must decode before the decoded data is valid."
                },
                "56aa": {
                    name: "CodecDelay",
                    level: "3",
                    type: "u",
                    multiple: "0",
                    "default": "0",
                    minver: "4",
                    webm: "1",
                    description: "CodecDelay is The codec-built-in delay in nanoseconds. This value must be subtracted from each block timestamp in order to get the actual timestamp. The value should be small so the muxing of tracks with the same actual timestamp are in the same Cluster."
                },
                "6fab": {
                    name: "TrackOverlay",
                    level: "3",
                    type: "u",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "Specify that this track is an overlay track for the Track specified (in the u-integer). That means when this track has a gap (see SilentTracks) the overlay track should be used instead. The order of multiple TrackOverlay matters, the first one is the one that should be used. If not found it should be the second, etc."
                },
                aa: {
                    name: "CodecDecodeAll",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "2",
                    webm: "0",
                    "default": "1",
                    range: "0-1",
                    description: "The codec can decode potentially damaged data (1 bit)."
                },
                "26b240": {
                    name: "CodecDownloadURL",
                    level: "3",
                    type: "s",
                    multiple: "1",
                    webm: "0",
                    description: "A URL to download about the codec used."
                },
                "3b4040": {
                    name: "CodecInfoURL",
                    level: "3",
                    type: "s",
                    multiple: "1",
                    webm: "0",
                    description: "A URL to find information about the codec used."
                },
                "3a9697": {
                    name: "CodecSettings",
                    level: "3",
                    type: "8",
                    webm: "0",
                    description: "A string describing the encoding setting used."
                },
                "63a2": {
                    name: "CodecPrivate",
                    level: "3",
                    type: "b",
                    minver: "1",
                    description: "Private data only known to the codec."
                },
                "22b59c": {
                    name: "Language",
                    cppname: "TrackLanguage",
                    level: "3",
                    type: "s",
                    minver: "1",
                    "default": "eng",
                    description: "Specifies the language of the track in the Matroska languages form."
                },
                "536e": {
                    name: "Name",
                    cppname: "TrackName",
                    level: "3",
                    type: "8",
                    minver: "1",
                    description: "A human-readable track name."
                },
                "55ee": {
                    name: "MaxBlockAdditionID",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    description: "The maximum value of BlockAdditions for this track."
                },
                "537f": {
                    name: "TrackOffset",
                    level: "3",
                    type: "i",
                    webm: "0",
                    "default": "0",
                    description: "A value to add to the Block's Timestamp. This can be used to adjust the playback offset of a track."
                },
                "23314f": {
                    name: "TrackTimecodeScale",
                    level: "3",
                    type: "f",
                    mandatory: "1",
                    minver: "1",
                    maxver: "3",
                    webm: "0",
                    "default": "1.0",
                    range: "> 0",
                    description: "DEPRECATED, DO NOT USE. The scale to apply on this track to work at normal speed in relation with other tracks (mostly used to adjust video speed when the audio length differs)."
                },
                "234e7a": {
                    name: "DefaultDecodedFieldDuration",
                    cppname: "TrackDefaultDecodedFieldDuration",
                    level: "3",
                    type: "u",
                    minver: "4",
                    range: "not 0",
                    description: "The period in nanoseconds (not scaled by TimcodeScale)\nbetween two successive fields at the output of the decoding process (see the notes)"
                },
                "23e383": {
                    name: "DefaultDuration",
                    cppname: "TrackDefaultDuration",
                    level: "3",
                    type: "u",
                    minver: "1",
                    range: "not 0",
                    description: "Number of nanoseconds (not scaled via TimecodeScale) per frame ('frame' in the Matroska sense -- one element put into a (Simple)Block)."
                },
                "6df8": {
                    name: "MaxCache",
                    cppname: "TrackMaxCache",
                    level: "3",
                    type: "u",
                    minver: "1",
                    webm: "0",
                    description: "The maximum cache size required to store referenced frames in and the current frame. 0 means no cache is needed."
                },
                "6de7": {
                    name: "MinCache",
                    cppname: "TrackMinCache",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    description: "The minimum number of frames a player should be able to cache during playback. If set to 0, the reference pseudo-cache system is not used."
                },
                "9c": {
                    name: "FlagLacing",
                    cppname: "TrackFlagLacing",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    "default": "1",
                    range: "0-1",
                    description: "Set if the track may contain blocks using lacing. (1 bit)"
                },
                "55aa": {
                    name: "FlagForced",
                    cppname: "TrackFlagForced",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    "default": "0",
                    range: "0-1",
                    description: "Set if that track MUST be active during playback. There can be many forced track for a kind (audio, video or subs), the player should select the one which language matches the user preference or the default + forced track. Overlay MAY happen between a forced and non-forced track of the same kind. (1 bit)"
                },
                b9: {
                    name: "FlagEnabled",
                    cppname: "TrackFlagEnabled",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "2",
                    webm: "1",
                    "default": "1",
                    range: "0-1",
                    description: "Set if the track is usable. (1 bit)"
                },
                "73c5": {
                    name: "TrackUID",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    range: "not 0",
                    description: "A unique ID to identify the Track. This should be kept the same when making a direct stream copy of the Track to another file."
                },
                d7: {
                    name: "TrackNumber",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    range: "not 0",
                    description: "The track number as used in the Block Header (using more than 127 tracks is not encouraged, though the design allows an unlimited number)."
                },
                ae: {
                    name: "TrackEntry",
                    level: "2",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    description: "Describes a track with all elements."
                },
                "1654ae6b": {
                    name: "Tracks",
                    level: "1",
                    type: "m",
                    multiple: "1",
                    minver: "1",
                    description: "A top-level block of information with many tracks described."
                },
                af: {
                    name: "EncryptedBlock",
                    level: "2",
                    type: "b",
                    multiple: "1",
                    webm: "0",
                    description: "Similar to EncryptedBlock Structure)"
                },
                ca: {
                    name: "ReferenceTimeCode",
                    level: "4",
                    type: "u",
                    multiple: "0",
                    mandatory: "1",
                    minver: "0",
                    webm: "0",
                    divx: "1",
                    description: "DivX trick track extenstions"
                },
                c9: {
                    name: "ReferenceOffset",
                    level: "4",
                    type: "u",
                    multiple: "0",
                    mandatory: "1",
                    minver: "0",
                    webm: "0",
                    divx: "1",
                    description: "DivX trick track extenstions"
                },
                c8: {
                    name: "ReferenceFrame",
                    level: "3",
                    type: "m",
                    multiple: "0",
                    minver: "0",
                    webm: "0",
                    divx: "1",
                    description: "DivX trick track extenstions"
                },
                cf: {
                    name: "SliceDuration",
                    level: "5",
                    type: "u",
                    "default": "0",
                    description: "The (scaled) duration to apply to the element."
                },
                ce: {
                    name: "Delay",
                    cppname: "SliceDelay",
                    level: "5",
                    type: "u",
                    "default": "0",
                    description: "The (scaled) delay to apply to the element."
                },
                cb: {
                    name: "BlockAdditionID",
                    cppname: "SliceBlockAddID",
                    level: "5",
                    type: "u",
                    "default": "0",
                    description: "The ID of the BlockAdditional element (0 is the main Block)."
                },
                cd: {
                    name: "FrameNumber",
                    cppname: "SliceFrameNumber",
                    level: "5",
                    type: "u",
                    "default": "0",
                    description: "The number of the frame to generate from this lace with this delay (allow you to generate many frames from the same Block/Frame)."
                },
                cc: {
                    name: "LaceNumber",
                    cppname: "SliceLaceNumber",
                    level: "5",
                    type: "u",
                    minver: "1",
                    "default": "0",
                    divx: "0",
                    description: "The reverse number of the frame in the lace (0 is the last frame, 1 is the next to last, etc). While there are a few files in the wild with this element, it is no longer in use and has been deprecated. Being able to interpret this element is not required for playback."
                },
                e8: {
                    name: "TimeSlice",
                    level: "4",
                    type: "m",
                    multiple: "1",
                    minver: "1",
                    divx: "0",
                    description: "Contains extra time information about the data contained in the Block. While there are a few files in the wild with this element, it is no longer in use and has been deprecated. Being able to interpret this element is not required for playback."
                },
                "8e": {
                    name: "Slices",
                    level: "3",
                    type: "m",
                    minver: "1",
                    divx: "0",
                    description: "Contains slices description."
                },
                "75a2": {
                    name: "DiscardPadding",
                    level: "3",
                    type: "i",
                    minver: "4",
                    webm: "1",
                    description: "Duration in nanoseconds of the silent data added to the Block (padding at the end of the Block for positive value, at the beginning of the Block for negative value). The duration of DiscardPadding is not calculated in the duration of the TrackEntry and should be discarded during playback."
                },
                a4: {
                    name: "CodecState",
                    level: "3",
                    type: "b",
                    minver: "2",
                    webm: "0",
                    description: "The new codec state to use. Data interpretation is private to the codec. This information should always be referenced by a seek entry."
                },
                fd: {
                    name: "ReferenceVirtual",
                    level: "3",
                    type: "i",
                    webm: "0",
                    description: "Relative position of the data that should be in position of the virtual block."
                },
                fb: {
                    name: "ReferenceBlock",
                    level: "3",
                    type: "i",
                    multiple: "1",
                    minver: "1",
                    description: "Timestamp of another frame used as a reference (ie: B or P frame). The timestamp is relative to the block it's attached to."
                },
                fa: {
                    name: "ReferencePriority",
                    cppname: "FlagReferenced",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "0",
                    description: "This frame is referenced and has the specified cache priority. In cache only a frame of the same or higher priority can replace this frame. A value of 0 means the frame is not referenced."
                },
                "9b": {
                    name: "BlockDuration",
                    level: "3",
                    type: "u",
                    minver: "1",
                    "default": "TrackDuration",
                    description: 'The duration of the Block (based on TimecodeScale). This element is mandatory when DefaultDuration is set for the track (but can be omitted as other default values). When not written and with no DefaultDuration, the value is assumed to be the difference between the timestamp of this Block and the timestamp of the next Block in "display" order (not coding order). This element can be useful at the end of a Track (as there is not other Block available), or when there is a break in a track like for subtitle tracks. When set to 0 that means the frame is not a keyframe.'
                },
                a5: {
                    name: "BlockAdditional",
                    level: "5",
                    type: "b",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    description: "Interpreted by the codec as it wishes (using the BlockAddID)."
                },
                ee: {
                    name: "BlockAddID",
                    level: "5",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    "default": "1",
                    range: "not 0",
                    description: "An ID to identify the BlockAdditional level."
                },
                a6: {
                    name: "BlockMore",
                    level: "4",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "Contain the BlockAdditional and some parameters."
                },
                "75a1": {
                    name: "BlockAdditions",
                    level: "3",
                    type: "m",
                    minver: "1",
                    webm: "0",
                    description: "Contain additional blocks to complete the main one. An EBML parser that has no knowledge of the Block structure could still see and use/skip these data."
                },
                a2: {
                    name: "BlockVirtual",
                    level: "3",
                    type: "b",
                    webm: "0",
                    description: "A Block with no data. It must be stored in the stream at the place the real Block should be in display order. (see Block Virtual)"
                },
                a1: {
                    name: "Block",
                    level: "3",
                    type: "b",
                    mandatory: "1",
                    minver: "1",
                    description: "Block containing the actual data to be rendered and a timestamp relative to the Cluster Timecode. (see Block Structure)"
                },
                a0: {
                    name: "BlockGroup",
                    level: "2",
                    type: "m",
                    multiple: "1",
                    minver: "1",
                    description: "Basic container of information containing a single Block or BlockVirtual, and information specific to that Block/VirtualBlock."
                },
                a3: {
                    name: "SimpleBlock",
                    level: "2",
                    type: "b",
                    multiple: "1",
                    minver: "2",
                    webm: "1",
                    divx: "1",
                    description: "Similar to SimpleBlock Structure)"
                },
                ab: {
                    name: "PrevSize",
                    cppname: "ClusterPrevSize",
                    level: "2",
                    type: "u",
                    minver: "1",
                    description: "Size of the previous Cluster, in octets. Can be useful for backward playing."
                },
                a7: {
                    name: "Position",
                    cppname: "ClusterPosition",
                    level: "2",
                    type: "u",
                    minver: "1",
                    webm: "0",
                    description: "The Position of the Cluster in the segment (0 in live broadcast streams). It might help to resynchronise offset on damaged streams."
                },
                "58d7": {
                    name: "SilentTrackNumber",
                    cppname: "ClusterSilentTrackNumber",
                    level: "3",
                    type: "u",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "One of the track number that are not used from now on in the stream. It could change later if not specified as silent in a further Cluster."
                },
                e7: {
                    name: "Timecode",
                    cppname: "ClusterTimecode",
                    level: "2",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    description: "Absolute timestamp of the cluster (based on TimecodeScale)."
                },
                "1f43b675": {
                    name: "Cluster",
                    level: "1",
                    type: "m",
                    multiple: "1",
                    minver: "1",
                    description: "The lower level element containing the (monolithic) Block structure."
                },
                "4d80": {
                    name: "MuxingApp",
                    level: "2",
                    type: "8",
                    mandatory: "1",
                    minver: "1",
                    description: 'Muxing application or library ("libmatroska-0.4.3").'
                },
                "7ba9": {
                    name: "Title",
                    level: "2",
                    type: "8",
                    minver: "1",
                    webm: "0",
                    description: "General name of the segment."
                },
                "2ad7b2": {
                    name: "TimecodeScaleDenominator",
                    level: "2",
                    type: "u",
                    mandatory: "1",
                    minver: "4",
                    "default": "1000000000",
                    description: "Timestamp scale numerator, see TimecodeScale."
                },
                "2ad7b1": {
                    name: "TimecodeScale",
                    level: "2",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    "default": "1000000",
                    description: "Timestamp scale in nanoseconds (1.000.000 means all timestamps in the segment are expressed in milliseconds)."
                },
                "69a5": {
                    name: "ChapterTranslateID",
                    level: "3",
                    type: "b",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    description: "The binary value used to represent this segment in the chapter codec data. The format depends on the ChapProcessCodecID used."
                },
                "69bf": {
                    name: "ChapterTranslateCodec",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    webm: "0",
                    description: "The chapter codec using this ID (0: Matroska Script, 1: DVD-menu)."
                },
                "69fc": {
                    name: "ChapterTranslateEditionUID",
                    level: "3",
                    type: "u",
                    multiple: "1",
                    minver: "1",
                    webm: "0",
                    description: "Specify an edition UID on which this correspondance applies. When not specified, it means for all editions found in the segment."
                },
                "3e83bb": {
                    name: "NextFilename",
                    level: "2",
                    type: "8",
                    minver: "1",
                    webm: "0",
                    description: "An escaped filename corresponding to the next segment."
                },
                "3eb923": {
                    name: "NextUID",
                    level: "2",
                    type: "b",
                    minver: "1",
                    webm: "0",
                    bytesize: "16",
                    description: "A unique ID to identify the next chained segment (128 bits)."
                },
                "3c83ab": {
                    name: "PrevFilename",
                    level: "2",
                    type: "8",
                    minver: "1",
                    webm: "0",
                    description: "An escaped filename corresponding to the previous segment."
                },
                "3cb923": {
                    name: "PrevUID",
                    level: "2",
                    type: "b",
                    minver: "1",
                    webm: "0",
                    bytesize: "16",
                    description: "A unique ID to identify the previous chained segment (128 bits)."
                },
                "73a4": {
                    name: "SegmentUID",
                    level: "2",
                    type: "b",
                    minver: "1",
                    webm: "0",
                    range: "not 0",
                    bytesize: "16",
                    description: "A randomly generated unique ID to identify the current segment between many others (128 bits)."
                },
                "1549a966": {
                    name: "Info",
                    level: "1",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    description: "Contains miscellaneous general information and statistics on the file."
                },
                "53ac": {
                    name: "SeekPosition",
                    level: "3",
                    type: "u",
                    mandatory: "1",
                    minver: "1",
                    description: "The position of the element in the segment in octets (0 = first level 1 element)."
                },
                "53ab": {
                    name: "SeekID",
                    level: "3",
                    type: "b",
                    mandatory: "1",
                    minver: "1",
                    description: "The binary ID corresponding to the element name."
                },
                "4dbb": {
                    name: "Seek",
                    cppname: "SeekPoint",
                    level: "2",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    description: "Contains a single seek entry to an EBML element."
                },
                "114d9b74": {
                    name: "SeekHead",
                    cppname: "SeekHeader",
                    level: "1",
                    type: "m",
                    multiple: "1",
                    minver: "1",
                    description: "Contains the position of other level 1 elements."
                },
                "7e7b": {
                    name: "SignatureElementList",
                    level: "2",
                    type: "m",
                    multiple: "1",
                    webm: "0",
                    i: "Cluster|Block|BlockAdditional",
                    description: "A list consists of a number of consecutive elements that represent one case where data is used in signature. Ex:  means that the BlockAdditional of all Blocks in all Clusters is used for encryption."
                },
                "7e5b": {
                    name: "SignatureElements",
                    level: "1",
                    type: "m",
                    webm: "0",
                    description: "Contains elements that will be used to compute the signature."
                },
                "7eb5": {
                    name: "Signature",
                    level: "1",
                    type: "b",
                    webm: "0",
                    description: "The signature of the data (until a new."
                },
                "7ea5": {
                    name: "SignaturePublicKey",
                    level: "1",
                    type: "b",
                    webm: "0",
                    description: "The public key to use with the algorithm (in the case of a PKI-based signature)."
                },
                "7e9a": {
                    name: "SignatureHash",
                    level: "1",
                    type: "u",
                    webm: "0",
                    description: "Hash algorithm used (1=SHA1-160, 2=MD5)."
                },
                "7e8a": {
                    name: "SignatureAlgo",
                    level: "1",
                    type: "u",
                    webm: "0",
                    description: "Signature algorithm used (1=RSA, 2=elliptic)."
                },
                "1b538667": {
                    name: "SignatureSlot",
                    level: "-1",
                    type: "m",
                    multiple: "1",
                    webm: "0",
                    description: "Contain signature of some (coming) elements in the stream."
                },
                bf: {
                    name: "CRC-32",
                    level: "-1",
                    type: "b",
                    minver: "1",
                    webm: "0",
                    description: "The CRC is computed on all the data of the Master element it's in. The CRC element should be the first in it's parent master for easier reading. All level 1 elements should include a CRC-32. The CRC in use is the IEEE CRC32 Little Endian"
                },
                ec: {
                    name: "Void",
                    level: "-1",
                    type: "b",
                    minver: "1",
                    description: "Used to void damaged data, to avoid unexpected behaviors when using damaged data. The content is discarded. Also used to reserve space in a sub-element for later use."
                },
                "42f3": {
                    name: "EBMLMaxSizeLength",
                    level: "1",
                    type: "u",
                    mandatory: "1",
                    "default": "8",
                    minver: "1",
                    description: "The maximum length of the sizes you'll find in this file (8 or less in Matroska). This does not override the element size indicated at the beginning of an element. Elements that have an indicated size which is larger than what is allowed by EBMLMaxSizeLength shall be considered invalid."
                },
                "42f2": {
                    name: "EBMLMaxIDLength",
                    level: "1",
                    type: "u",
                    mandatory: "1",
                    "default": "4",
                    minver: "1",
                    description: "The maximum length of the IDs you'll find in this file (4 or less in Matroska)."
                },
                "42f7": {
                    name: "EBMLReadVersion",
                    level: "1",
                    type: "u",
                    mandatory: "1",
                    "default": "1",
                    minver: "1",
                    description: "The minimum EBML version a parser has to support to read this file."
                },
                "1a45dfa3": {
                    name: "EBML",
                    level: "0",
                    type: "m",
                    mandatory: "1",
                    multiple: "1",
                    minver: "1",
                    description: "Set the EBML characteristics of the data to follow. Each EBML document has to start with this."
                }
            };
            t.exports = r
        }, {}],
        147: [function(e, t, n) {
            (function(e) {
                var n = new e([1, 255, 255, 255, 255, 255, 255, 255]),
                    r = {};
                r.readVint = function(e, t) {
                    t = t || 0;
                    for (var n = 1; 8 >= n && !(e[t] >= Math.pow(2, 8 - n)); n++);
                    if (n > 8) throw new Error("Unrepresentable length: " + n + " " + e.toString("hex", t, t + n));
                    if (t + n > e.length) return null;
                    var r = (1 << 8 - n) - 1,
                        o = e[t] & r,
                        a = !(~o & r);
                    for (i = 1; i < n; i++) {
                        if (7 === i && o >= Math.pow(2, 45) && e[t + 7] > 0) return {
                            length: n,
                            value: -1
                        };
                        o *= Math.pow(2, 8), o += e[t + i], a = a && !(255 & ~e[t + i])
                    }
                    return a && (o = -1), {
                        length: n,
                        value: o
                    }
                }, r.writeVint = function(t, r) {
                    if (!Number.isSafeInteger(t)) throw new Error("Unrepresentable value: " + t);
                    if (r > 8) throw new Error("Unsupported length : " + r);
                    if (0 > t) return new e(n);
                    for (var o = 1; 8 >= o && !(t < Math.pow(2, 7 * o) - 1); o++);
                    r > o && (o = r);
                    var a = new e(o);
                    for (i = 1; i <= o; i++) {
                        var s = 255 & t;
                        a[o - i] = s, t -= s, t /= Math.pow(2, 8)
                    }
                    return a[0] = a[0] | 1 << 8 - o, a
                }, r.readUInt = function(e, t) {
                    t = t || 0;
                    var n = e.readUIntBE(t, Math.min(e.length, 6));
                    if (e.length <= 6) return n;
                    for (var r = t + 6; r < e.length; r++) n = 256 * n + e[r];
                    return n
                }, r.writeUInt = function(t) {
                    var n = new e(8);
                    return n.writeUIntBE(t, 0, 8), n
                }, r.readFloat = function(e) {
                    if (4 === e.length) return e.readFloatBE(0);
                    if (8 === e.length) return e.readDoubleBE(0);
                    throw new Error("unsuppoted float")
                }, r.writeFloat = function(t) {
                    var n = new e(8);
                    return n.writeDoubleBE(t, 0), n
                }, r.writeUtf8 = function(t) {
                    return new e(t, "utf8")
                }, t.exports = r
            }).call(this, e("buffer").Buffer)
        }, {
            buffer: 113
        }],
        148: [function(e, t, n) {
            (function(e) {
                function n(e) {
                    return this instanceof n ? (this.buffers = e || [], void(this.length = this.buffers.reduce(function(e, t) {
                        return e + t.length
                    }, 0))) : new n(e)
                }
                t.exports = n, n.prototype.push = function() {
                    for (var t = 0; t < arguments.length; t++)
                        if (!e.isBuffer(arguments[t])) throw new TypeError("Tried to push a non-buffer");
                    for (var t = 0; t < arguments.length; t++) {
                        var n = arguments[t];
                        this.buffers.push(n), this.length += n.length
                    }
                    return this.length
                }, n.prototype.unshift = function() {
                    for (var t = 0; t < arguments.length; t++)
                        if (!e.isBuffer(arguments[t])) throw new TypeError("Tried to unshift a non-buffer");
                    for (var t = 0; t < arguments.length; t++) {
                        var n = arguments[t];
                        this.buffers.unshift(n), this.length += n.length
                    }
                    return this.length
                }, n.prototype.copy = function(e, t, n, r) {
                    return this.slice(n, r).copy(e, t, 0, r - n)
                }, n.prototype.splice = function(t, r) {
                    var i = this.buffers,
                        o = t >= 0 ? t : this.length - t,
                        a = [].slice.call(arguments, 2);
                    void 0 === r ? r = this.length - o : r > this.length - o && (r = this.length - o);
                    for (var t = 0; t < a.length; t++) this.length += a[t].length;
                    for (var s = new n, c = 0, u = 0; u < i.length && c + i[u].length < o; u++) c += i[u].length;
                    if (o - c > 0) {
                        var l = o - c;
                        if (l + r < i[u].length) {
                            s.push(i[u].slice(l, l + r));
                            for (var f = i[u], h = new e(l), t = 0; l > t; t++) h[t] = f[t];
                            for (var d = new e(f.length - l - r), t = l + r; t < f.length; t++) d[t - r - l] = f[t];
                            if (a.length > 0) {
                                var p = a.slice();
                                p.unshift(h), p.push(d), i.splice.apply(i, [u, 1].concat(p)), u += p.length, a = []
                            } else i.splice(u, 1, h, d), u += 2
                        } else s.push(i[u].slice(l)), i[u] = i[u].slice(0, l), u++
                    }
                    for (a.length > 0 && (i.splice.apply(i, [u, 0].concat(a)), u += a.length); s.length < r;) {
                        var m = i[u],
                            g = m.length,
                            b = Math.min(g, r - s.length);
                        b === g ? (s.push(m), i.splice(u, 1)) : (s.push(m.slice(0, b)), i[u] = i[u].slice(b))
                    }
                    return this.length -= s.length, s
                }, n.prototype.slice = function(t, n) {
                    var r = this.buffers;
                    void 0 === n && (n = this.length), void 0 === t && (t = 0), n > this.length && (n = this.length);
                    for (var i = 0, o = 0; o < r.length && i + r[o].length <= t; o++) i += r[o].length;
                    for (var a = new e(n - t), s = 0, c = o; n - t > s && c < r.length; c++) {
                        var u = r[c].length,
                            l = 0 === s ? t - i : 0,
                            f = s + u >= n - t ? Math.min(l + (n - t) - s, u) : u;
                        r[c].copy(a, s, l, f), s += f - l
                    }
                    return a
                }, n.prototype.pos = function(e) {
                    if (0 > e || e >= this.length) throw new Error("oob");
                    for (var t = e, n = 0, r = null;;) {
                        if (r = this.buffers[n], t < r.length) return {
                            buf: n,
                            offset: t
                        };
                        t -= r.length, n++
                    }
                }, n.prototype.get = function(e) {
                    var t = this.pos(e);
                    return this.buffers[t.buf].get(t.offset)
                }, n.prototype.set = function(e, t) {
                    var n = this.pos(e);
                    return this.buffers[n.buf].set(n.offset, t)
                }, n.prototype.indexOf = function(t, n) {
                    if ("string" == typeof t) t = new e(t);
                    else if (!(t instanceof e)) throw new Error("Invalid type for a search string");
                    if (!t.length) return 0;
                    if (!this.length) return -1;
                    var r, i = 0,
                        o = 0,
                        a = 0,
                        s = 0;
                    if (n) {
                        var c = this.pos(n);
                        i = c.buf, o = c.offset, s = n
                    }
                    for (;;) {
                        for (; o >= this.buffers[i].length;)
                            if (o = 0, i++, i >= this.buffers.length) return -1;
                        var u = this.buffers[i][o];
                        if (u == t[a]) {
                            if (0 == a && (r = {
                                    i: i,
                                    j: o,
                                    pos: s
                                }), a++, a == t.length) return r.pos
                        } else 0 != a && (i = r.i, o = r.j, s = r.pos, a = 0);
                        o++, s++
                    }
                }, n.prototype.toBuffer = function() {
                    return this.slice()
                }, n.prototype.toString = function(e, t, n) {
                    return this.slice(t, n).toString(e)
                }
            }).call(this, e("buffer").Buffer)
        }, {
            buffer: 113
        }],
        149: [function(e, t, n) {
            function r(e) {
                return r.enabled(e) ? function(t) {
                    t = i(t);
                    var n = new Date,
                        o = n - (r[e] || n);
                    r[e] = n, t = e + " " + t + " +" + r.humanize(o), window.console && console.log && Function.prototype.apply.call(console.log, console, arguments)
                } : function() {}
            }

            function i(e) {
                return e instanceof Error ? e.stack || e.message : e
            }
            t.exports = r, r.names = [], r.skips = [], r.enable = function(e) {
                try {
                    localStorage.debug = e
                } catch (t) {}
                for (var n = (e || "").split(/[\s,]+/), i = n.length, o = 0; i > o; o++) e = n[o].replace("*", ".*?"), "-" === e[0] ? r.skips.push(new RegExp("^" + e.substr(1) + "$")) : r.names.push(new RegExp("^" + e + "$"))
            }, r.disable = function() {
                r.enable("")
            }, r.humanize = function(e) {
                var t = 1e3,
                    n = 6e4,
                    r = 60 * n;
                return e >= r ? (e / r).toFixed(1) + "h" : e >= n ? (e / n).toFixed(1) + "m" : e >= t ? (e / t | 0) + "s" : e + "ms"
            }, r.enabled = function(e) {
                for (var t = 0, n = r.skips.length; n > t; t++)
                    if (r.skips[t].test(e)) return !1;
                for (var t = 0, n = r.names.length; n > t; t++)
                    if (r.names[t].test(e)) return !0;
                return !1
            };
            try {
                window.localStorage && r.enable(localStorage.debug)
            } catch (o) {}
        }, {}],
        150: [function(e, t, n) {
            function r(e) {
                o.call(this, e)
            }
            var i = e("events").EventEmitter,
                o = e("stream").Writable,
                a = e("util");
            a.inherits(r, o), r.prototype.emit = function(e) {
                if ("finish" === e && this._flush && !o.prototype._flush) this._flush(function(e) {
                    e ? i.prototype.emit.call(this, "error", e) : i.prototype.emit.call(this, "finish")
                }.bind(this));
                else {
                    var t = Array.prototype.slice.call(arguments);
                    i.prototype.emit.apply(this, t)
                }
            }, t.exports = r
        }, {
            events: 117,
            stream: 135,
            util: 153
        }],
        151: [function(e, t, n) {
            arguments[4][118][0].apply(n, arguments)
        }, {
            dup: 118
        }],
        152: [function(e, t, n) {
            t.exports = function(e) {
                return e && "object" == typeof e && "function" == typeof e.copy && "function" == typeof e.fill && "function" == typeof e.readUInt8
            }
        }, {}],
        153: [function(e, t, n) {
            (function(t, r) {
                function i(e, t) {
                    var r = {
                        seen: [],
                        stylize: a
                    };
                    return arguments.length >= 3 && (r.depth = arguments[2]), arguments.length >= 4 && (r.colors = arguments[3]), m(t) ? r.showHidden = t : t && n._extend(r, t), w(r.showHidden) && (r.showHidden = !1), w(r.depth) && (r.depth = 2), w(r.colors) && (r.colors = !1), w(r.customInspect) && (r.customInspect = !0), r.colors && (r.stylize = o), c(r, e, r.depth)
                }

                function o(e, t) {
                    var n = i.styles[t];
                    return n ? "[" + i.colors[n][0] + "m" + e + "[" + i.colors[n][1] + "m" : e
                }

                function a(e, t) {
                    return e
                }

                function s(e) {
                    var t = {};
                    return e.forEach(function(e, n) {
                        t[e] = !0
                    }), t
                }

                function c(e, t, r) {
                    if (e.customInspect && t && j(t.inspect) && t.inspect !== n.inspect && (!t.constructor || t.constructor.prototype !== t)) {
                        var i = t.inspect(r, e);
                        return y(i) || (i = c(e, i, r)), i
                    }
                    var o = u(e, t);
                    if (o) return o;
                    var a = Object.keys(t),
                        m = s(a);
                    if (e.showHidden && (a = Object.getOwnPropertyNames(t)), T(t) && (a.indexOf("message") >= 0 || a.indexOf("description") >= 0)) return l(t);
                    if (0 === a.length) {
                        if (j(t)) {
                            var g = t.name ? ": " + t.name : "";
                            return e.stylize("[Function" + g + "]", "special")
                        }
                        if (k(t)) return e.stylize(RegExp.prototype.toString.call(t), "regexp");
                        if (S(t)) return e.stylize(Date.prototype.toString.call(t), "date");
                        if (T(t)) return l(t)
                    }
                    var b = "",
                        v = !1,
                        _ = ["{", "}"];
                    if (p(t) && (v = !0, _ = ["[", "]"]), j(t)) {
                        var w = t.name ? ": " + t.name : "";
                        b = " [Function" + w + "]"
                    }
                    if (k(t) && (b = " " + RegExp.prototype.toString.call(t)), S(t) && (b = " " + Date.prototype.toUTCString.call(t)), T(t) && (b = " " + l(t)), 0 === a.length && (!v || 0 == t.length)) return _[0] + b + _[1];
                    if (0 > r) return k(t) ? e.stylize(RegExp.prototype.toString.call(t), "regexp") : e.stylize("[Object]", "special");
                    e.seen.push(t);
                    var x;
                    return x = v ? f(e, t, r, m, a) : a.map(function(n) {
                        return h(e, t, r, m, n, v)
                    }), e.seen.pop(), d(x, b, _)
                }

                function u(e, t) {
                    if (w(t)) return e.stylize("undefined", "undefined");
                    if (y(t)) {
                        var n = "'" + JSON.stringify(t).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
                        return e.stylize(n, "string")
                    }
                    return v(t) ? e.stylize("" + t, "number") : m(t) ? e.stylize("" + t, "boolean") : g(t) ? e.stylize("null", "null") : void 0
                }

                function l(e) {
                    return "[" + Error.prototype.toString.call(e) + "]"
                }

                function f(e, t, n, r, i) {
                    for (var o = [], a = 0, s = t.length; s > a; ++a) P(t, String(a)) ? o.push(h(e, t, n, r, String(a), !0)) : o.push("");
                    return i.forEach(function(i) {
                        i.match(/^\d+$/) || o.push(h(e, t, n, r, i, !0))
                    }), o
                }

                function h(e, t, n, r, i, o) {
                    var a, s, u;
                    if (u = Object.getOwnPropertyDescriptor(t, i) || {
                            value: t[i]
                        }, u.get ? s = u.set ? e.stylize("[Getter/Setter]", "special") : e.stylize("[Getter]", "special") : u.set && (s = e.stylize("[Setter]", "special")), P(r, i) || (a = "[" + i + "]"), s || (e.seen.indexOf(u.value) < 0 ? (s = g(n) ? c(e, u.value, null) : c(e, u.value, n - 1), s.indexOf("\n") > -1 && (s = o ? s.split("\n").map(function(e) {
                            return "  " + e
                        }).join("\n").substr(2) : "\n" + s.split("\n").map(function(e) {
                            return "   " + e
                        }).join("\n"))) : s = e.stylize("[Circular]", "special")), w(a)) {
                        if (o && i.match(/^\d+$/)) return s;
                        a = JSON.stringify("" + i), a.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (a = a.substr(1, a.length - 2), a = e.stylize(a, "name")) : (a = a.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), a = e.stylize(a, "string"))
                    }
                    return a + ": " + s
                }

                function d(e, t, n) {
                    var r = 0,
                        i = e.reduce(function(e, t) {
                            return r++, t.indexOf("\n") >= 0 && r++, e + t.replace(/\u001b\[\d\d?m/g, "").length + 1
                        }, 0);
                    return i > 60 ? n[0] + ("" === t ? "" : t + "\n ") + " " + e.join(",\n  ") + " " + n[1] : n[0] + t + " " + e.join(", ") + " " + n[1]
                }

                function p(e) {
                    return Array.isArray(e)
                }

                function m(e) {
                    return "boolean" == typeof e
                }

                function g(e) {
                    return null === e
                }

                function b(e) {
                    return null == e
                }

                function v(e) {
                    return "number" == typeof e
                }

                function y(e) {
                    return "string" == typeof e
                }

                function _(e) {
                    return "symbol" == typeof e
                }

                function w(e) {
                    return void 0 === e
                }

                function k(e) {
                    return x(e) && "[object RegExp]" === C(e)
                }

                function x(e) {
                    return "object" == typeof e && null !== e
                }

                function S(e) {
                    return x(e) && "[object Date]" === C(e)
                }

                function T(e) {
                    return x(e) && ("[object Error]" === C(e) || e instanceof Error)
                }

                function j(e) {
                    return "function" == typeof e
                }

                function E(e) {
                    return null === e || "boolean" == typeof e || "number" == typeof e || "string" == typeof e || "symbol" == typeof e || "undefined" == typeof e
                }

                function C(e) {
                    return Object.prototype.toString.call(e)
                }

                function A(e) {
                    return 10 > e ? "0" + e.toString(10) : e.toString(10)
                }

                function D() {
                    var e = new Date,
                        t = [A(e.getHours()), A(e.getMinutes()), A(e.getSeconds())].join(":");
                    return [e.getDate(), R[e.getMonth()], t].join(" ")
                }

                function P(e, t) {
                    return Object.prototype.hasOwnProperty.call(e, t)
                }
                var B = /%[sdj%]/g;
                n.format = function(e) {
                    if (!y(e)) {
                        for (var t = [], n = 0; n < arguments.length; n++) t.push(i(arguments[n]));
                        return t.join(" ")
                    }
                    for (var n = 1, r = arguments, o = r.length, a = String(e).replace(B, function(e) {
                            if ("%%" === e) return "%";
                            if (n >= o) return e;
                            switch (e) {
                                case "%s":
                                    return String(r[n++]);
                                case "%d":
                                    return Number(r[n++]);
                                case "%j":
                                    try {
                                        return JSON.stringify(r[n++])
                                    } catch (t) {
                                        return "[Circular]"
                                    }
                                default:
                                    return e
                            }
                        }), s = r[n]; o > n; s = r[++n]) a += g(s) || !x(s) ? " " + s : " " + i(s);
                    return a
                }, n.deprecate = function(e, i) {
                    function o() {
                        if (!a) {
                            if (t.throwDeprecation) throw new Error(i);
                            t.traceDeprecation ? console.trace(i) : console.error(i), a = !0
                        }
                        return e.apply(this, arguments)
                    }
                    if (w(r.process)) return function() {
                        return n.deprecate(e, i).apply(this, arguments)
                    };
                    if (t.noDeprecation === !0) return e;
                    var a = !1;
                    return o
                };
                var M, I = {};
                n.debuglog = function(e) {
                    if (w(M) && (M = t.env.NODE_DEBUG || ""), e = e.toUpperCase(), !I[e])
                        if (new RegExp("\\b" + e + "\\b", "i").test(M)) {
                            var r = t.pid;
                            I[e] = function() {
                                var t = n.format.apply(n, arguments);
                                console.error("%s %d: %s", e, r, t)
                            }
                        } else I[e] = function() {};
                    return I[e]
                }, n.inspect = i, i.colors = {
                    bold: [1, 22],
                    italic: [3, 23],
                    underline: [4, 24],
                    inverse: [7, 27],
                    white: [37, 39],
                    grey: [90, 39],
                    black: [30, 39],
                    blue: [34, 39],
                    cyan: [36, 39],
                    green: [32, 39],
                    magenta: [35, 39],
                    red: [31, 39],
                    yellow: [33, 39]
                }, i.styles = {
                    special: "cyan",
                    number: "yellow",
                    "boolean": "yellow",
                    undefined: "grey",
                    "null": "bold",
                    string: "green",
                    date: "magenta",
                    regexp: "red"
                }, n.isArray = p, n.isBoolean = m, n.isNull = g, n.isNullOrUndefined = b, n.isNumber = v, n.isString = y, n.isSymbol = _, n.isUndefined = w, n.isRegExp = k, n.isObject = x, n.isDate = S, n.isError = T, n.isFunction = j, n.isPrimitive = E, n.isBuffer = e("./support/isBuffer");
                var R = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                n.log = function() {
                    console.log("%s - %s", D(), n.format.apply(n, arguments))
                }, n.inherits = e("inherits"), n._extend = function(e, t) {
                    if (!t || !x(t)) return e;
                    for (var n = Object.keys(t), r = n.length; r--;) e[n[r]] = t[n[r]];
                    return e
                }
            }).call(this, e("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {
            "./support/isBuffer": 152,
            _process: 121,
            inherits: 151
        }]
    }, {}, [1])(1)
});