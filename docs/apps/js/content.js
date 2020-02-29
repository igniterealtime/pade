/* The chrome content script which can listen to the page dom events */

var channel = chrome.runtime.connect();

if (channel)
{
    channel.onMessage.addListener(function (message) {
        console.debug('ofmeet extension channel message', message);

        if (message.community && message.url)
        {
            console.log('pade- community chat installed', message);

            if (message.sidecar)
            {
                var script2 = document.createElement('script');
                script2.async = false;
                script2.innerHTML = "((window.gitter = {}).chat = {}).options = {room: 'dummy', activationElement: !" + message.disableButton + "}; window.pade = " + JSON.stringify(message) + ";"
                document.body.appendChild(script2);

                var script1 = document.createElement('script');
                script1.async = false;
                script1.src = message.url + "sidecar/dist/sidecar.js";
                document.body.appendChild(script1);
            }
            else {
                var script2 = document.createElement('script');
                script2.async = false;
                script2.innerHTML = "window.pade = " + JSON.stringify(message) + ";"
                document.body.appendChild(script2);

                var loadCSS = function(file)
                {
                    var css = document.createElement('link');
                    css.type = "text/css";
                    css.rel = "stylesheet";
                    css.href = message.url + file + ".css";
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
                    //div.class = "theme-concord";
                    document.body.appendChild(div);
                }

                loadCSS("inverse/css/font-awesome.min");
                loadCSS("inverse/css/converse");
                loadCSS("inverse/css/community");

                loadCSS("inverse/plugins/css/pade");
                loadCSS("inverse/plugins/css/marked");
                loadCSS("inverse/plugins/css/search");
                loadCSS("inverse/plugins/css/info");
                loadCSS("inverse/plugins/css/custom");

                loadJS("inverse/chrome");
                loadJS("inverse/plugins/themes");

                loadJS("inverse/dist/libsignal-protocol");
                loadJS("inverse/dist/converse");
                loadJS("inverse/dist/jquery.min");

                loadJS("inverse/plugins/info");
                loadJS("inverse/plugins/payments");
                loadJS("inverse/plugins/markdown");
                loadJS("inverse/plugins/canned");
                loadJS("inverse/plugins/search");
                loadJS("inverse/plugins/directory");
                loadJS("inverse/plugins/invite");
                loadJS("inverse/plugins/vmsg");
                loadJS("inverse/plugins/webmeet");
                loadJS("inverse/plugins/pade");

                loadJS("inverse/plugins/libs/paste");
                loadJS("inverse/plugins/libs/marked");
                loadJS("inverse/plugins/libs/marked-forms");
                loadJS("inverse/plugins/libs/to-markdown");
                loadJS("inverse/plugins/libs/clipboard2markdown");
                loadJS("inverse/index");

                loadDIV("conversejs");

          }
        }
        else window.postMessage(message, '*');
    });

    window.addEventListener('message', function (event) {
        //console.debug('ofmeet extension window message', event);

        if (event.source != window)
            return;
        if (!event.data || (event.data.action != 'pade.management.credential.api' && event.data.type != 'ofmeetGetScreen' && event.data.type != 'ofmeetCancelGetScreen' && event.data.type != 'ofmeetSetRequestorOn' && event.data.type != 'ofmeetSetRequestorOff' && event.data.type != 'ofmeetSetConfig' && event.data.type != 'ofmeetOpenPopup'  && event.data.type != 'ofmeetDrawAttention' && event.data.type != 'ofmeetPaste'))
            return;
        channel.postMessage(event.data);
    });
}
