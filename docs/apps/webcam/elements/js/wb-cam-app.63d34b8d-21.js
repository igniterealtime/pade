Polymer({
    is: "paper-input-char-counter",
    behaviors: [Polymer.PaperInputAddonBehavior],
    properties: {
        _charCounterStr: {
            type: String,
            value: "0"
        }
    },
    update: function(t) {
        if (t.inputElement) {
            t.value = t.value || "";
            var e = t.value.toString().length.toString();
            t.inputElement.hasAttribute("maxlength") && (e += "/" + t.inputElement.getAttribute("maxlength")), this._charCounterStr = e
        }
    }
});
