window.addEventListener("load", function()
{
    document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Audio/Video Capture Tool";

    function urlParam(name)
    {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (!results) { return undefined; }
        return unescape(results[1] || undefined);
    }

});

window.addEventListener("unload", function() {

    var setSetting = function(name, value)
    {
        window.localStorage["store.settings." + name] = JSON.stringify(value);
    }

    setSetting(location.href, {top: window.screenTop, left: window.screenLeft, width: window.outerWidth, height: window.outerHeight});
});