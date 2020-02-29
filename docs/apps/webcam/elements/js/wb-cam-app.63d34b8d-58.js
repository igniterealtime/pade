
! function() {
    var e = {
            GOOGLE: "google",
            PLUS: "google-plus"
        },
        n = {
            STANDARD: "Sign in",
            WIDE: "Sign in with Google",
            WIDE_PLUS: "Sign in with Google+"
        },
        t = {
            ICON_ONLY: "iconOnly",
            STANDARD: "standard",
            WIDE: "wide"
        };
    Polymer({
        is: "google-signin",
        properties: {
            appPackageName: {
                type: String,
                value: ""
            },
            brand: {
                type: String,
                value: ""
            },
            _brand: {
                type: String,
                computed: "_computeBrand(brand, hasPlusScopes)"
            },
            clientId: {
                type: String,
                value: ""
            },
            cookiePolicy: {
                type: String,
                value: ""
            },
            height: {
                type: String,
                value: "standard"
            },
            fill: {
                type: Boolean,
                value: !0
            },
            labelAdditional: {
                type: String,
                value: "Additional permissions required"
            },
            labelSignin: {
                type: String,
                value: ""
            },
            _labelSignin: {
                type: String,
                computed: "_computeSigninLabel(labelSignin, width, _brand)"
            },
            labelSignout: {
                type: String,
                value: "Sign out"
            },
            raised: {
                type: Boolean,
                value: !1
            },
            requestVisibleActions: {
                type: String,
                value: ""
            },
            hostedDomain: {
                type: String,
                value: ""
            },
            offline: {
                type: Boolean,
                value: !1
            },
            offlineAlwaysPrompt: {
                type: Boolean,
                value: !1
            },
            scopes: {
                type: String,
                value: ""
            },
            openidPrompt: {
                type: String,
                value: ""
            },
            theme: {
                type: String,
                value: "light"
            },
            width: {
                type: String,
                value: "standard"
            },
            _brandIcon: {
                type: String,
                computed: "_computeIcon(_brand)"
            },
            hasPlusScopes: {
                type: Boolean,
                notify: !0,
                value: !1
            },
            needAdditionalAuth: {
                type: Boolean,
                notify: !0,
                value: !1
            },
            signedIn: {
                type: Boolean,
                notify: !0,
                value: !1,
                observer: "_observeSignedIn"
            },
            isAuthorized: {
                type: Boolean,
                notify: !0,
                value: !1
            }
        },
        _computeButtonClass: function(e, n, t, i, o, u) {
            return "height-" + e + " width-" + n + " theme-" + t + " signedIn-" + i + " brand-" + o + "  additionalAuth-" + u
        },
        _computeIcon: function(e) {
            return "google:" + e
        },
        _computeButtonIsSignIn: function(e, n) {
            return !e
        },
        _computeButtonIsSignOut: function(e, n) {
            return e && !n
        },
        _computeButtonIsSignOutAddl: function(e, n) {
            return e && n
        },
        _computeBrand: function(n, t) {
            var i;
            return i = n ? n : t ? e.PLUS : e.GOOGLE
        },
        _observeSignedIn: function(e, n) {
            e ? (this.needAdditionalAuth && this.fire("google-signin-necessary"), this.fire("google-signin-success")) : this.fire("google-signed-out")
        },
        _computeSigninLabel: function(i, o, u) {
            if (i) return i;
            switch (o) {
                case t.WIDE:
                    return u == e.PLUS ? n.WIDE_PLUS : n.WIDE;
                case t.STANDARD:
                    return n.STANDARD;
                case t.ICON_ONLY:
                    return "";
                default:
                    return console.warn("bad width value: ", o), n.STANDARD
            }
        },
        signIn: function() {
            this.$.aware.signIn()
        },
        _signInKeyPress: function(e) {
            13 != e.which && 13 != e.keyCode && 32 != e.which && 32 != e.keyCode || (e.preventDefault(), this.signIn())
        },
        signOut: function() {
            this.fire("google-signout-attempted"), this.$.aware.signOut()
        },
        _signOutKeyPress: function(e) {
            13 != e.which && 13 != e.keyCode && 32 != e.which && 32 != e.keyCode || (e.preventDefault(), this.signOut())
        }
    })
}();
