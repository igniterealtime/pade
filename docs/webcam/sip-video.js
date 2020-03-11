function clearActiveCall()
{
    if (window.sipSession)
    {
        if (window.sipSession.startTime) {
            window.sipSession.bye();

        } else if (window.sipSession.reject) {
            window.sipSession.reject();

        } else if (window.sipSession.cancel) {
            window.sipSession.cancel();
        }
    }
}

window.addEventListener("load", function()
{
    window.sipRoom = "lobby";
    var url = urlParam("url");

    if (url && (url.indexOf("tel:") == 0 || url.indexOf("sip:") == 0))
    {
       window.sipRoom = url.substring(4);
    }

    document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " SIP VideoConference | " + window.sipRoom;

    function urlParam(name)
    {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (!results) { return undefined; }
        return unescape(results[1] || undefined);
    }

    chrome.runtime.getBackgroundPage(function(win) {
        window.bgWindow = win;
        window.etherlynk = bgWindow.etherlynk;
        window.sipPhone = etherlynk.getSipUI();
    });

});

window.addEventListener("beforeunload", function()
{
   clearActiveCall()
})

window.addEventListener("unload", function()
{
    var setSetting = function(name, value)
    {
        window.localStorage["store.settings." + name] = JSON.stringify(value);
    }

    setSetting(location.href, {top: window.screenTop, left: window.screenLeft, width: window.outerWidth, height: window.outerHeight});

   clearActiveCall()

})