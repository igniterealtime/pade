
! function() {
    "use strict";
    var e = {
            ANIMATION_CUBIC_BEZIER: "cubic-bezier(.3,.95,.5,1)",
            MAX_ANIMATION_TIME_MS: 400
        },
        n = Polymer({
            is: "paper-menu-button",
            behaviors: [Polymer.IronA11yKeysBehavior, Polymer.IronControlState],
            properties: {
                opened: {
                    type: Boolean,
                    value: !1,
                    notify: !0,
                    observer: "_openedChanged"
                },
                horizontalAlign: {
                    type: String,
                    value: "left",
                    reflectToAttribute: !0
                },
                verticalAlign: {
                    type: String,
                    value: "top",
                    reflectToAttribute: !0
                },
                dynamicAlign: {
                    type: Boolean
                },
                horizontalOffset: {
                    type: Number,
                    value: 0,
                    notify: !0
                },
                verticalOffset: {
                    type: Number,
                    value: 0,
                    notify: !0
                },
                noOverlap: {
                    type: Boolean
                },
                noAnimations: {
                    type: Boolean,
                    value: !1
                },
                ignoreSelect: {
                    type: Boolean,
                    value: !1
                },
                closeOnActivate: {
                    type: Boolean,
                    value: !1
                },
                openAnimationConfig: {
                    type: Object,
                    value: function() {
                        return [{
                            name: "fade-in-animation",
                            timing: {
                                delay: 100,
                                duration: 200
                            }
                        }, {
                            name: "paper-menu-grow-width-animation",
                            timing: {
                                delay: 100,
                                duration: 150,
                                easing: e.ANIMATION_CUBIC_BEZIER
                            }
                        }, {
                            name: "paper-menu-grow-height-animation",
                            timing: {
                                delay: 100,
                                duration: 275,
                                easing: e.ANIMATION_CUBIC_BEZIER
                            }
                        }]
                    }
                },
                closeAnimationConfig: {
                    type: Object,
                    value: function() {
                        return [{
                            name: "fade-out-animation",
                            timing: {
                                duration: 150
                            }
                        }, {
                            name: "paper-menu-shrink-width-animation",
                            timing: {
                                delay: 100,
                                duration: 50,
                                easing: e.ANIMATION_CUBIC_BEZIER
                            }
                        }, {
                            name: "paper-menu-shrink-height-animation",
                            timing: {
                                duration: 200,
                                easing: "ease-in"
                            }
                        }]
                    }
                },
                allowOutsideScroll: {
                    type: Boolean,
                    value: !1
                },
                restoreFocusOnClose: {
                    type: Boolean,
                    value: !0
                },
                _dropdownContent: {
                    type: Object
                }
            },
            hostAttributes: {
                role: "group",
                "aria-haspopup": "true"
            },
            listeners: {
                "iron-activate": "_onIronActivate",
                "iron-select": "_onIronSelect"
            },
            get contentElement() {
                return Polymer.dom(this.$.content).getDistributedNodes()[0]
            },
            toggle: function() {
                this.opened ? this.close() : this.open()
            },
            open: function() {
                this.disabled || this.$.dropdown.open()
            },
            close: function() {
                this.$.dropdown.close()
            },
            _onIronSelect: function(e) {
                this.ignoreSelect || this.close()
            },
            _onIronActivate: function(e) {
                this.closeOnActivate && this.close()
            },
            _openedChanged: function(e, n) {
                e ? (this._dropdownContent = this.contentElement, this.fire("paper-dropdown-open")) : null != n && this.fire("paper-dropdown-close")
            },
            _disabledChanged: function(e) {
                Polymer.IronControlState._disabledChanged.apply(this, arguments), e && this.opened && this.close()
            },
            __onIronOverlayCanceled: function(e) {
                var n = e.detail,
                    t = (Polymer.dom(n).rootTarget, this.$.trigger),
                    o = Polymer.dom(n).path;
                o.indexOf(t) > -1 && e.preventDefault()
            }
        });
    Object.keys(e).forEach(function(t) {
        n[t] = e[t]
    }), Polymer.PaperMenuButton = n
}();
