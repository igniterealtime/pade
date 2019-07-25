var bgWin = chrome.extension.getBackgroundPage();

window.addEventListener("unload", function()
{

});

window.addEventListener("load", function()
{
    var url = urlParam("url");
    var domain = bgWin.pade.domain;

    if (url && (url.indexOf("im:") == 0) && window.location.hash == "")
    {
        var jid = url.substring(3);
        if (jid.indexOf("@") == -1 && domain != null) jid = jid + "@" + domain;

        bgWin.openChat(jid);
    }
    else

    if (url && (url.indexOf("xmpp:") == 0) && window.location.hash == "")
    {
        jid = url.substring(5);
        if (jid.indexOf("@") == -1 && domain != null) jid = jid + "@" + "conference." + domain;

        bgWin.openGroupChat(jid);
    }

    window.close();
});

function urlParam(name)
{
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (!results) { return undefined; }
    return unescape(results[1] || undefined);
};
