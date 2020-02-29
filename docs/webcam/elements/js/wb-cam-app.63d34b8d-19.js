
! function() {
    "use strict";
    Polymer.IronA11yAnnouncer = Polymer({
        is: "iron-a11y-announcer",
        properties: {
            mode: {
                type: String,
                value: "polite"
            },
            _text: {
                type: String,
                value: ""
            }
        },
        created: function() {
            Polymer.IronA11yAnnouncer.instance || (Polymer.IronA11yAnnouncer.instance = this), document.body.addEventListener("iron-announce", this._onIronAnnounce.bind(this))
        },
        announce: function(n) {
            this._text = "", this.async(function() {
                this._text = n
            }, 100)
        },
        _onIronAnnounce: function(n) {
            n.detail && n.detail.text && this.announce(n.detail.text)
        }
    }), Polymer.IronA11yAnnouncer.instance = null, Polymer.IronA11yAnnouncer.requestAvailability = function() {
        Polymer.IronA11yAnnouncer.instance || (Polymer.IronA11yAnnouncer.instance = document.createElement("iron-a11y-announcer")), document.body.appendChild(Polymer.IronA11yAnnouncer.instance)
    }
}();

