
! function() {
    function t(t) {
        this.element = t, this.width = this.boundingRect.width, this.height = this.boundingRect.height, this.size = Math.max(this.width, this.height)
    }

    function i(t) {
        this.element = t, this.color = window.getComputedStyle(t).color, this.wave = document.createElement("div"), this.waveContainer = document.createElement("div"), this.wave.style.backgroundColor = this.color, this.wave.classList.add("wave"), this.waveContainer.classList.add("wave-container"), Polymer.dom(this.waveContainer).appendChild(this.wave), this.resetInteractionState()
    }
    var e = {
        distance: function(t, i, e, n) {
            var s = t - e,
                o = i - n;
            return Math.sqrt(s * s + o * o)
        },
        now: window.performance && window.performance.now ? window.performance.now.bind(window.performance) : Date.now
    };
    t.prototype = {
        get boundingRect() {
            return this.element.getBoundingClientRect()
        },
        furthestCornerDistanceFrom: function(t, i) {
            var n = e.distance(t, i, 0, 0),
                s = e.distance(t, i, this.width, 0),
                o = e.distance(t, i, 0, this.height),
                a = e.distance(t, i, this.width, this.height);
            return Math.max(n, s, o, a)
        }
    }, i.MAX_RADIUS = 300, i.prototype = {
        get recenters() {
            return this.element.recenters
        },
        get center() {
            return this.element.center
        },
        get mouseDownElapsed() {
            var t;
            return this.mouseDownStart ? (t = e.now() - this.mouseDownStart, this.mouseUpStart && (t -= this.mouseUpElapsed), t) : 0
        },
        get mouseUpElapsed() {
            return this.mouseUpStart ? e.now() - this.mouseUpStart : 0
        },
        get mouseDownElapsedSeconds() {
            return this.mouseDownElapsed / 1e3
        },
        get mouseUpElapsedSeconds() {
            return this.mouseUpElapsed / 1e3
        },
        get mouseInteractionSeconds() {
            return this.mouseDownElapsedSeconds + this.mouseUpElapsedSeconds
        },
        get initialOpacity() {
            return this.element.initialOpacity
        },
        get opacityDecayVelocity() {
            return this.element.opacityDecayVelocity
        },
        get radius() {
            var t = this.containerMetrics.width * this.containerMetrics.width,
                e = this.containerMetrics.height * this.containerMetrics.height,
                n = 1.1 * Math.min(Math.sqrt(t + e), i.MAX_RADIUS) + 5,
                s = 1.1 - .2 * (n / i.MAX_RADIUS),
                o = this.mouseInteractionSeconds / s,
                a = n * (1 - Math.pow(80, -o));
            return Math.abs(a)
        },
        get opacity() {
            return this.mouseUpStart ? Math.max(0, this.initialOpacity - this.mouseUpElapsedSeconds * this.opacityDecayVelocity) : this.initialOpacity
        },
        get outerOpacity() {
            var t = .3 * this.mouseUpElapsedSeconds,
                i = this.opacity;
            return Math.max(0, Math.min(t, i))
        },
        get isOpacityFullyDecayed() {
            return this.opacity < .01 && this.radius >= Math.min(this.maxRadius, i.MAX_RADIUS)
        },
        get isRestingAtMaxRadius() {
            return this.opacity >= this.initialOpacity && this.radius >= Math.min(this.maxRadius, i.MAX_RADIUS)
        },
        get isAnimationComplete() {
            return this.mouseUpStart ? this.isOpacityFullyDecayed : this.isRestingAtMaxRadius
        },
        get translationFraction() {
            return Math.min(1, this.radius / this.containerMetrics.size * 2 / Math.sqrt(2))
        },
        get xNow() {
            return this.xEnd ? this.xStart + this.translationFraction * (this.xEnd - this.xStart) : this.xStart
        },
        get yNow() {
            return this.yEnd ? this.yStart + this.translationFraction * (this.yEnd - this.yStart) : this.yStart
        },
        get isMouseDown() {
            return this.mouseDownStart && !this.mouseUpStart
        },
        resetInteractionState: function() {
            this.maxRadius = 0, this.mouseDownStart = 0, this.mouseUpStart = 0, this.xStart = 0, this.yStart = 0, this.xEnd = 0, this.yEnd = 0, this.slideDistance = 0, this.containerMetrics = new t(this.element)
        },
        draw: function() {
            var t, i, e;
            this.wave.style.opacity = this.opacity, t = this.radius / (this.containerMetrics.size / 2), i = this.xNow - this.containerMetrics.width / 2, e = this.yNow - this.containerMetrics.height / 2, this.waveContainer.style.webkitTransform = "translate(" + i + "px, " + e + "px)", this.waveContainer.style.transform = "translate3d(" + i + "px, " + e + "px, 0)", this.wave.style.webkitTransform = "scale(" + t + "," + t + ")", this.wave.style.transform = "scale3d(" + t + "," + t + ",1)"
        },
        downAction: function(t) {
            var i = this.containerMetrics.width / 2,
                n = this.containerMetrics.height / 2;
            this.resetInteractionState(), this.mouseDownStart = e.now(), this.center ? (this.xStart = i, this.yStart = n, this.slideDistance = e.distance(this.xStart, this.yStart, this.xEnd, this.yEnd)) : (this.xStart = t ? t.detail.x - this.containerMetrics.boundingRect.left : this.containerMetrics.width / 2, this.yStart = t ? t.detail.y - this.containerMetrics.boundingRect.top : this.containerMetrics.height / 2), this.recenters && (this.xEnd = i, this.yEnd = n, this.slideDistance = e.distance(this.xStart, this.yStart, this.xEnd, this.yEnd)), this.maxRadius = this.containerMetrics.furthestCornerDistanceFrom(this.xStart, this.yStart), this.waveContainer.style.top = (this.containerMetrics.height - this.containerMetrics.size) / 2 + "px", this.waveContainer.style.left = (this.containerMetrics.width - this.containerMetrics.size) / 2 + "px", this.waveContainer.style.width = this.containerMetrics.size + "px", this.waveContainer.style.height = this.containerMetrics.size + "px"
        },
        upAction: function(t) {
            this.isMouseDown && (this.mouseUpStart = e.now())
        },
        remove: function() {
            Polymer.dom(this.waveContainer.parentNode).removeChild(this.waveContainer)
        }
    }, Polymer({
        is: "paper-ripple",
        behaviors: [Polymer.IronA11yKeysBehavior],
        properties: {
            initialOpacity: {
                type: Number,
                value: .25
            },
            opacityDecayVelocity: {
                type: Number,
                value: .8
            },
            recenters: {
                type: Boolean,
                value: !1
            },
            center: {
                type: Boolean,
                value: !1
            },
            ripples: {
                type: Array,
                value: function() {
                    return []
                }
            },
            animating: {
                type: Boolean,
                readOnly: !0,
                reflectToAttribute: !0,
                value: !1
            },
            holdDown: {
                type: Boolean,
                value: !1,
                observer: "_holdDownChanged"
            },
            noink: {
                type: Boolean,
                value: !1
            },
            _animating: {
                type: Boolean
            },
            _boundAnimate: {
                type: Function,
                value: function() {
                    return this.animate.bind(this)
                }
            }
        },
        get target() {
            return this.keyEventTarget
        },
        keyBindings: {
            "enter:keydown": "_onEnterKeydown",
            "space:keydown": "_onSpaceKeydown",
            "space:keyup": "_onSpaceKeyup"
        },
        attached: function() {
            11 == this.parentNode.nodeType ? this.keyEventTarget = Polymer.dom(this).getOwnerRoot().host : this.keyEventTarget = this.parentNode;
            var t = this.keyEventTarget;
            this.listen(t, "up", "uiUpAction"), this.listen(t, "down", "uiDownAction")
        },
        detached: function() {
            this.unlisten(this.keyEventTarget, "up", "uiUpAction"), this.unlisten(this.keyEventTarget, "down", "uiDownAction"), this.keyEventTarget = null
        },
        get shouldKeepAnimating() {
            for (var t = 0; t < this.ripples.length; ++t)
                if (!this.ripples[t].isAnimationComplete) return !0;
            return !1
        },
        simulatedRipple: function() {
            this.downAction(null), this.async(function() {
                this.upAction()
            }, 1)
        },
        uiDownAction: function(t) {
            this.noink || this.downAction(t)
        },
        downAction: function(t) {
            if (!(this.holdDown && this.ripples.length > 0)) {
                var i = this.addRipple();
                i.downAction(t), this._animating || (this._animating = !0, this.animate())
            }
        },
        uiUpAction: function(t) {
            this.noink || this.upAction(t)
        },
        upAction: function(t) {
            this.holdDown || (this.ripples.forEach(function(i) {
                i.upAction(t)
            }), this._animating = !0, this.animate())
        },
        onAnimationComplete: function() {
            this._animating = !1, this.$.background.style.backgroundColor = null, this.fire("transitionend")
        },
        addRipple: function() {
            var t = new i(this);
            return Polymer.dom(this.$.waves).appendChild(t.waveContainer), this.$.background.style.backgroundColor = t.color, this.ripples.push(t), this._setAnimating(!0), t
        },
        removeRipple: function(t) {
            var i = this.ripples.indexOf(t);
            i < 0 || (this.ripples.splice(i, 1), t.remove(), this.ripples.length || this._setAnimating(!1))
        },
        animate: function() {
            if (this._animating) {
                var t, i;
                for (t = 0; t < this.ripples.length; ++t) i = this.ripples[t], i.draw(), this.$.background.style.opacity = i.outerOpacity, i.isOpacityFullyDecayed && !i.isRestingAtMaxRadius && this.removeRipple(i);
                this.shouldKeepAnimating || 0 !== this.ripples.length ? window.requestAnimationFrame(this._boundAnimate) : this.onAnimationComplete()
            }
        },
        _onEnterKeydown: function() {
            this.uiDownAction(), this.async(this.uiUpAction, 1)
        },
        _onSpaceKeydown: function() {
            this.uiDownAction()
        },
        _onSpaceKeyup: function() {
            this.uiUpAction()
        },
        _holdDownChanged: function(t, i) {
            void 0 !== i && (t ? this.downAction() : this.upAction())
        }
    })
}();


