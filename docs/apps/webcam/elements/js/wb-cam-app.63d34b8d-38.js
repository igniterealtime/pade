
Polymer({
    is: "fade-in-animation",
    behaviors: [Polymer.NeonAnimationBehavior],
    configure: function(i) {
        var e = i.node;
        return this._effect = new KeyframeEffect(e, [{
            opacity: "0"
        }, {
            opacity: "1"
        }], this.timingFromConfig(i)), this._effect
    }
});

Polymer({
    is: "fade-out-animation",
    behaviors: [Polymer.NeonAnimationBehavior],
    configure: function(e) {
        var i = e.node;
        return this._effect = new KeyframeEffect(i, [{
            opacity: "1"
        }, {
            opacity: "0"
        }], this.timingFromConfig(e)), this._effect
    }
});

Polymer({
    is: "paper-menu-grow-height-animation",
    behaviors: [Polymer.NeonAnimationBehavior],
    configure: function(e) {
        var i = e.node,
            t = i.getBoundingClientRect(),
            n = t.height;
        return this._effect = new KeyframeEffect(i, [{
            height: n / 2 + "px"
        }, {
            height: n + "px"
        }], this.timingFromConfig(e)), this._effect
    }
}), Polymer({
    is: "paper-menu-grow-width-animation",
    behaviors: [Polymer.NeonAnimationBehavior],
    configure: function(e) {
        var i = e.node,
            t = i.getBoundingClientRect(),
            n = t.width;
        return this._effect = new KeyframeEffect(i, [{
            width: n / 2 + "px"
        }, {
            width: n + "px"
        }], this.timingFromConfig(e)), this._effect
    }
}), Polymer({
    is: "paper-menu-shrink-width-animation",
    behaviors: [Polymer.NeonAnimationBehavior],
    configure: function(e) {
        var i = e.node,
            t = i.getBoundingClientRect(),
            n = t.width;
        return this._effect = new KeyframeEffect(i, [{
            width: n + "px"
        }, {
            width: n - n / 20 + "px"
        }], this.timingFromConfig(e)), this._effect
    }
}), Polymer({
    is: "paper-menu-shrink-height-animation",
    behaviors: [Polymer.NeonAnimationBehavior],
    configure: function(e) {
        var i = e.node,
            t = i.getBoundingClientRect(),
            n = t.height;
        t.top;
        return this.setPrefixedProperty(i, "transformOrigin", "0 0"), this._effect = new KeyframeEffect(i, [{
            height: n + "px",
            transform: "translateY(0)"
        }, {
            height: n / 2 + "px",
            transform: "translateY(-20px)"
        }], this.timingFromConfig(e)), this._effect
    }
});
