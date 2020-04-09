var ofmeet = (function(of)
{
    let recordingAudioTrack = {};
    let recordingVideoTrack = {};
    let videoRecorder;

    let tags = {location: "", date: (new Date()).toISOString().split('T')[0], expert: "", operator: "", operation: ""};

    window.addEventListener("DOMContentLoaded", function()
    {
        console.debug("ofmeet.js load");
        setTimeout(setup, 1000);
    });

    window.addEventListener("beforeunload", function()
    {
        const me = APP.conference.getMyUserId();
        console.log("ofmeet.js database deleteion attempt", me);
        const deleteRequest = indexedDB.deleteDatabase('ofmeet-db-' + me)

        deleteRequest.onsuccess = function(event) {
          console.log("ofmeet.js database deleted successfully", me);
        };

        deleteRequest.onerror = function(err) {
          console.error("ofmeet.js database deleted error", me, err);
        };
    });

    function setup()
    {
        if (!APP.connection)
        {
            setTimeout(setup, 1500);
            return;
        }

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.CONFERENCE_JOINED, function()
        {
            console.debug("ofmeet.js me joined");
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.CONFERENCE_LEFT, function()
        {
            console.debug("ofmeet.js me left");
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_REMOVED, function(track)
        {
            console.debug("ofmeet.js track removed", track.getParticipantId());
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_ADDED, function(track)
        {
            console.debug("ofmeet.js track added", track.getParticipantId(), track.getType(), track.stream);

            if (track.getType() == "audio") recordingAudioTrack[track.getParticipantId()] = track.stream.clone();
            if (track.getType() == "video") recordingVideoTrack[track.getParticipantId()] = track.stream.clone();

            //if (track.getType() == "audio") recordingAudioTrack[track.getParticipantId()] = recordingAudioTrack[APP.conference.getMyUserId()];
            //if (track.getType() == "video") recordingVideoTrack[track.getParticipantId()] = recordingVideoTrack[APP.conference.getMyUserId()]
        });

        navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(function(stream)
        {
            recordingVideoTrack[APP.conference.getMyUserId()] = stream.clone();
            recordingAudioTrack[APP.conference.getMyUserId()] = stream.clone();

            createRecordButton();
            createPhotoButton();
            createTagsButton();
            createClock()
        });


        console.debug("ofmeet.js setup", APP.connection);
    }

    function createRecordButton()
    {
        const recordButton = addToolbarItem('ofmeet-record', '<div id="ofmeet-record" class="toolbox-icon "><div class="jitsi-icon "><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><g><path d="M928.8,438.8L745,561.3c0-37.2-16.9-70.1-43.1-92.5c62.3-37.5,104.3-105.1,104.3-183.1c0-118.4-96-214.4-214.4-214.4c-118.4,0-214.4,96-214.4,214.4c0,60.1,24.9,114.2,64.7,153.1H329.8c29.3-32.5,47.7-75.2,47.7-122.5c0-101.5-82.3-183.8-183.8-183.8C92.3,132.5,10,214.8,10,316.3c0,55.4,25,104.4,63.8,138.1C35.9,475.2,10,515,10,561.3v245c0,67.6,54.9,122.5,122.5,122.5h490c67.6,0,122.5-54.9,122.5-122.5v-30.6l183.8,153.1c33.8,0,61.3-27.4,61.3-61.3V500C990,466.2,962.6,438.8,928.8,438.8z M71.3,316.3c0-67.7,54.9-122.5,122.5-122.5c67.6,0,122.5,54.8,122.5,122.5s-54.9,122.5-122.5,122.5C126.1,438.7,71.3,383.9,71.3,316.3z M683.8,806.3c0,33.8-27.4,61.3-61.3,61.3h-490c-33.8,0-61.3-27.4-61.3-61.3v-245c0-33.8,27.4-61.3,61.3-61.3h490c33.8,0,61.3,27.4,61.3,61.3V806.3z M591.9,439.1c-84.8,0-153.5-68.7-153.5-153.5c0-84.8,68.7-153.5,153.5-153.5c84.8,0,153.5,68.7,153.5,153.5C745.4,370.4,676.6,439.1,591.9,439.1z M928.8,545.9v281.2c0,1.6,0,2.2,0,2.2v38.1L745,714.4v-61.3c0-16.2,0-12.3,0-30.6L928.8,500C928.8,543,928.8,520.6,928.8,545.9z"/></g></svg></div></div>', "Record Conference");

        if (recordButton) recordButton.addEventListener("click", function(evt)
        {
            evt.stopPropagation();

            let msg = undefined;
            const icon = document.getElementById("ofmeet-record");

            if (!of.recording) {
                icon.classList.add("toggled");
                msg = "Conference Recording Started";
                startRecorder();
            } else {
                icon.classList.remove("toggled");
                msg = "Conference Recording Stopped";
                stopRecorder();
            }

            APP.UI.messageHandler.notify(msg, null, null, "");
            of.recording = !of.recording;
        });
    }

    function createTagsButton()
    {
        const tagsButton = addToolbarItem('ofmeet-tags', '<div id="ofmeet-tags" class="toolbox-icon "><div class="jitsi-icon" style="font-size: 12px;">TAGS</div></div>', "Conference TAGS");

        if (tagsButton) tagsButton.addEventListener("click", function(evt)
        {
            evt.stopPropagation();
            doTags();
        });
    }

    function createClock()
    {
        var textElem = document.getElementById("clocktext");

        function updateClock() {
            var d = new Date();
            var s = "";
            s += (10 > d.getHours  () ? "0" : "") + d.getHours  () + ":";
            s += (10 > d.getMinutes() ? "0" : "") + d.getMinutes() + ":";
            s += (10 > d.getSeconds() ? "0" : "") + d.getSeconds();
            textElem.textContent = s;
            setTimeout(updateClock, 1000 - d.getTime() % 1000 + 20);
        }

        updateClock();
    }

    function doTags()
    {
        const template =
        '<div class="modal fade" id="myModal" aria-hidden="true" style="display: none;">' +
        '<div class="modal-dialog modal-lg">' +
        '  <div class="modal-content">' +

        '    <!-- Modal Header -->' +
        '    <div class="modal-header">' +
        '      <h4 class="modal-title">Conference TAGS</h4>' +
        '      <button type="button" class="close" data-dismiss="modal">x</button>' +
        '    </div>' +

        '    <!-- Modal body -->' +
        '    <div class="modal-body">' +
        '       <div class="form-group">' +
        '       <label for="tags-location" class="col-form-label">Location:</label>' +
        '       <input id="tags-location" type="text" class="form-control" name="tag-location" value="' + tags.location + '"/>' +
        '       <label for="tags-date" class="col-form-label">Date:</label>' +
        '       <input id="tags-date" type="text" class="form-control" name="tags-date"/>' +
        '       <label for="tags-expert" class="col-form-label">Expert Name:</label>' +
        '       <input id="tags-expert" type="text" class="form-control" name="tags-expert" value="' + tags.expert + '"/>' +
        '       <label for="tags-operator" class="col-form-label">Operator Name:</label>' +
        '       <input id="tags-operator" type="text" class="form-control" name="tags-operator" value="' + tags.operator + '"/>' +
        '       <label for="tags-operation" class="col-form-label">Name of Operation:</label>' +
        '       <input id="tags-operation" type="text" class="form-control" name="tags-operation" value="' + tags.operation + '"/>' +
        '       </div>' +
        '    </div>' +

        '    <!-- Modal footer -->' +
        '    <div class="modal-footer">' +
        '      <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>' +
        '    </div>' +

        '  </div>' +
        '</div>' +
        '</div>'

        const div = newElement('div', 'ofmeet-tags-modal', template);

        $("#myModal").on('show.bs.modal', function () {
            document.getElementById('tags-date').value = (new Date()).toISOString().split('T')[0]
        });

        $("#myModal").on('hidden.bs.modal', function () {
            tags.location = document.getElementById('tags-location').value;
            tags.date = document.getElementById('tags-date').value;
            tags.expert = document.getElementById('tags-expert').value;
            tags.operator = document.getElementById('tags-operator').value;
            tags.operation = document.getElementById('tags-operation').value;

            document.getElementById("subtitles").innerHTML = `<b>Location</b>: ${tags.location} <br/><b>Date</b>: ${tags.date} <br/><b>Expert</b>: ${tags.expert} <br/><b>Operator</b>: ${tags.operator} <br/><b>Operation</b>: ${tags.operation}`;
        });

        $('#myModal').modal('show');
    }

    function getFilename(prefix, suffix)
    {
        return  prefix + "-" +
                (tags.location != "" ? tags.location + "-" : "") +
                tags.date.replace(/\//g, '')  + "-" +
                (tags.expert != "" ? tags.expert + "-" : "") +
                (tags.operator != "" ? tags.operator + "-" : "") +
                (tags.operation != "" ? tags.operation + "-" : "") +
                suffix;
    }

    function createPhotoButton()
    {
        const photoButton = addToolbarItem('ofmeet-photo', '<div id="ofmeet-photo" class="toolbox-icon "><div class="jitsi-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M5 5h-3v-1h3v1zm8 5c-1.654 0-3 1.346-3 3s1.346 3 3 3 3-1.346 3-3-1.346-3-3-3zm11-4v15h-24v-15h5.93c.669 0 1.293-.334 1.664-.891l1.406-2.109h8l1.406 2.109c.371.557.995.891 1.664.891h3.93zm-19 4c0-.552-.447-1-1-1-.553 0-1 .448-1 1s.447 1 1 1c.553 0 1-.448 1-1zm13 3c0-2.761-2.239-5-5-5s-5 2.239-5 5 2.239 5 5 5 5-2.239 5-5z"/></svg></div></div>', "Take Photo");

        if (photoButton) photoButton.addEventListener("click", function(evt)
        {
            evt.stopPropagation();
            takePhoto();

            APP.UI.messageHandler.notify("Conference Photo Taken", null, null, "");
        });
    }

    function addTagsToImage(blob, callback)
    {
        const font = "20px Arial";
        const canvas = document.createElement('canvas');
        canvas.width = screen.width;
        canvas.height = screen.height;

        canvas.style.display = 'none';
        document.body.appendChild(canvas);
        const img = new Image(screen.width, screen.height);

        img.onload = function()
        {
            const context = canvas.getContext('2d');

            context.drawImage(img, 0, 0);
            context.font = font;
            context.fillStyle = "#fff";
            context.fillText("Location: " + tags.location, 50, 50);
            context.fillText("Date: " +  tags.date, 50, 75);
            context.fillText("Expert: " +  tags.expert, 50, 100);
            context.fillText("Operator: " +  tags.operator, 50, 125);
            context.fillText("Operation: " +  tags.operation, 50, 150);

            canvas.toBlob(function(newBlob)
            {
                callback(newBlob);
                document.body.removeChild(canvas);
            });
        }
        img.src = URL.createObjectURL(blob);
    }

    function takePhoto()
    {
        const ids = Object.getOwnPropertyNames(recordingVideoTrack);
        console.debug("ofmeet.js takePhoto", ids);

        ids.forEach(function(id)
        {
            const track = recordingVideoTrack[id].clone().getVideoTracks()[0];
            const imageCapture = new ImageCapture(track);
            const photoSettings = {fillLightMode: "auto", imageHeight: screen.height, imageWidth: screen.width, redEyeReduction: false};

            imageCapture.takePhoto(photoSettings).then(function(blob)
            {
                const filename = getFilename("ofmeet-" + id, ".png");

                addTagsToImage(blob, function(newBlob)
                {
                    console.debug("ofmeet.js takePhoto with tags", newBlob);
                    createAnchor(filename, newBlob);
                });
            })
        });
    }

    function stopRecorder()
    {
        console.debug("ofmeet.js stopRecorder");

        const ids = Object.getOwnPropertyNames(recordingVideoTrack);
        if (videoRecorder) videoRecorder.stop();
    }

    function createAnchor(filename, blob)
    {
        const anchor = document.createElement('a');
        anchor.href = window.URL.createObjectURL(blob);
        anchor.style = "display: none;";
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        window.URL.revokeObjectURL(anchor.href);
        return anchor;
    }

    function createWebVTTFile(me)
    {
        console.debug("ofmeet.js createWebVTTFile");

        const vtt = [
            "WEBVTT\n",
            "\n00:00:00.000 --> 24:00:00.000 position:10% line:10% align:left size:100%",
            "\n<b>Location</b>: " + tags.location,
            "\n<b>Date</b>: " +  tags.date,
            "\n<b>Expert</b>: " +  tags.expert,
            "\n<b>Operator</b>: " +  tags.operator,
            "\n<b>Operation</b>: " +  tags.operation
        ];
        const blob = new Blob(vtt, {type: "text/plain;charset=utf-8"});
        const filename = getFilename("ofmeet-tags-" + me, ".vtt");
        createAnchor(filename, blob);
        return filename;
    }

    function createViewerHTMLpage()
    {
        console.debug("ofmeet.js createViewerHTMLpage");

        const me = APP.conference.getMyUserId();
        const htmlFile = getFilename("ofmeet-html-" + me, ".html");
        const vttFile = createWebVTTFile(me);
        const webmFile = getFilename("ofmeet-webm-" + me, ".webm");

        const html = [
            '<style>video::cue {font-size: 20px; color: #FFF; opacity: 1;}</style>',
            '\n<video controls autoplay src="' + webmFile + '"><track default src="' + vttFile + '"></video>',
        ];

        const blob = new Blob(html, {type: "text/plain;charset=utf-8"});
        createAnchor(htmlFile, blob);
    }

    function startRecorder()
    {
        console.debug("ofmeet.js startRecorder");

        const me = APP.conference.getMyUserId();
        const ids = Object.getOwnPropertyNames(recordingVideoTrack);
        const filename = getFilename("ofmeet-webm-" + me, ".webm");

        const stream = new MediaStream()

        stream.addEventListener('addtrack', (event) =>
        {
          console.log(`ofmeet.js new ${event.track.kind} track added`);
        });

        for (let i=0; i<ids.length; i++)
        {
            console.debug("ofmeet.js adding audio/video for", ids[i], recordingVideoTrack[ids[i]], recordingAudioTrack[ids[i]]);

            stream.addTrack(recordingVideoTrack[ids[i]].getVideoTracks()[0]);
            stream.addTrack(recordingAudioTrack[ids[i]].getAudioTracks()[0]);
        }

        const customStore = new idbKeyval.Store('ofmeet-db-' + me, 'custom-store-' + me);

        videoRecorder = new MediaRecorder(stream, { mimeType: 'video/webm'});
        console.debug("ofmeet.js startRecorder stream", customStore, stream, videoRecorder);

        videoRecorder.ondataavailable = function(e)
        {
            if (e.data.size > 0)
            {
                const key = "video-chunk-" + Math.random().toString(36).substr(2, 9);

                idbKeyval.set(key, e.data, customStore).then(function()
                {
                    console.debug("ofmeet.js ondataavailable", key, e.data);

                }).catch(function(err) {
                    console.error('ofmeet.js ondataavailable failed!', err)
                });
            }
        }

        videoRecorder.onstop = function(e)
        {
            stream.getTracks().forEach(track => track.stop());

            idbKeyval.keys(customStore).then(function(data)
            {
                console.debug("ofmeet.js onstop", filename, data);

                const file = new File(data, filename, {type: 'video/webm'});
                const blob = new Blob([file], {type: 'video/webm'});
                createAnchor(filename, blob);
                idbKeyval.clear(customStore);

                const ids = Object.getOwnPropertyNames(recordingVideoTrack);

                ids.forEach(function(id)
                {
                    console.log("ofmeet.js track removed successfully", id);

                    delete recordingAudioTrack[id];
                    delete recordingVideoTrack[id];
                });
            });
        }

        videoRecorder.start();
        createViewerHTMLpage();
    }

    function newElement(el, id, html, className, label)
    {
        const ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        if (label) ele.title = label;
        if (className) ele.classList.add(className);
        document.body.appendChild(ele);
        return ele;
    }

    function addToolbarItem (id, html, label)
    {
        const placeHolder = document.querySelector('.button-group-left');
        let tool = null;

        if (placeHolder)
        {
            tool = newElement('div', null, html, 'toolbox-button', label);
            placeHolder.appendChild(tool);
        }
        return tool;
    }

    //-------------------------------------------------------
    //
    //  idbKeyval
    //
    //-------------------------------------------------------

    var idbKeyval = (function (exports) {
    'use strict';

    class Store {
        constructor(dbName = 'keyval-store', storeName = 'keyval') {
            this.storeName = storeName;
            this._dbp = new Promise((resolve, reject) => {
                const openreq = indexedDB.open(dbName, 1);
                openreq.onerror = () => reject(openreq.error);
                openreq.onsuccess = () => resolve(openreq.result);
                // First time setup: create an empty object store
                openreq.onupgradeneeded = () => {
                    openreq.result.createObjectStore(storeName);
                };
            });
        }
        _withIDBStore(type, callback) {
            return this._dbp.then(db => new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, type);
                transaction.oncomplete = () => resolve();
                transaction.onabort = transaction.onerror = () => reject(transaction.error);
                callback(transaction.objectStore(this.storeName));
            }));
        }
    }
    let store;
    function getDefaultStore() {
        if (!store)
            store = new Store();
        return store;
    }
    function get(key, store = getDefaultStore()) {
        let req;
        return store._withIDBStore('readonly', store => {
            req = store.get(key);
        }).then(() => req.result);
    }
    function set(key, value, store = getDefaultStore()) {
        return store._withIDBStore('readwrite', store => {
            store.put(value, key);
        });
    }
    function del(key, store = getDefaultStore()) {
        return store._withIDBStore('readwrite', store => {
            store.delete(key);
        });
    }
    function clear(store = getDefaultStore()) {
        return store._withIDBStore('readwrite', store => {
            store.clear();
        });
    }
    function keys(store = getDefaultStore()) {
        let req;
        return store._withIDBStore('readwrite', store => {
            req = store.getAll();
        }).then(() => req.result);
    }

    exports.Store = Store;
    exports.get = get;
    exports.set = set;
    exports.del = del;
    exports.clear = clear;
    exports.keys = keys;

    return exports;

    }({}));

    of.recording = false;
    return of;

}(ofmeet || {}));
