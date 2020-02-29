
! function() {
    var e = null;
    Polymer({
        is: "paper-toast",
        behaviors: [Polymer.IronOverlayBehavior],
        properties: {
            fitInto: {
                type: Object,
                value: window,
                observer: "_onFitIntoChanged"
            },
            horizontalAlign: {
                type: String,
                value: "left"
            },
            verticalAlign: {
                type: String,
                value: "bottom"
            },
            duration: {
                type: Number,
                value: 3e3
            },
            text: {
                type: String,
                value: ""
            },
            noCancelOnOutsideClick: {
                type: Boolean,
                value: !0
            },
            noAutoFocus: {
                type: Boolean,
                value: !0
            }
        },
        listeners: {
            transitionend: "__onTransitionEnd"
        },
        get visible() {
            return Polymer.Base._warn("`visible` is deprecated, use `opened` instead"), this.opened
        },
        get _canAutoClose() {
            return this.duration > 0 && this.duration !== 1 / 0
        },
        created: function() {
            this._autoClose = null, Polymer.IronA11yAnnouncer.requestAvailability()
        },
        show: function(e) {
            "string" == typeof e && (e = {
                text: e
            });
            for (var t in e) 0 === t.indexOf("_") ? Polymer.Base._warn('The property "' + t + '" is private and was not set.') : t in this ? this[t] = e[t] : Polymer.Base._warn('The property "' + t + '" is not valid.');
            this.open()
        },
        hide: function() {
            this.close()
        },
        __onTransitionEnd: function(e) {
            e && e.target === this && "opacity" === e.propertyName && (this.opened ? this._finishRenderOpened() : this._finishRenderClosed())
        },
        _openedChanged: function() {
            null !== this._autoClose && (this.cancelAsync(this._autoClose), this._autoClose = null), this.opened ? (e && e !== this && e.close(), e = this, this.fire("iron-announce", {
                text: this.text
            }), this._canAutoClose && (this._autoClose = this.async(this.close, this.duration))) : e === this && (e = null), Polymer.IronOverlayBehaviorImpl._openedChanged.apply(this, arguments)
        },
        _renderOpened: function() {
            this.classList.add("paper-toast-open")
        },
        _renderClosed: function() {
            this.classList.remove("paper-toast-open")
        },
        _onFitIntoChanged: function(e) {
            this.positionTarget = e
        }
    })
}();
