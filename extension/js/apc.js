var bgWindow = null;
var etherlynkobj = null;
var channel = null
var active = null;
var modals = ["Video Conference", "Screen Share", "Chat"]

window.addEventListener("beforeunload", function(e)
{
    console.log("popup unloaded");
    clearAllCalls();
    etherlynkobj.loaddefaults();
    e.returnValue = 'Ok';
});

window.addEventListener("load", function()
{
    document.title = chrome.i18n.getMessage('manifest_shortExtensionName') + " Communicator";

    chrome.runtime.getBackgroundPage(function(win)
    {
        bgWindow = win;

        etherlynkobj = document.getElementById('app-content');
        etherlynkobj.timeoutval=500;

        channel = chrome.runtime.connect();
        console.log("channel initialised", channel);

        channel.onMessage.addListener(function (message)
        {
            handleButtonState(message);
        });

        channel.onDisconnect.addListener(function()
        {
            console.log("channel disconnect");
        });

        document.body.addEventListener('etherlynk.ui.event', function (e)
        {
            if (e.detail.data1 == 176)     // slider events
            {
                handleSlider(e.detail.data2, e.detail.data3);
            }
        });

        document.body.addEventListener('etherlynk.event.held', function (e)
        {
            handleButtonHeld(e.detail.button);
        });


        document.body.addEventListener('etherlynk.event.buttondown', function (e)
        {
            handleButtonPress(e.detail.button);
        });

        document.body.addEventListener('webmidievent', function (e)
        {
            handleSlider(e.detail.data2, e.detail.data3);
        });

        setupApc();
    });
});


function setupApc()
{
    active = {page: 1, call: null, calls: {}, buttons: {}};

    var page = bgWindow.getSetting("selectedPage", 1);

    var buttonmap=[
      [null],
      [56,null],[57,null],[58,null],[59,null],[60,null],[61,null],[62,null],[63,null],   [82,null],
      [48,null],[49,null],[50,null],[51,null],[52,null],[53,null],[54,null],[55,null],   [83,null],
      [40,null],[41,null],[42,null],[43,null],[44,null],[45,null],[46,null],[47,null],   [84,null],
      [32,null],[33,null],[34,null],[35,null],[36,null],[37,null],[38,null],[39,null],   [85,null],
      [24,null],[25,null],[26,null],[27,null],[28,null],[29,null],[30,null],[31,null],   [86,null],
      [16,null],[17,null],[18,null],[19,null],[20,null],[21,null],[22,null],[23,null],   [87,null, modals[0]],
      [8,null] ,[9,null] ,[10,null],[11,null],[12,null],[13,null],[14,null],[15,null],   [88,null, modals[1]],
      [0,null] ,[1,null] ,[2,null] ,[3,null] ,[4,null] ,[5,null] ,[6,null] ,[7,null] ,   [89,null, modals[2]],

      [64,null],[65,null],[66,null],[67,null],[68,null],[69,null],[70,null],[71,null],   [98, "red", "Clear"]
    ]

    for (var p=1; p<6; p++)
    {
        if (bgWindow.getSetting("pageEnabled_" + p, false))
        {
            var label = bgWindow.getSetting("pageLabel_" + p, "Page " + p);
            var index = 81 + p;

            setButton([index, null, label], buttonmap);

            if (p == page)
            {
                setButton([index, "green", label], buttonmap);
                setPage(p, buttonmap);
            }
        }
    }

    if (bgWindow.getSetting("speakersEnabled", false))
    {
        for (var s=1; s<9; s++)
        {
            if (bgWindow.getSetting("speakerEnabled_" + s, false))
            {
                var label = bgWindow.getSetting("speakerLabel_" + s, "Blank");
                var value = bgWindow.getSetting("speakerValue_" + s, null);
                var index = 63 + s;

                setButton([index, null, label], buttonmap);
                setupConference(index, label, value);
            }
        }
    }

    etherlynkobj.data=buttonmap;
}

function setPage(p, buttonmap)
{
    for (var i=1; i<8; i++)     // row 8 is soft key area
    {
        for (var j=1; j<9; j++)
        {
            var index = ((i - 1) * 8) + (j - 1);
            setButton([index, null], buttonmap);

            if (bgWindow.getSetting("cellEnabled_" + p + "_" + i + "_" + j, false))
            {
                var label = bgWindow.getSetting("cellLabel_" + p + "_" + i + "_" + j, "Blank");
                var value = bgWindow.getSetting("cellValue_" + p + "_" + i + "_" + j, null);

                setButton([index, null, label], buttonmap);
                setupCall(p, index, label, value);
            }
        }
    }
}

function setButton(data, buttonmap)
{
    var index = buttonmap.findIndex(x => x[0]==data[0]);
    buttonmap[index]=data
}

function setupCall(page, index, label, value)
{
    console.log("setupCall", page, index, label, value);

    var call = {page: page, index: index, label: label, value: value, state: "disconnected", count: 0, missed: 0};

    active.calls[getName(value)] = call;
    active.buttons[index] = call;
}

