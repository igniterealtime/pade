/* The chrome content script which can listen to the page dom events */

var channel = chrome.runtime.connect();

if (channel)
{
    channel.onMessage.addListener(function (message) {
        console.log('ofmeet extension channel message', message);

        if (message.community && message.url)
        {
            console.log('pade- community chat installed', message);

            if (message.sidecar)
            {
                var script2 = document.createElement('script');
                script2.innerHTML = "((window.gitter = {}).chat = {}).options = {room: 'dummy'}; window.pade = " + JSON.stringify(message) + ";"
                document.body.appendChild(script2);

                setTimeout(function()
                {
                    var script1 = document.createElement('script');
                    script1.src = message.url + "sidecar/dist/sidecar.js";
                    document.body.appendChild(script1);

                }, 1000);
            }
            else {
                var script2 = document.createElement('script');
                script2.innerHTML = "window.pade = " + JSON.stringify(message) + ";"
                document.body.appendChild(script2);

                var loadCSS = function(file)
                {
                    var css = document.createElement('link');
                    css.type = "text/css";
                    css.rel = "stylesheet";
                    css.href = message.url + "inverse/css/" + file + ".css";
                    document.body.appendChild(css);
                }

                var loadJS = function(file)
                {
                    var s1 = document.createElement('script');
                    s1.src = message.url + file + ".js";
                    s1.async = false;
                    document.body.appendChild(s1);
                }

                var loadDIV = function(id)
                {
                    var div = document.createElement('div');
                    div.id = id;
                    document.body.appendChild(div);
                }

                loadCSS("font-awesome.min");
                loadCSS("converse");
                loadCSS("community");

                loadJS("inverse/dist/libsignal-protocol");
                loadJS("inverse/dist/converse");
                loadJS("inverse/dist/jquery.min");
                loadJS("inverse/plugins/webmeet");
                loadJS("inverse/plugins/pade");
                loadJS("inverse/plugins/libs/paste");
                loadJS("inverse/index");

                loadDIV("conversejs");

          }
        }
        else window.postMessage(message, '*');
    });

    window.addEventListener('message', function (event) {
        if (event.source != window)
            return;
        if (!event.data || (event.data.type != 'ofmeetGetScreen' && event.data.type != 'ofmeetCancelGetScreen' && event.data.type != 'ofmeetSetRequestorOn' && event.data.type != 'ofmeetSetRequestorOff' && event.data.type != 'ofmeetSetConfig' && event.data.type != 'ofmeetOpenPopup'  && event.data.type != 'ofmeetDrawAttention' && event.data.type != 'ofmeetPaste'))
            return;
        channel.postMessage(event.data);
    });
}

if (!document.getElementById("ofmeet-extension-installed"))
{
    var div = document.createElement('div');
    div.id = "ofmeet-extension-installed";
    div.style = "display: none;";
    document.body.appendChild(div);
}

