
! function() {
    var e = {
        attached: function() {
            this._androidVideoAutoplayListener = this._onAndroidVideoAutoplayTap.bind(this), document.addEventListener("touchstart", this._androidVideoAutoplayListener, !0)
        },
        detached: function() {
            this._removeListener()
        },
        _removeListener: function() {
            document.removeEventListener("touchstart", this._androidVideoAutoplayListener, !0), delete this._androidVideoAutoplayListener
        },
        _onAndroidVideoAutoplayTap: function() {
            var e = this.src;
            this.src = "", this.play(), this.src = e, this._removeListener()
        }
    };
    Polymer({
        is: "android-video-autoplay",
        extends: "video",
        behaviors: [e]
    }), Polymer({
        is: "android-audio-autoplay",
        extends: "audio",
        behaviors: [e]
    })
}();