function setupConference(index, label, value)
{
    console.log("setupConference", index, label, value);

    var conference = {page: 0, index: index, label: label, value: value, state: "disconnected"};

    active.calls[getName(value)] = conference;
    active.buttons[index] = conference;

    bgWindow.etherlynk.join(value, {mute: true});

}

function clearAllCalls()
{
    var items = Object.getOwnPropertyNames(active.calls);

    for(var z = 0; z<items.length; z++)
    {
        var call = active.calls[getName(items[z])];

        if (call.state == "connected" || call.state == "muted")
        {
            bgWindow.etherlynk.leave(call.value);
        }
    }
}

function handleButtonPress(button)
{
    console.log("handleButtonPress", button);

    if (button > 81 && button < 87)
    {
        handlePaging(button);
    }
    else

    if (button > 63 && button < 72)
    {
        handleConferenceAction(button);
    }
    else

    if (button > -1 && button < 64)
    {
        handleCallAction(button);
    }
    else

    if (button > 86 && button < 90)
    {
        handleModalSelection(button);
    }
    else

    if (button == 98)
    {
        if (active.call)
        {
            var call = active.calls[getName(active.call)];
            if (call) bgWindow.etherlynk.leave(call.value);
        }
    }
}

function handleModalSelection(button)
{
    console.log("handleModalSelection", button);

    // first reset all modals

    var buttonmap = etherlynkobj.data;

    for (var i=87; i<90; i++)
    {
        setButton([i, null, modals[i - 87]], buttonmap);
    }

    setButton([button, "green", modals[button - 87]], buttonmap);

    etherlynkobj.data=buttonmap;
}

function handlePaging(button)
{
    console.log("handlePaging", button);

    // paging key pressed

    var p = button - 81;

    if (bgWindow.getSetting("pageEnabled_" + p, false))
    {
        active.page = p;
        bgWindow.setSetting("selectedPage", p);
        var buttonmap = etherlynkobj.data;

        // first clear all pages

        for (var i=82; i<87; i++)
        {
            var page = i - 81;

            if (bgWindow.getSetting("pageEnabled_" + page, false))
            {
                var label = bgWindow.getSetting("pageLabel_" + page, "Page " + page);
                setButton([i, null, label], buttonmap);
            }
        }

        // then show selected page

        var label = bgWindow.getSetting("pageLabel_" + p, "Page " + p);
        setButton([button, "green", label], buttonmap);
        setPage(p, buttonmap);

        etherlynkobj.data=buttonmap;
    }
}

function handleSlider(slider, value)
{
    if (slider == 56)       // handset slider
    {
        if (active.call)
        {
            var audio = bgWindow.document.getElementById("remoteAudio-" + getName(active.call));
            if (audio) audio.volume = value /128;

            var audioSip = bgWindow.document.getElementById("remoteAudio-sip-" + getName(active.call));
            if (audioSip) audioSip.volume = value /128;
        }
    }
    else                // speakers

    if (slider > 47 && slider < 56)
    {
        var index = (slider - 47) + 63;

        if (active.buttons[index])
        {
            var id = active.buttons[index].value;

            var audio = bgWindow.document.getElementById("remoteAudio-" + id);
            if (audio) audio.volume = value /128;

            var audioSip = bgWindow.document.getElementById("remoteAudio-sip-" + id);
            if (audioSip) audioSip.volume = value /128;
        }
    }
}

function handleButtonState(message)
{
    console.log("handleButtonState", message);

    var call = active.calls[message.name];

    if (call)
    {
        if (active.page == call.page || call.page == 0)
        {
            console.log("handleButtonState call", call);
            var color = call.page != 0 ? "green" : "red";

            // XMPP

            if (message.event == "connected")
            {
                etherlynkobj.setbutton([call.index, color, call.label]);
                if (call.page != 0) active.call = call.value;
                call.count = 0;
                call.state = message.event;
            }
            else

            if (message.event == "disconnected")
            {
                etherlynkobj.setbutton([call.index, null, call.label]);
                active.call = null;
                call.count = 0;
                call.state = message.event;
            }
            else

            if (message.event == "joined")
            {
                call.count++;
                if (call.count > 0) etherlynkobj.setbutton([call.index, color, call.label, call.count]);
            }
            else

            if (message.event == "left")
            {
                call.count--;
                if (call.count > 0) etherlynkobj.setbutton([call.index, color, call.label, call.count]);
            }

            else

            if (message.event == "invited")
            {
                etherlynkobj.setbutton([call.index, color + "flash", call.label]);
                call.state = message.event;
            }

            // SIP

            if (message.event == "connecting")
            {
                etherlynkobj.setbutton([call.index, "greenflash", call.label]);
                call.state = message.event;
            }
            else

            if (message.event == "accepted")
            {
                if (call.page == 0)     // speaker
                {
                    var muted = bgWindow.etherlynk.muteLocal(message.id, true);
                    etherlynkobj.setbutton([call.index, muted ? "red": "redflash", call.label]);
                    call.state = muted ? "muted": message.event;

                } else {
                    active.call = call.value;
                    call.missed--;
                    etherlynkobj.setbutton([call.index, "green", call.label]);
                    call.state = message.event;
                }
            }
            else

            if (message.event == "bye" || message.event == "rejected" || message.event == "failed")
            {
                if (call.page != 0 && active.call == message.id) active.call = null;
                etherlynkobj.setbutton([call.index, call.count == 0 ? null : "yellow", call.label]);
                call.state = message.event;
            }

        } else {
            // soft keys TODO
        }
    }
}

