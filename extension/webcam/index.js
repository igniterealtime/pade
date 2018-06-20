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