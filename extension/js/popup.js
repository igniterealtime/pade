var bgWindow = null;
var channel = null

window.addEventListener("unload", function()
{
    console.log("popup unloaded");
});

window.addEventListener("DOMContentLoaded", function()
{
    chrome.runtime.getBackgroundPage(function(win)
    {
        bgWindow = win;

        channel = chrome.runtime.connect();

        console.log("channel initialised", channel);

        channel.postMessage({event: "pade.popup.open"});

        channel.onMessage.addListener(function (message)
        {

        });

        channel.onDisconnect.addListener(function()
        {
            console.log("channel disconnect");
        });

        if (bgWindow.getSetting("enableTouchPad", false))
        {
            if (bgWindow.getSetting("popupWindow", false))
            {
                chrome.browserAction.setPopup({popup: ""});
                openApcWindow();

            } else {
                location.href = "apc.html";
            }
        } else {

            if (bgWindow.pade.activeContact)
            {
                bgWindow.closeVideoWindow();

                if (bgWindow.pade.activeContact.type == "person")
                {
                    channel.postMessage({action: "pade.invite.contact"});
                }

                location.href = "jitsi-meet/chrome.index.html?room=" + bgWindow.pade.activeContact.room;

            } else {
                location.href = "jitsi-meet/chrome.index.html";
            }
        }

    });


});
