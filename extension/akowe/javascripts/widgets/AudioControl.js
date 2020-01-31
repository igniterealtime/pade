goog.provide("widgets.AudioControl");

goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuButton');
goog.require('goog.ui.Css3MenuButtonRenderer');

widgets.AudioControl = function (parentElement, editorInstance) {
    "use strict";
    var sessionLoaded = false, menu, button, muted = false;

    this.setSessionLoaded = function (_sessionLoaded) {
        sessionLoaded = _sessionLoaded;
    };

    function init() {
        // Menu button
        button = new goog.ui.CustomButton("Mute", new goog.ui.Css3ButtonRenderer());
        button.render(parentElement);
        button.getElement().classList.add('button');
        button.getElement().classList.add('green');
        button.getElement().style.color = "white";
        button.getElement().style.backgroundColor ="green";

        goog.events.listen(button, goog.ui.Component.EventType.ACTION, function (e)
        {
            kotypeGlobals.localTracks.forEach(function(flow)
            {
                console.debug("mute audio", flow.track, muted);

                const flag = muted ? flow.unmute() : flow.mute();
                button.getElement().innerHTML = muted ? "Mute" : "Unmute";
                button.getElement().style.backgroundColor = muted ? "green" : "red";
                muted = !muted;
            });
        });

        button.setVisible(false);
        if (kotypeGlobals.audio) button.setVisible(true);
    }

    init();
};

goog.exportSymbol("widgets.AudioControl", widgets.AudioControl);
