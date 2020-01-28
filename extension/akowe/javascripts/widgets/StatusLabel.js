/*global goog, widgets, document*/
goog.provide("widgets.StatusLabel");

widgets.StatusLabel = function (parentElement, editorInstance, socket) {
    "use strict";
    var sessionLoaded = false,
        statusLabel,
        textNode,
        statusType,
        isEditorAvailable;

    function setText(text) {
        textNode.textContent = text;
    }

    function getFuzzyDuration(d1, d2) {
        return moment.duration(d2 - d1, "milliseconds").humanize();
    }

    function showLastEditStatus() {
        var creator, date;

        if (isEditorAvailable) {
            creator = editorInstance.getMetadata("dc:creator");
            date = editorInstance.getMetadata("dc:date");
        }

        if (creator && date) {
            statusType = "lastedit";
            setText("Last edited by " + creator + " " + getFuzzyDuration(Date.parse(date), Date.now()) + " ago.");
        }
    }

    function handleKick() {
        isEditorAvailable = false;
        setText("Your access to this document has been revoked.");
    }

    this.setSessionLoaded = function (_sessionLoaded) {
        sessionLoaded = _sessionLoaded;
    };

    function init() {
        isEditorAvailable = true;

        statusLabel = document.createElement("span");
        statusLabel.className = "status";
        textNode = document.createTextNode('');
        statusLabel.appendChild(textNode);
        parentElement.appendChild(statusLabel);

        editorInstance.addEventListener(Wodo.EVENT_METADATACHANGED, function (changes) {
            var creator = changes.setProperties["dc:creator"],
                date = changes.setProperties["dc:date"];

            if ((creator !== undefined) || (date !== undefined)) {
                showLastEditStatus();
            }
        });

        socket.on("kick", handleKick);

        setInterval(function () {
            if (statusType === "lastedit") {
                showLastEditStatus();
            }
        }, 1000);
    }
    init();
};

goog.exportSymbol("widgets.StatusLabel", widgets.StatusLabel);
