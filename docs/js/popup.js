var bgWindow = chrome.extension ? chrome.extension.getBackgroundPage() : null;
var channel = null

window.addEventListener("unload", function()
{
    console.log("popup unloaded");
});

window.addEventListener("DOMContentLoaded", function()
{
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

    if (bgWindow)
    {
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

                location.href = bgWindow.getSetting("ofmeetUrl") + bgWindow.pade.activeContact.room;

            } else {
                location.href = bgWindow.getSetting("ofmeetUrl");
            }
        }
    }
});
