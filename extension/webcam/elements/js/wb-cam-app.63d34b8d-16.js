
Polymer.PaperInkyFocusBehaviorImpl = {
    observers: ["_focusedChanged(receivedFocusFromKeyboard)"],
    _focusedChanged: function(e) {
        e && this.ensureRipple(), this.hasRipple() && (this._ripple.holdDown = e)
    },
    _createRipple: function() {
        var e = Polymer.PaperRippleBehavior._createRipple();
        return e.id = "ink", e.setAttribute("center", ""), e.classList.add("circle"), e
    }
}, Polymer.PaperInkyFocusBehavior = [Polymer.IronButtonState, Polymer.IronControlState, Polymer.PaperRippleBehavior, Polymer.PaperInkyFocusBehaviorImpl];
