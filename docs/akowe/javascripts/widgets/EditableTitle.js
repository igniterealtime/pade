/*global goog, widgets, document, Wodo*/
goog.provide("widgets.EditableTitle");

goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Css3ButtonRenderer');
goog.require('goog.ui.Popup');

widgets.EditableTitle = function (titleDisplay, editorInstance, socket) {
    "use strict";
    var sessionLoaded = false,
        titleEditorPopup,
        titleEditor,
        titleInput,
        saveButton,
        cancelButton,
        placeholderText = "Untitled Document";

    function setText(text) {
        titleDisplay.innerHTML = "";
        titleDisplay.appendChild(titleDisplay.ownerDocument.createTextNode(text || placeholderText));
    }

    function startEditing() {
        titleEditorPopup.setPinnedCorner(goog.positioning.Corner.TOP_LEFT);
        titleEditorPopup.setPosition(new goog.positioning.AnchoredViewportPosition(titleDisplay,
          goog.positioning.Corner.TOP_LEFT));
        titleEditorPopup.setVisible(true);
        titleInput.value = editorInstance.getMetadata("dc:title");
        titleInput.focus();
    }

    function stopEditing() {
        titleEditorPopup.setVisible(false);
    }

    function save() {
        var title = titleInput.value;

        stopEditing();

        editorInstance.setMetadata({
            "dc:title": title
        });
    }

    function cancel() {
        stopEditing();
    }

    function handleKick() {
        if (titleEditorPopup.isVisible()) {
            stopEditing();
        }
    }

    function handleMetadataChanged(changes) {
        var title = changes.setProperties["dc:title"];
        if (title !== undefined) {
            setText(title);
        }
    }

    this.setSessionLoaded = function (_sessionLoaded) {
        // TODO: disable/enable button also
        sessionLoaded = _sessionLoaded;
        if (sessionLoaded) {
            setText(editorInstance.getMetadata("dc:title"));
        }
    };

    function init() {
        var container, spacer;

        titleInput = goog.dom.createDom("input", {
            type: "text",
            class: "titleedit"
        });
        container = goog.dom.createDom("div");
        spacer = goog.dom.createDom("div", {
            style: "min-width: 10px; display: inline-block;"
        });
        titleEditor = goog.dom.createDom("div", {
            class: "titleedit-popup popup"
        });
        goog.dom.append(container, titleInput);
        goog.dom.append(container, spacer);
        goog.dom.append(titleEditor, container);
        // if popups are absolutly positioned, need to be relative to body
        goog.dom.append(document.body, titleEditor);

        goog.dom.classlist.add(titleDisplay, 'title');
        titleDisplay.setAttribute('placeholder', placeholderText);

        saveButton = new goog.ui.CustomButton("Save", new goog.ui.Css3ButtonRenderer());
        saveButton.render(container);
        goog.dom.classlist.addAll(saveButton.getElement(), ['button', 'blue']);
        goog.events.listen(saveButton, goog.ui.Component.EventType.ACTION, save);
        cancelButton = new goog.ui.CustomButton("Cancel", new goog.ui.Css3ButtonRenderer());
        cancelButton.render(container);
        goog.dom.classlist.addAll(cancelButton.getElement(), ['button','red']);
        goog.events.listen(cancelButton, goog.ui.Component.EventType.ACTION, cancel);

        editorInstance.addEventListener(Wodo.EVENT_METADATACHANGED, handleMetadataChanged);
        titleDisplay.onclick = startEditing;

        titleEditorPopup = new goog.ui.Popup(titleEditor);
        // TODO: also catch Enter/Return key, perhaps by hidden input
        titleEditorPopup.setHideOnEscape(true); // relies on hide being enough, fragile for the future
        titleEditorPopup.setAutoHide(true);

        socket.on("kick", handleKick);
    }
    init();
};

goog.exportSymbol("widgets.EditableTitle", widgets.EditableTitle);
