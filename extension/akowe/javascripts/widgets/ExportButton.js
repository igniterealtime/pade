/*global goog, widgets, runtime, Blob, saveAs, XMLHttpRequest*/
goog.provide("widgets.ExportButton");

goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuButton');
goog.require('goog.ui.Css3MenuButtonRenderer');

widgets.ExportButton = function (parentElement, editorInstance, getDocumentOriginalFileName) {
    "use strict";
    var sessionLoaded = false,
        menu,
        button;

    function downloadInFormat(format, fileNameBase) {
        editorInstance.getDocumentAsByteArray(function (err, data) {
            if (err) {
                runtime.log(err);
                return;
            }

            var mimetype = "application/vnd.oasis.opendocument.text",
                blob = new Blob([data.buffer], {type: mimetype}),
                xhr;

            if (format === "odt") {
                saveAs(blob, fileNameBase + '.odt');
            }
        });
    }

    this.setSessionLoaded = function (_sessionLoaded) {
        // TODO: disable/enable button also
        sessionLoaded = _sessionLoaded;
    };

    function init() {
        var formats = [{
                label: "OpenDocument Format",
                extension: "odt"
            }];

        menu = new goog.ui.Menu();
        menu.setId("ExportMenu");
        goog.array.forEach(formats, function (entry) {
            var item;

            item = new goog.ui.MenuItem(entry.label + " (." + entry.extension + ")");
            item.setId(entry.extension);

            menu.addItem(item);
        });

        goog.events.listen(menu, goog.ui.Component.EventType.ACTION, function (e) {
            if (!sessionLoaded) {
                return;
            }

            var exportType = e.target.getId(),
                originalFileName = getDocumentOriginalFileName(),
                i,
                exportedFileNameBase;

            if (originalFileName) {
                i = originalFileName.lastIndexOf(".");
                exportedFileNameBase = (i == -1) ? originalFileName : originalFileName.slice(0, i);
            } else {
                exportedFileNameBase = editorInstance.getMetadata("dc:title");
            }
            downloadInFormat(exportType, exportedFileNameBase);
        });

        button = new goog.ui.MenuButton('Download', menu, new goog.ui.Css3MenuButtonRenderer());
        button.render(parentElement);
        button.getElement().setAttribute('id', 'exportButton');
        button.getElement().classList.add('button');
        //button.getElement().classList.add('red');
        button.getElement().classList.add('export-button');
    }

    init();
};

goog.exportSymbol("widgets.ExportButton", widgets.ExportButton);
