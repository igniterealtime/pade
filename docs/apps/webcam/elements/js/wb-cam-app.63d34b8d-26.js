
Polymer({
    is: "paper-textarea",
    behaviors: [Polymer.PaperInputBehavior, Polymer.IronFormElementBehavior],
    properties: {
        _ariaLabelledBy: {
            observer: "_ariaLabelledByChanged",
            type: String
        },
        _ariaDescribedBy: {
            observer: "_ariaDescribedByChanged",
            type: String
        },
        rows: {
            type: Number,
            value: 1
        },
        maxRows: {
            type: Number,
            value: 0
        }
    },
    _ariaLabelledByChanged: function(e) {
        this.$.input.textarea.setAttribute("aria-labelledby", e)
    },
    _ariaDescribedByChanged: function(e) {
        this.$.input.textarea.setAttribute("aria-describedby", e)
    },
    get _focusableElement() {
        return this.$.input.textarea
    }
});

Polymer.PaperItemBehaviorImpl = {
    hostAttributes: {
        role: "option",
        tabindex: "0"
    }
}, Polymer.PaperItemBehavior = [Polymer.IronButtonState, Polymer.IronControlState, Polymer.PaperItemBehaviorImpl];