function muteActiveCall(call)
{
    if (active.call && active.call != call.value)
    {
        var activeCall = active.calls[getName(active.call)];
        var badge = activeCall.count > 0 ? call.count : null;
        var muted = bgWindow.etherlynk.muteLocal(active.call, true);
        if (muted) activeCall.state = "muted";

        etherlynkobj.setbutton([activeCall.index, muted ? "red" : "green", activeCall.label, badge]);
    }
}

function handleButtonHeld(button)
{
    console.log("handleButtonHeld", button);

    if (active.buttons[button])
    {
        var call = active.buttons[button];
        if (call) bgWindow.etherlynk.leave(call.value);
    }
    else

    if (button > 86 && button < 90) // reset modal selection
    {
        etherlynkobj.setbutton([button, null, modals[button - 87]]);
    }
}

function handleConferenceAction(button)
{
    console.log("handleConferenceAction", button, active);

    if (active.buttons[button])
    {
        var call = active.buttons[button];
        var badge = call.count > 1 ? call.count : null;

        if (call.state == "disconnected")
        {
            bgWindow.etherlynk.join(call.value, {mute: true});
        }
        else

        if (call.state == "connecting" || call.state == "progress")
        {
            bgWindow.etherlynk.leave(call.value);
        }
        else

        if (call.state == "connected")
        {
            var muted = bgWindow.etherlynk.muteLocal(call.value, true);
            etherlynkobj.setbutton([call.index, muted ? "red" : "redflash", call.label, badge]);
            if (muted) call.state = "muted";
        }
        else

        if (call.state == "muted")
        {
            var muted = bgWindow.etherlynk.muteLocal(call.value, false);
            etherlynkobj.setbutton([call.index, muted ? "red" : "redflash", call.label, badge]);

            if (!muted)
            {
                call.state = "connected";
            }
        }
    }
}

function handleCallAction(button)
{
    console.log("handleCallAction", button, active);

    if (active.buttons[button])
    {
        var call = active.buttons[button];
        var badge = call.count > 1 ? call.count : null;

        if (call.state == "disconnected" || call.state == "invited")
        {
            if (notAudio(button, call) == false)
            {
                muteActiveCall(call);
                bgWindow.etherlynk.join(call.value, {}, call.state);
            }
        }
        else

        if (call.state == "connecting" || call.state == "progress")
        {
            bgWindow.etherlynk.leave(call.value);
        }
        else

        if (call.state == "connected")
        {
            var muted = bgWindow.etherlynk.muteLocal(call.value, true);
            etherlynkobj.setbutton([call.index, muted ? "red" : "green", call.label, badge]);
            if (muted) call.state = "muted";
        }
        else

        if (call.state == "muted")
        {
            muteActiveCall(call);

            var muted = bgWindow.etherlynk.muteLocal(call.value, false);
            etherlynkobj.setbutton([call.index, muted ? "red" : "green", call.label, badge]);

            if (!muted)
            {
                call.state = "connected";
                active.call = call.value;
            }
        }
    }
}

function getName(name)
{
    if (name.startsWith("https://") || name.startsWith("http://")) return name.split("/")[3];
    if (name.startsWith("tel:")) return name.substring(4);
    return name;
}

function getKeyColor(button)
{
    var color = null;

    for (var i=0; i<etherlynkobj.data.length; i++)
    {
        if (etherlynkobj.data[i] && button == etherlynkobj.data[i][0])
        {
            color = etherlynkobj.data[i][1]
        }
    }
    return color;
}

function notAudio(button, call)
{
    if (getKeyColor(87) == "green")
    {
        bgWindow.openVideoWindow(call.value)
        return true;
    }
    else

    if (getKeyColor(88) == "green")
    {
        bgWindow.openVideoWindow(call.value + "#config.startScreenSharing=true");
        return true;
    }
    else

    if (getKeyColor(89) == "green")
    {
       var url = getInverseUrl(call.value);
       console.log("notAudio", url, button, call);
       bgWindow.openChatWindow(url, true);
       return true;
    }

    return false;
}

function getInverseUrl(name)
{
    if (name.startsWith("https://") || name.startsWith("http://"))
    {
        var url = name.split("/");

        if (url.length == 4)
        {
            var jid = url[2].split(":");
            var domain = jid[0];

            if (jid[0].indexOf("@") > -1)
            {
                return "inverse/index.html#converse/chat?jid=" + jid[0];

            } else {
                return "inverse/index.html#converse/room?jid=" + url[3] + "@conference." + domain;
            }
        }
    }
    return "inverse/index.html#converse/room?jid=" + name + "@conference." + bgWindow.pade.domain;
}