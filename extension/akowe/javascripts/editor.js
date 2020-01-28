/*jslint unparam: true*/
/*global navigator, dojoConfig: true, console, alert, widgets, Wodo, ClientAdaptor, kotypeGlobals*/

var usedLocale = "C";

if (navigator && navigator.language.match(/^(de)/)) {
    usedLocale = navigator.language.substr(0, 2);
}

dojoConfig = {
    locale: usedLocale,
    paths: {
        "webodf/editor": kotypeGlobals.urlPathPrefix + "/editor",
        "dijit": kotypeGlobals.urlPathPrefix + "/editor/dijit",
        "dojox": kotypeGlobals.urlPathPrefix + "/editor/dojox",
        "dojo": kotypeGlobals.urlPathPrefix + "/editor/dojo",
        "resources": kotypeGlobals.urlPathPrefix + "/resources"
    }
};

var kotypeEditor = (function () {
    "use strict";
    var editableTitle,
        exportButton,
        documentPermissions,
        statusLabel,
        editorInstance,
        editorOptions = {
            allFeaturesEnabled: true,
            collabEditingEnabled: true
        },
        clientAdaptor,
        onConnectCalled = false;

    function setWindowTitle(title) {
        if (!title) {
            title = "Untitled Document";
        }
        document.title = title;
    }

    function onEditingStarted() {
        [editableTitle, exportButton, statusLabel].forEach(function (widget) {
            widget.setSessionLoaded(true);
        });
        setWindowTitle(editorInstance.getMetadata("dc:title"));
    }

    function closeEditing() {
        editorInstance.leaveSession(function () {
            clientAdaptor.leaveSession(function () {
                console.debug("Closed editing, left session.");
            });
        });
    }

    function handleMetadataChanged(changes) {
        var title = changes.setProperties["dc:title"];

        if (title !== undefined) {
            setWindowTitle(title);
        }
    }

    function handleEditingError(error) {
        //alert("Something went wrong!\n" + error);
        console.error(error);
        closeEditing();
    }

    function initializeUI() {
        var navBarElement = goog.dom.getElement("navbar"),
            titleElement = goog.dom.getElement("documentTitle"),
            socket = clientAdaptor.getSocket();

        function getDocumentOriginalFileName() {
            return kotypeGlobals.documentOriginalFileName;
        }

        editableTitle = new widgets.EditableTitle(titleElement, editorInstance, socket);
        exportButton = new widgets.ExportButton(navBarElement, editorInstance, getDocumentOriginalFileName);
        documentPermissions = new widgets.DocumentPermissions(navBarElement, kotypeGlobals.user, socket);
        statusLabel = new widgets.StatusLabel(navBarElement, editorInstance, socket);
    }

    function openEditor() {
        Wodo.createCollabTextEditor("mainContainer", editorOptions, function (err, editor) {
            editorInstance = editor;

            initializeUI();

            editorInstance.addEventListener(Wodo.EVENT_UNKNOWNERROR, handleEditingError);
            editorInstance.addEventListener(Wodo.EVENT_METADATACHANGED, handleMetadataChanged);
            editorInstance.joinSession(clientAdaptor, onEditingStarted);
        });
    }

    function boot() {
        clientAdaptor = new ClientAdaptor(
            kotypeGlobals.documentId,
            kotypeGlobals.documentURL,
            kotypeGlobals.urlPathPrefix,
            function onConnect() {
                console.debug("onConnect");
                if (onConnectCalled) {
                    console.debug("Reconnecting not yet supported");
                    return;
                }
                onConnectCalled = true;

                clientAdaptor.joinSession(function (memberId) {
                    if (!memberId) {
                        console.debug("Could not join; memberId not received");
                    } else {
                        console.debug("Joined with memberId " + memberId);
                        openEditor();
                    }
                });
            },
            function onKick() {
                console.debug("onKick");
                closeEditing();
            },
            function onDisconnect() {
                console.debug("onDisconnect");
            }
        );
    }

    return {
        boot: boot
    };
}());
