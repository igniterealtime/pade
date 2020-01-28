var kotypeGlobals = {
    urlPathPrefix: ".",
    documentId: "odttemplate.odt",
    documentOriginalFileName: "odttemplate.odt",
    documentURL: location.href.substring(0, location.href.lastIndexOf('/') + 1) + "odttemplate.odt",
    xmppConfig: {
        hosts: {
            domain: "meet.jit.si",
            muc: "conference.meet.jit.si",
        },
        p2p: {
            enabled: true,
            preferH264: true,
            disableH264: true,
            useStunTurn: true,
            stunServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" }
            ]
        },
        bosh: "wss://meet.jit.si/xmpp-websocket",
        clientNode: 'akowe'
    },
    user: {
        avatar_url: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+CiA8cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iIzU1NSIvPgogPGNpcmNsZSBjeD0iNjQiIGN5PSI0MSIgcj0iMjQiIGZpbGw9IiNmZmYiLz4KIDxwYXRoIGQ9Im0yOC41IDExMiB2LTEyIGMwLTEyIDEwLTI0IDI0LTI0IGgyMyBjMTQgMCAyNCAxMiAyNCAyNCB2MTIiIGZpbGw9IiNmZmYiLz4KPC9zdmc+Cg==",
        username: "unknown",
        name: "Unknown"
    }
};

window.addEventListener("load", function()
{
    function urlParam(name)
    {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (!results) { return undefined; }
        return unescape(results[1] || undefined);
    };

    if (urlParam("avatar")) kotypeGlobals.user.avatar_url = urlParam("avatar");
    if (urlParam("username")) kotypeGlobals.user.username = urlParam("username");
    if (urlParam("name")) kotypeGlobals.user.name = urlParam("name");

    if (urlParam("docname"))
    {
        const docname = urlParam("docname");
        kotypeGlobals.documentId = docname;
        kotypeGlobals.documentOriginalFileName = docname;
    }
    if (urlParam("docurl")) kotypeGlobals.documentURL = urlParam("docurl");

    if (urlParam("domain"))
    {
        const domain = urlParam("domain");
        kotypeGlobals.xmppConfig.hosts.domain = domain;
        kotypeGlobals.xmppConfig.hosts.muc = "conference." + domain;
        kotypeGlobals.xmppConfig.bosh = "wss://" + domain + "/xmpp-websocket"
    }
    if (urlParam("bosh")) kotypeGlobals.xmppConfig.bosh  = urlParam("bosh");

    document.querySelector(".logo").innerHTML = kotypeGlobals.documentId;

    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
    JitsiMeetJS.init({disableAudioLevels: true});
    kotypeEditor.boot();
});
