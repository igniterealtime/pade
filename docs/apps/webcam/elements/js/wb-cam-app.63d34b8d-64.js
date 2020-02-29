
Polymer({
    is: "paper-card",
    properties: {
        heading: {
            type: String,
            value: "",
            observer: "_headingChanged"
        },
        image: {
            type: String,
            value: ""
        },
        alt: {
            type: String
        },
        preloadImage: {
            type: Boolean,
            value: !1
        },
        fadeImage: {
            type: Boolean,
            value: !1
        },
        placeholderImage: {
            type: String,
            value: null
        },
        elevation: {
            type: Number,
            value: 1,
            reflectToAttribute: !0
        },
        animatedShadow: {
            type: Boolean,
            value: !1
        },
        animated: {
            type: Boolean,
            reflectToAttribute: !0,
            readOnly: !0,
            computed: "_computeAnimated(animatedShadow)"
        }
    },
    _isHidden: function(e) {
        return e ? "false" : "true"
    },
    _headingChanged: function(e) {
        var t = this.getAttribute("heading"),
            a = this.getAttribute("aria-label");
        "string" == typeof a && a !== t || this.setAttribute("aria-label", e)
    },
    _computeHeadingClass: function(e) {
        return e ? " over-image" : ""
    },
    _computeAnimated: function(e) {
        return e
    }
});
