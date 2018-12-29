window.addEventListener("load", function()
{
    function urlParam(name)
    {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (!results) { return undefined; }
        return unescape(results[1] || undefined);
    };

    var jid = urlParam("jid");
    var type = urlParam("type");
    var id = urlParam("id");

    console.log("Info - Chatbox", jid, type, id);
});
