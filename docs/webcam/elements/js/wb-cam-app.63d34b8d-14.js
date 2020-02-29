
! function() {
    Polymer({
        is: "paper-dialog",
        behaviors: [Polymer.PaperDialogBehavior, Polymer.NeonAnimationRunnerBehavior],
        listeners: {
            "neon-animation-finish": "_onNeonAnimationFinish"
        },
        _renderOpened: function() {
            this.cancelAnimation(), this.playAnimation("entry")
        },
        _renderClosed: function() {
            this.cancelAnimation(), this.playAnimation("exit")
        },
        _onNeonAnimationFinish: function() {
            this.opened ? this._finishRenderOpened() : this._finishRenderClosed()
        }
    })
}();


Polymer({
    is: "iron-media-query",
    properties: {
        queryMatches: {
            type: Boolean,
            value: !1,
            readOnly: !0,
            notify: !0
        },
        query: {
            type: String,
            observer: "queryChanged"
        },
        full: {
            type: Boolean,
            value: !1
        },
        _boundMQHandler: {
            value: function() {
                return this.queryHandler.bind(this)
            }
        },
        _mq: {
            value: null
        }
    },
    attached: function() {
        this.style.display = "none", this.queryChanged()
    },
    detached: function() {
        this._remove()
    },
    _add: function() {
        this._mq && this._mq.addListener(this._boundMQHandler)
    },
    _remove: function() {
        this._mq && this._mq.removeListener(this._boundMQHandler), this._mq = null
    },
    queryChanged: function() {
        this._remove();
        var e = this.query;
        e && (this.full || "(" === e[0] || (e = "(" + e + ")"), this._mq = window.matchMedia(e), this._add(), this.queryHandler(this._mq))
    },
    queryHandler: function(e) {
        this._setQueryMatches(e.matches)
    }
});
