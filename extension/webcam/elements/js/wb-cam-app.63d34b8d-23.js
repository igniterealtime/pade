
Polymer({
    is: "paper-input-error",
    behaviors: [Polymer.PaperInputAddonBehavior],
    properties: {
        invalid: {
            readOnly: !0,
            reflectToAttribute: !0,
            type: Boolean
        }
    },
    update: function(e) {
        this._setInvalid(e.invalid)
    }
});
