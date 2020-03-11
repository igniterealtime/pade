var bgWindow = null, collab = {};

window.addEventListener("unload", function()
{
    sendOfMeet('{"event": "ofmeet.event.url.end"}');

    var setSetting = function(name, value)
    {
        window.localStorage["store.settings." + name] = JSON.stringify(value);
    }

    setSetting(location.href, {top: window.screenTop, left: window.screenLeft, width: window.outerWidth, height: window.outerHeight});
});

window.addEventListener("load", function()
{
    chrome.runtime.getBackgroundPage(function(win)
    {
        bgWindow = win;

        bgWindow._converse.connection.addHandler(function(message)
        {
            console.log("collab incoming xmpp", message);

            $(message).find('ofmeet').each(function ()
            {
                try {
                    handleCollabEvent(JSON.parse($(this).text()));

                } catch (e) {}
            });

            return true;

        }, "jabber:x:ofmeet", 'message');


        window.addEventListener('message', function (event)
        {
            console.log("addListener message", event.data);

            if (bgWindow && bgWindow._converse && bgWindow.pade.activeUrl && event.data)
            {
                event.data.from = bgWindow.pade.displayName ;
                event.data.username = bgWindow.pade.username;

                if (event.data.event == "ofmeet.event.pdf.ready" || event.data.event == "ofmeet.event.pdf.goto")
                {
                    event.data.owner = bgWindow.pade.username;
                    event.data.url = collab.url + "#" + event.data.page;
                    collab.currentUrl = event.data.url;
                    sendOfMeet(JSON.stringify(event.data));
                }
                else

                if (event.data.event == "ofmeet.event.url.ready")
                {
                    console.log("addListener message collab", event.data);

                    // Starts here. When content page is ready and we have content to share,
                    // we start mouse/key event feed

                    event.data.owner = collab.username;
                    collab.currentUrl = event.data.url;
                    sendOfMeet(JSON.stringify(event.data));

                    var ofMeetContent = document.getElementById("collab-content");

                    if (ofMeetContent)
                    {
                        ofMeetContent.contentWindow.postMessage({ action: 'ofmeet.action.url.setup', owner: event.data.owner, room: collab.roomName, user: bgWindow.pade.displayName, username: bgWindow.pade.username}, '*');
                    }
                }
                else {
                    sendOfMeet(JSON.stringify(event.data));
                }
            }
        });

        collab.url = urlParam("url");
        collab.jid = urlParam("jid");
        collab.documentOwner = urlParam("owner") == "true";

        var type = urlParam("type");
        collab.type = (type == "groupchat" || type == "chatroom") ? "groupchat" : "chat";

        var url = collab.url;

        if (collab.url.indexOf(".pdf") > -1)
        {
            url = chrome.extension.getURL("pdf/index.html?pdf=" + collab.url);
        }

        document.getElementById("collab-content").src = url;
        document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Collaboration | " + collab.url;


        console.log("collab ready", collab);
    });
});


function sendOfMeet(payload)
{
    var stanza = bgWindow.converse.env.$msg({to: collab.jid, type: collab.type});
    stanza.c("ofmeet", {xmlns: "jabber:x:ofmeet"}).t(payload);
    bgWindow._converse.connection.send(stanza);

    if (collab.jid.indexOf("@conference.") == -1)   // echo for one2one chat
    {
        handleCollabEvent(JSON.parse(payload))
    }
}

function handleCollabEvent(json)
{
    console.log("collab incoming json", json);

    if (json.event == "ofmeet.event.pdf.goto" || json.event == "ofmeet.event.pdf.ready" || json.event == "ofmeet.event.url.ready")
    {
        console.log("collab document share", json);

        var url = json.url;

        if (json.event == "ofmeet.event.pdf.goto" || json.event == "ofmeet.event.pdf.ready")
        {
            url = chrome.extension.getURL("pdf/index.html?pdf=" + json.url);
        }

        var ofMeetContent = document.getElementById("collab-content");

        if (json.event == "ofmeet.event.pdf.goto" || json.event == "ofmeet.event.pdf.ready")
        {
            // for PDF, we need echo to move page for owner
            ofMeetContent.contentWindow.location.href = url;
        }
    }
    else

    if (json.event == "ofmeet.event.url.end")
    {
        // end of session
    }
    else

    if (json.event == "ofmeet.event.pdf.message")
    {
        var ofMeetContent = document.getElementById("collab-content");

        if (ofMeetContent)
        {
            console.log("ofmeet.event.pdf.message", json);
            ofMeetContent.contentWindow.handlePdfShare(json.msg, json.from);
        }
    }
    else

    if (json.event == "ofmeet.event.url.message")
    {
        var ofMeetContent = document.getElementById("collab-content");

        if (ofMeetContent)
        {
            console.log("ofmeet.event.url.message", json);
            ofMeetContent.contentWindow.postMessage({ action: 'ofmeet.action.url.share', json: json}, '*');
        }
    }
}

function urlParam(name)
{
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (!results) { return undefined; }
    return unescape(results[1] || undefined);
};
