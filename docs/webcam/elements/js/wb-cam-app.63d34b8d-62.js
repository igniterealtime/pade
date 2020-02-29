
Polymer({
    is: "paper-progress",
    behaviors: [Polymer.IronRangeBehavior],
    properties: {
        secondaryProgress: {
            type: Number,
            value: 0
        },
        secondaryRatio: {
            type: Number,
            value: 0,
            readOnly: !0
        },
        indeterminate: {
            type: Boolean,
            value: !1,
            observer: "_toggleIndeterminate"
        },
        disabled: {
            type: Boolean,
            value: !1,
            reflectToAttribute: !0,
            observer: "_disabledChanged"
        }
    },
    observers: ["_progressChanged(secondaryProgress, value, min, max)"],
    hostAttributes: {
        role: "progressbar"
    },
    _toggleIndeterminate: function(e) {
        this.toggleClass("indeterminate", e, this.$.primaryProgress)
    },
    _transformProgress: function(e, r) {
        var s = "scaleX(" + r / 100 + ")";
        e.style.transform = e.style.webkitTransform = s
    },
    _mainRatioChanged: function(e) {
        this._transformProgress(this.$.primaryProgress, e)
    },
    _progressChanged: function(e, r, s, t) {
        e = this._clampValue(e), r = this._clampValue(r);
        var a = 100 * this._calcRatio(e),
            i = 100 * this._calcRatio(r);
        this._setSecondaryRatio(a), this._transformProgress(this.$.secondaryProgress, a), this._transformProgress(this.$.primaryProgress, i), this.secondaryProgress = e, this.setAttribute("aria-valuenow", r), this.setAttribute("aria-valuemin", s), this.setAttribute("aria-valuemax", t)
    },
    _disabledChanged: function(e) {
        this.setAttribute("aria-disabled", e ? "true" : "false")
    },
    _hideSecondaryProgress: function(e) {
        return 0 === e
    }
});
