
Polymer({
    is: "iron-pages",
    behaviors: [Polymer.IronResizableBehavior, Polymer.IronSelectableBehavior],
    properties: {
        activateEvent: {
            type: String,
            value: null
        }
    },
    observers: ["_selectedPageChanged(selected)"],
    _selectedPageChanged: function(e, a) {
        this.async(this.notifyResize)
    }
});
