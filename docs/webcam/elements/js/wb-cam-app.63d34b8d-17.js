
Polymer({
    is: "paper-icon-button",
    hostAttributes: {
        role: "button",
        tabindex: "0"
    },
    behaviors: [Polymer.PaperInkyFocusBehavior],
    properties: {
        src: {
            type: String
        },
        icon: {
            type: String
        },
        alt: {
            type: String,
            observer: "_altChanged"
        }
    },
    _altChanged: function(t, e) {
        var r = this.getAttribute("aria-label");
        r && e != r || this.setAttribute("aria-label", t)
    }
});