Polymer.PaperRippleBehavior = {
    properties: {
        noink: {
            type: Boolean,
            observer: "_noinkChanged"
        },
        _rippleContainer: {
            type: Object
        }
    },
    _buttonStateChanged: function() {
        this.focused && this.ensureRipple()
    },
    _downHandler: function(e) {
        Polymer.IronButtonStateImpl._downHandler.call(this, e), this.pressed && this.ensureRipple(e)
    },
    ensureRipple: function(e) {
        if (!this.hasRipple()) {
            this._ripple = this._createRipple(), this._ripple.noink = this.noink;
            var i = this._rippleContainer || this.root;
            if (i && Polymer.dom(i).appendChild(this._ripple), e) {
                var n = Polymer.dom(this._rippleContainer || this),
                    t = Polymer.dom(e).rootTarget;
                n.deepContains(t) && this._ripple.uiDownAction(e)
            }
        }
    },
    getRipple: function() {
        return this.ensureRipple(), this._ripple
    },
    hasRipple: function() {
        return Boolean(this._ripple)
    },
    _createRipple: function() {
        return document.createElement("paper-ripple")
    },
    _noinkChanged: function(e) {
        this.hasRipple() && (this._ripple.noink = e)
    }
};


Polymer.PaperButtonBehaviorImpl = {
    properties: {
        elevation: {
            type: Number,
            reflectToAttribute: !0,
            readOnly: !0
        }
    },
    observers: ["_calculateElevation(focused, disabled, active, pressed, receivedFocusFromKeyboard)", "_computeKeyboardClass(receivedFocusFromKeyboard)"],
    hostAttributes: {
        role: "button",
        tabindex: "0",
        animated: !0
    },
    _calculateElevation: function() {
        var e = 1;
        this.disabled ? e = 0 : this.active || this.pressed ? e = 4 : this.receivedFocusFromKeyboard && (e = 3), this._setElevation(e)
    },
    _computeKeyboardClass: function(e) {
        this.toggleClass("keyboard-focus", e)
    },
    _spaceKeyDownHandler: function(e) {
        Polymer.IronButtonStateImpl._spaceKeyDownHandler.call(this, e), this.hasRipple() && this.getRipple().ripples.length < 1 && this._ripple.uiDownAction()
    },
    _spaceKeyUpHandler: function(e) {
        Polymer.IronButtonStateImpl._spaceKeyUpHandler.call(this, e), this.hasRipple() && this._ripple.uiUpAction()
    }
}, Polymer.PaperButtonBehavior = [Polymer.IronButtonState, Polymer.IronControlState, Polymer.PaperRippleBehavior, Polymer.PaperButtonBehaviorImpl];
