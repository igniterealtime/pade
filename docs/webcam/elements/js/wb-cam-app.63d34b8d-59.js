
Polymer({
    is: "paper-fab",
    behaviors: [Polymer.PaperButtonBehavior],
    properties: {
        src: {
            type: String,
            value: ""
        },
        icon: {
            type: String,
            value: ""
        },
        mini: {
            type: Boolean,
            value: !1,
            reflectToAttribute: !0
        },
        label: {
            type: String,
            observer: "_labelChanged"
        }
    },
    _labelChanged: function() {
        this.setAttribute("aria-label", this.label)
    },
    _computeIsIconFab: function(e, t) {
        return e.length > 0 || t.length > 0
    }
});
