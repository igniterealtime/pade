
Polymer({
    is: "iron-icon",
    properties: {
        icon: {
            type: String
        },
        theme: {
            type: String
        },
        src: {
            type: String
        },
        _meta: {
            value: Polymer.Base.create("iron-meta", {
                type: "iconset"
            })
        }
    },
    observers: ["_updateIcon(_meta, isAttached)", "_updateIcon(theme, isAttached)", "_srcChanged(src, isAttached)", "_iconChanged(icon, isAttached)"],
    _DEFAULT_ICONSET: "icons",
    _iconChanged: function(t) {
        var i = (t || "").split(":");
        this._iconName = i.pop(), this._iconsetName = i.pop() || this._DEFAULT_ICONSET, this._updateIcon()
    },
    _srcChanged: function(t) {
        this._updateIcon()
    },
    _usesIconset: function() {
        return this.icon || !this.src
    },
    _updateIcon: function() {
        this._usesIconset() ? (this._img && this._img.parentNode && Polymer.dom(this.root).removeChild(this._img), "" === this._iconName ? this._iconset && this._iconset.removeIcon(this) : this._iconsetName && this._meta && (this._iconset = this._meta.byKey(this._iconsetName), this._iconset ? (this._iconset.applyIcon(this, this._iconName, this.theme), this.unlisten(window, "iron-iconset-added", "_updateIcon")) : this.listen(window, "iron-iconset-added", "_updateIcon"))) : (this._iconset && this._iconset.removeIcon(this), this._img || (this._img = document.createElement("img"), this._img.style.width = "100%", this._img.style.height = "100%", this._img.draggable = !1), this._img.src = this.src, Polymer.dom(this.root).appendChild(this._img))
    }
});
