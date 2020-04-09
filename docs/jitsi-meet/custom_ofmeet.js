var ofmeet = (function(of)
{
    let modal = null;
    let recordingAudioTrack = {};
    let recordingVideoTrack = {};
    let videoRecorder = {};
    let recorderStreams = {};
    let customStore = {};
    let filenames = {};
    let dbnames = [];
    let clockTrack = {start: 0, stop: 0, joins: 0, leaves: 0};
    let tags = {location: "", date: (new Date()).toISOString().split('T')[0], subject: "", host: "", activity: ""};

    window.addEventListener("DOMContentLoaded", function()
    {
        console.debug("ofmeet.js load");

        setTimeout(setup, 1000);

        if (typeof indexedDB.databases == "function")
        {
            indexedDB.databases().then(function(databases)
            {
                console.debug("ofmeet.js found databases", databases);

                databases.forEach(function(db)
                {
                    if (db.name.indexOf("ofmeet-db-") > -1) recoverRecording(db.name);
                })
            })
        }
    });

    window.addEventListener("beforeunload", function(event)
    {
        console.debug("ofmeet.js beforeunload");

        if (APP.connection)
        {
            event.preventDefault();
            event.returnValue = '';

            if (of.recording) stopRecorder();

            dbnames.forEach(function(dbname)
            {
                const deleteRequest = indexedDB.deleteDatabase(dbname)

                deleteRequest.onsuccess = function(event) {
                  console.debug("ofmeet.js me database deleted successfully", dbname);
                };
            });

            return event.returnValue;
        }
    });

    function setup()
    {
        if (!APP.connection)
        {
            setTimeout(setup, 500);
            return;
        }

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.CONFERENCE_JOINED, function()
        {
            console.debug("ofmeet.js me joined");
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.CONFERENCE_LEFT, function()
        {
            console.debug("ofmeet.js me left");

            if (of.recording) stopRecorder();

            const ids = Object.getOwnPropertyNames(recordingVideoTrack);

            ids.forEach(function(id)
            {
                delete recordingAudioTrack[id];
                delete recordingVideoTrack[id];
            });
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_REMOVED, function(track)
        {
            console.debug("ofmeet.js track removed", track.getParticipantId());

            if (track.getParticipantId() == APP.conference.getMyUserId())
            {
                clockTrack.leaves = (new Date()).getTime();
                hideClock();
            }

            if (of.recording) stopRecorder();
        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_ADDED, function(track)
        {
            console.debug("ofmeet.js track added", track.getParticipantId(), track.getType());

            if (track.getType() == "audio") recordingAudioTrack[track.getParticipantId()] = track.stream;
            if (track.getType() == "video") recordingVideoTrack[track.getParticipantId()] = track.stream;

        });

        APP.conference.addConferenceListener(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, function(track)
        {
            console.debug("ofmeet.js track muted", track.getParticipantId(), track.getType(), track.isMuted());

            if (track.getType() == "audio") recordingAudioTrack[track.getParticipantId()].getAudioTracks()[0].enabled = !track.isMuted();
            if (track.getType() == "video") recordingVideoTrack[track.getParticipantId()].getVideoTracks()[0].enabled = !track.isMuted();

            const recordingStream = recorderStreams[track.getParticipantId()];

            if (recordingStream) // recording active
            {
                if (track.getType() == "audio") recordingStream.getAudioTracks()[0].enabled = !track.isMuted();
                if (track.getType() == "video") recordingStream.getVideoTracks()[0].enabled = !track.isMuted();
            }
        });

        navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(function(stream)
        {
            recordingVideoTrack[APP.conference.getMyUserId()] = stream;
            recordingAudioTrack[APP.conference.getMyUserId()] = stream;

            createRecordButton();
            createPhotoButton();
            createTagsButton();
        });


        if (APP.conference.getMyUserId())
        {
            showClock();
            clockTrack.joins = (new Date()).getTime();
        }

        console.debug("ofmeet.js setup", APP.connection);
    }

    function createRecordButton()
    {
        const recordButton = addToolbarItem('ofmeet-record', '<div class="toolbox-icon "><div class="jitsi-icon "><svg id="ofmeet-record" style="fill: white;" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><g><path d="M928.8,438.8L745,561.3c0-37.2-16.9-70.1-43.1-92.5c62.3-37.5,104.3-105.1,104.3-183.1c0-118.4-96-214.4-214.4-214.4c-118.4,0-214.4,96-214.4,214.4c0,60.1,24.9,114.2,64.7,153.1H329.8c29.3-32.5,47.7-75.2,47.7-122.5c0-101.5-82.3-183.8-183.8-183.8C92.3,132.5,10,214.8,10,316.3c0,55.4,25,104.4,63.8,138.1C35.9,475.2,10,515,10,561.3v245c0,67.6,54.9,122.5,122.5,122.5h490c67.6,0,122.5-54.9,122.5-122.5v-30.6l183.8,153.1c33.8,0,61.3-27.4,61.3-61.3V500C990,466.2,962.6,438.8,928.8,438.8z M71.3,316.3c0-67.7,54.9-122.5,122.5-122.5c67.6,0,122.5,54.8,122.5,122.5s-54.9,122.5-122.5,122.5C126.1,438.7,71.3,383.9,71.3,316.3z M683.8,806.3c0,33.8-27.4,61.3-61.3,61.3h-490c-33.8,0-61.3-27.4-61.3-61.3v-245c0-33.8,27.4-61.3,61.3-61.3h490c33.8,0,61.3,27.4,61.3,61.3V806.3z M591.9,439.1c-84.8,0-153.5-68.7-153.5-153.5c0-84.8,68.7-153.5,153.5-153.5c84.8,0,153.5,68.7,153.5,153.5C745.4,370.4,676.6,439.1,591.9,439.1z M928.8,545.9v281.2c0,1.6,0,2.2,0,2.2v38.1L745,714.4v-61.3c0-16.2,0-12.3,0-30.6L928.8,500C928.8,543,928.8,520.6,928.8,545.9z"/></g></svg></div></div>', "Record Conference");

        if (recordButton) recordButton.addEventListener("click", function(evt)
        {
            evt.stopPropagation();

            if (!of.recording) {
                startRecorder();
            } else {
                stopRecorder();
            }
        });

        const leaveButton = document.querySelector('div[aria-label="Leave the call"]');

        if (leaveButton) leaveButton.addEventListener("click", function(evt)
        {
            if (of.recording) stopRecorder();
        });
    }

    function createTagsButton()
    {
        const tagsButton = addToolbarItem('ofmeet-tags', '<div id="ofmeet-tags" class="toolbox-icon "><div class="jitsi-icon" style="font-size: 12px;"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" width="22" height="22" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512.34 512.34" style="enable-background:new 0 0 512.34 512.34;" xml:space="preserve"> <g transform="translate(1 1)"> <g> <g> <path d="M411.13,342.12c5.207,0,8.678-3.471,8.678-8.678c0-5.207-4.339-8.678-8.678-8.678l-190.915,7.81 c-5.207,0-8.678,3.471-8.678,8.678c0,5.207,4.339,8.678,8.678,8.678L411.13,342.12z"/> <path d="M414.601,402.866l-190.915,7.81c-5.207,0-8.678,3.471-8.678,8.678c0,5.207,4.339,8.678,8.678,8.678l190.915-7.81 c5.207,0,8.678-3.471,8.678-8.678C423.279,406.337,418.94,401.998,414.601,402.866z"/> <path d="M214.14,194.595l190.915-7.81c5.207,0,8.678-3.471,8.678-8.678s-4.339-8.678-8.678-8.678l-190.915,7.81 c-5.207,0-8.678,3.471-8.678,8.678S209.801,194.595,214.14,194.595z"/> <path d="M407.658,264.018c5.207,0,8.678-3.471,8.678-8.678s-4.339-8.678-8.678-8.678l-190.915,7.81 c-5.207,0-8.678,3.471-8.678,8.678s4.339,8.678,8.678,8.678L407.658,264.018z"/> <path d="M484.892,68.764c0-9.546-6.075-18.224-15.62-21.695c-52.093-23.911-109.017-34.577-165.812-32.43 c-0.523-0.239-1.08-0.428-1.673-0.546C230.628-6.734,155.997-5.866,85.706,15.829C77.028,19.3,70.086,27.11,68.35,36.656 L8.472,400.262c-1.736,9.546,2.603,19.092,10.414,25.166l2.603,1.736c52.27,37.703,113.848,61.855,178.048,68.305 c35.27,10.677,71.581,15.871,108.325,15.871c61.614,0,123.227-15.62,178.766-45.993l2.603-1.736 c8.678-4.339,13.017-13.885,13.017-23.43L484.892,68.764z M29.299,411.544c-2.603-1.736-4.339-4.339-3.471-7.81L85.706,39.259 c0-2.603,2.603-5.207,5.207-6.075c34.712-11.281,70.292-16.488,105.871-16.488c17.313,0,33.763,1.728,50.211,4.321 c-16.896,3.199-33.628,7.555-50.066,13.039c-0.965,0.317-1.927,0.642-2.89,0.967c-0.011,0.004-0.022,0.008-0.033,0.011 c-20.873,7.047-41.114,15.872-60.572,26.788c-9.546,5.207-13.017,16.488-13.017,25.166l6.353,134.685l-1.146-0.176 c-4.339-0.868-8.678,2.603-9.546,6.942c-0.868,4.339,2.603,8.678,6.942,9.546l4.552,0.7l2.926,62.034l-17.024-3.724 c-4.339-0.868-9.546,2.603-10.414,6.942s2.603,9.546,6.942,10.414l21.359,4.672l2.895,61.375l-33.799-5.302 c-4.339-0.868-8.678,2.603-9.546,6.942s2.603,8.678,6.942,9.546l37.206,5.836l2.713,57.513c0.502,2.508,1.009,4.722,1.678,6.818 c0.412,1.526,0.967,3.008,1.668,4.426c-39.005-11.282-76.276-28.626-109.217-52.898L29.299,411.544z M480.553,447.991 l-2.603,1.736c-96.325,53.803-214.346,58.142-315.01,13.017l-2.603-0.868c-3.012-0.753-4.712-2.815-5.111-5.614 c-0.006-0.043-0.013-0.086-0.018-0.13c-0.049-0.387-0.077-0.785-0.077-1.198L137.774,86.12c0-3.471,1.736-7.81,4.339-9.546 c98.929-54.671,218.685-59.878,320.217-13.885c3.471,0.868,5.207,3.471,5.207,6.942l17.356,370.549 C484.892,443.652,483.157,446.256,480.553,447.991z"/> <path d="M302.655,129.51c19.092,0,34.712-15.62,34.712-34.712c0-19.092-15.62-34.712-34.712-34.712s-34.712,15.62-34.712,34.712 C267.943,113.889,283.563,129.51,302.655,129.51z M302.655,77.442c9.546,0,17.356,7.81,17.356,17.356s-7.81,17.356-17.356,17.356 c-9.546,0-17.356-7.81-17.356-17.356S293.109,77.442,302.655,77.442z"/> </g> </g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg></div></div>', "Conference TAGS");

        if (tagsButton) tagsButton.addEventListener("click", function(evt)
        {
            evt.stopPropagation();
            doTags();
        });
    }

    function hideClock()
    {
        document.getElementById("clocktext").style.display = "none";
    }

    function showClock()
    {
        const textElem = document.getElementById("clocktext");
        textElem.style.display = "";

        let totalSeconds = 0;

        function pad(val) {
          return (10 > val ? "0" : "") + val;
        }

        function updateClock() {
            ++totalSeconds;

            const secs = pad(totalSeconds % 60);
            const mins = pad(parseInt(totalSeconds / 60));
            const hrs = pad(parseInt(totalSeconds / 3600, 10));

            textElem.textContent = hrs + ":" + mins + ":" + secs;
            setTimeout(updateClock, 1000);
        }

        updateClock();
    }

    function doTags()
    {
        const template =
        '    <!-- Modal Header -->' +
        '    <div class="modal-header">' +
        '      <h4 class="modal-title">Conference TAGS</h4>' +
        '    </div>' +

        '    <!-- Modal body -->' +
        '    <div class="modal-body">' +
        '       <div class="form-group">' +
        '       <label for="tags-location" class="col-form-label">Location:</label>' +
        '       <input id="tags-location" type="text" class="form-control" name="tag-location" value="' + tags.location + '"/>' +
        '       <label for="tags-date" class="col-form-label">Date:</label>' +
        '       <input id="tags-date" type="text" class="form-control" name="tags-date"/>' +
        '       <label for="tags-subject" class="col-form-label">Subject:</label>' +
        '       <input id="tags-subject" type="text" class="form-control" name="tags-subject" value="' + tags.subject + '"/>' +
        '       <label for="tags-host" class="col-form-label">Host:</label>' +
        '       <input id="tags-host" type="text" class="form-control" name="tags-host" value="' + tags.host + '"/>' +
        '       <label for="tags-activity" class="col-form-label">Activity:</label>' +
        '       <input id="tags-activity" type="text" class="form-control" name="tags-activity" value="' + tags.activity + '"/>' +
        '       </div>' +
        '    </div>'

        if (!modal)
        {
            modal = new tingle.modal({
                footer: true,
                stickyFooter: false,
                closeMethods: ['overlay', 'button', 'escape'],
                closeLabel: "Close",
                cssClass: ['custom-class-1', 'custom-class-2'],
                onOpen: function() {
                    console.debug('modal open');
                },
                onClose: function() {
                    console.debug('modal closed');
                },
                beforeOpen: function() {
                    document.getElementById('tags-date').value = (new Date()).toISOString().split('T')[0]
                },
                beforeClose: function() {
                    tags.location = document.getElementById('tags-location').value;
                    tags.date = document.getElementById('tags-date').value;
                    tags.subject = document.getElementById('tags-subject').value;
                    tags.host = document.getElementById('tags-host').value;
                    tags.activity = document.getElementById('tags-activity').value;

                    if (tags.location != "")
                    {
                        document.getElementById("subtitles").innerHTML = `<b>Location</b>: ${tags.location} <br/><b>Date</b>: ${tags.date} <br/><b>Subject</b>: ${tags.subject} <br/><b>Host</b>: ${tags.host} <br/><b>Activity</b>: ${tags.activity}`;
                    }
                    return true;
                }
            });
            modal.setContent(template);

            modal.addFooterBtn('Save', 'btn btn-success tingle-btn tingle-btn--primary', function() {
                // here goes some logic
                modal.close();
            });

            modal.addFooterBtn('Cancel', 'btn btn-danger tingle-btn tingle-btn--danger', function() {
                event.preventDefault();
                tags = {location: "", date: (new Date()).toISOString().split('T')[0], subject: "", host: "", activity: ""};

                document.getElementById('tags-location').value = tags.location;
                document.getElementById('tags-date').value = tags.date;
                document.getElementById('tags-subject').value = tags.subject;
                document.getElementById('tags-host').value = tags.host;
                document.getElementById('tags-activity').value = tags.activity;

                document.getElementById("subtitles").innerHTML =  "";
                modal.close();
            });
        }

        modal.open();
    }

    function getFilename(prefix, suffix)
    {
        return  prefix + "-" +
                (tags.location != "" ? tags.location + "-" : "") +
                tags.date.replace(/\//g, '')  + "-" +
                (tags.subject != "" ? tags.subject + "-" : "") +
                (tags.host != "" ? tags.host + "-" : "") +
                (tags.activity != "" ? tags.activity : "") +
                Math.random().toString(36).substr(2,9) +
                suffix;
    }

    function createPhotoButton()
    {
        const photoButton = addToolbarItem('ofmeet-photo', '<div id="ofmeet-photo" class="toolbox-icon "><div class="jitsi-icon"><svg style="fill: white;" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M5 5h-3v-1h3v1zm8 5c-1.654 0-3 1.346-3 3s1.346 3 3 3 3-1.346 3-3-1.346-3-3-3zm11-4v15h-24v-15h5.93c.669 0 1.293-.334 1.664-.891l1.406-2.109h8l1.406 2.109c.371.557.995.891 1.664.891h3.93zm-19 4c0-.552-.447-1-1-1-.553 0-1 .448-1 1s.447 1 1 1c.553 0 1-.448 1-1zm13 3c0-2.761-2.239-5-5-5s-5 2.239-5 5 2.239 5 5 5 5-2.239 5-5z"/></svg></div></div>', "Take Photo");

        if (photoButton) photoButton.addEventListener("click", function(evt)
        {
            evt.stopPropagation();
            takePhoto();

            APP.UI.messageHandler.notify("Conference Photo Taken", null, null, "");
        });
    }

    function addTagsToImage(bitmap, callback)
    {
        const font = "20px Arial";
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        canvas.style.display = 'none';
        document.body.appendChild(canvas);

        const context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0);

        if (tags.location != "")
        {
            context.font = font;
            context.fillStyle = "#fff";
            context.fillText("Location: " + tags.location, 50, 50);
            context.fillText("Date: " +  tags.date, 50, 75);
            context.fillText("Subject: " +  tags.subject, 50, 100);
            context.fillText("Host: " +  tags.host, 50, 125);
            context.fillText("Activity: " +  tags.activity, 50, 150);
        }

        canvas.toBlob(function(blob)
        {
            callback(blob);
            setTimeout(function() {document.body.removeChild(canvas)});
        });
    }

    function createPhotoViewerHTML()
    {
        console.debug("ofmeet.js createPhotoViewerHTML");

        let imagenames = {};
        const me = APP.conference.getMyUserId();
        const html = ['<html><head><style> img { float: left; } img:first-child:nth-last-child(1) { width: 100%;} img:first-child:nth-last-child(2), img:first-child:nth-last-child(2) ~ img { width: 50%;} img:first-child:nth-last-child(3), img:first-child:nth-last-child(3) ~ img, img:first-child:nth-last-child(4), img:first-child:nth-last-child(4) ~ img { width: 50%;} img:first-child:nth-last-child(5), img:first-child:nth-last-child(5) ~ img, img:first-child:nth-last-child(6), img:first-child:nth-last-child(6) ~ img, img:first-child:nth-last-child(7), img:first-child:nth-last-child(7) ~ img, img:first-child:nth-last-child(8), img:first-child:nth-last-child(8) ~ img, img:first-child:nth-last-child(9), img:first-child:nth-last-child(9) ~ img { width: 33.33%; } </style></head><body>'];
        const ids = Object.getOwnPropertyNames(recordingVideoTrack);

        ids.forEach(function(id)
        {
            imagenames[id] = getFilename("ofmeet-" + id, ".png");
            html.push('\n<img id="' + id + '" src="' + imagenames[id] + '"/>');
        });

        html.push('</body></html>');

        const blob = new Blob(html, {type: "text/plain;charset=utf-8"});
        const htmlFile = getFilename("ofmeet-photo-" + me, ".html");
        createAnchor(htmlFile, blob);
        return imagenames;
    }


    function takePhoto()
    {
        const ids = Object.getOwnPropertyNames(recordingVideoTrack);
        const imagenames = createPhotoViewerHTML();

        console.debug("ofmeet.js takePhoto", ids, imagenames);

        ids.forEach(function(id)
        {
            const track = recordingVideoTrack[id].clone().getVideoTracks()[0];
            const imageCapture = new ImageCapture(track);

            imageCapture.grabFrame().then(function(bitmap)
            {
                addTagsToImage(bitmap, function(blob)
                {
                    console.debug("ofmeet.js takePhoto with tags", blob);
                    createAnchor(imagenames[id], blob);
                });
            })
        });
    }

    function stopRecorder()
    {
        console.debug("ofmeet.js stopRecorder");

        const icon = document.getElementById("ofmeet-record");
        icon.style.fill = "white";
        APP.UI.messageHandler.notify("Conference Recording Stopped", null, null, "");

        clockTrack.stop = (new Date()).getTime();
        const ids = Object.getOwnPropertyNames(recordingVideoTrack);

        ids.forEach(function(id)
        {
            if (videoRecorder[id]) videoRecorder[id].stop();
        });

        createVideoViewerHTML();
        of.recording = false;
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
    }

    function createVttDataUrl()
    {
        console.debug("ofmeet.js createVttDataUrl");

        function pad(val) {
          return (10 > val ? "0" : "") + val;
        }

        function getTimeStamp(secs)
        {
            const secondsLabel = pad(secs % 60);
            const minutesLabel = pad(parseInt(secs / 60));
            const hoursLabel = pad(parseInt(secs/3600, 10));
            return hoursLabel + ":" + minutesLabel + ":" + secondsLabel;
        }

        const vtt = ["WEBVTT\n", "\n00:00:00.000 --> 24:00:00.000 position:10% line:1% align:left size:100%"];

        if (tags.location != "")
        {
            vtt.push("\n<b>Location</b>: " + tags.location);
            vtt.push("\n<b>Date</b>: " +  tags.date);
            vtt.push("\n<b>Subject</b>: " +  tags.subject);
            vtt.push("\n<b>Host</b>: " +  tags.host);
            vtt.push("\n<b>Activity</b>: " +  tags.activity);
        }

        let recordSeconds = 0;
        let totalSeconds = parseInt((clockTrack.start - clockTrack.joins) / 1000);

        for (let i=clockTrack.start; i<clockTrack.stop; i+=1000 )
        {
            ++totalSeconds;
            ++recordSeconds;

            const timestamp = getTimeStamp(recordSeconds);

            vtt.push("\n\n" + timestamp + ".000 --> " + timestamp + ".999 position:10% line:-10% align:left size:100%");
            vtt.push("\n" + getTimeStamp(totalSeconds));
        }

        console.debug("ofmeet.js createVttDataUrl", vtt);
        const url = "data:application/json;base64," + btoa(vtt)
        return url
    }

    function createVideoViewerHTML()
    {
        console.debug("ofmeet.js createVideoViewerHTML");

        const vttUrl = createVttDataUrl();
        const html = ['<html><head><style> video { float: left; } video::cue {font-size: 20px; color: #FFF; opacity: 1;} video:first-child:nth-last-child(1) { width: 100%; height: 100%; } video:first-child:nth-last-child(2), video:first-child:nth-last-child(2) ~ video { width: 50%; height: 100%; } video:first-child:nth-last-child(3), video:first-child:nth-last-child(3) ~ video, video:first-child:nth-last-child(4), video:first-child:nth-last-child(4) ~ video { width: 50%; height: 50%; } video:first-child:nth-last-child(5), video:first-child:nth-last-child(5) ~ video, video:first-child:nth-last-child(6), video:first-child:nth-last-child(6) ~ video, video:first-child:nth-last-child(7), video:first-child:nth-last-child(7) ~ video, video:first-child:nth-last-child(8), video:first-child:nth-last-child(8) ~ video, video:first-child:nth-last-child(9), video:first-child:nth-last-child(9) ~ video { width: 33.33%; height: 33.33%; } </style></head><body>'];
        const ids = Object.getOwnPropertyNames(recordingVideoTrack);

        ids.forEach(function(id)
        {
            html.push('\n<video id="' + id + '" controls preload="metadata" src="' + filenames[id] + '"><track default src="' + vttUrl + '"></video>');
        });

        html.push('\n<script>');
        html.push('\n window.addEventListener("load", function() {');

        for (let z=0; z<ids.length; z++)
        {
            html.push('\n   var v' + z + ' = document.getElementById("' + ids[z] + '");');

            html.push('\n    v' + z + '.addEventListener("play", function() {');
            for (let i=0; i<ids.length; i++)
            {
                if (i != z) html.push('\n       document.getElementById("' + ids[i] + '").play();');
            }
            html.push('\n    });');

            html.push('\n    v' + z + '.addEventListener("playing", function() {');
            for (let i=0; i<ids.length; i++)
            {
                if (i != z) html.push('\n       document.getElementById("' + ids[i] + '").play();');
            }
            html.push('\n    });');

            html.push('\n    v' + z + '.addEventListener("pause", function() {');
            for (let i=0; i<ids.length; i++)
            {
                if (i != z) html.push('\n       document.getElementById("' + ids[i] + '").pause();');
            }
            html.push('\n    });');

            html.push('\n    v' + z + '.addEventListener("ended", function() {');
            for (let i=0; i<ids.length; i++)
            {
                if (i != z) html.push('\n       document.getElementById("' + ids[i] + '").pause();');
            }
            html.push('\n    });');

            if (z == 0)
            {
                html.push('\n    v' + z + '.addEventListener("seeking", function() {');
                for (let i=0; i<ids.length; i++)
                {
                    if (i != z) html.push('\n       document.getElementById("' + ids[i] + '").currentTime = v' + z + '.currentTime;');
                }
                html.push('\n    });');

                html.push('\n    v' + z + '.addEventListener("seeked", function() {');
                for (let i=0; i<ids.length; i++)
                {
                    if (i != z) html.push('\n       document.getElementById("' + ids[i] + '").currentTime = v' + z + '.currentTime;');
                }
                html.push('\n    });');
            }
        }
        html.push('\n });');
        html.push('\n</script></body></html>');

        const me = APP.conference.getMyUserId();
        const blob = new Blob(html, {type: "text/plain;charset=utf-8"});
        const htmlFile = getFilename("ofmeet-video-" + me, ".html");
        createAnchor(htmlFile, blob);
    }

    function startRecorder()
    {
        console.debug("ofmeet.js startRecorder");

        const icon = document.getElementById("ofmeet-record");
        icon.style.fill = "red";
        APP.UI.messageHandler.notify("Conference Recording Started", null, null, "");

        clockTrack.start = (new Date()).getTime();
        const ids = Object.getOwnPropertyNames(recordingVideoTrack);

        ids.forEach(function(id)
        {
            filenames[id] = getFilename("ofmeet-video-" + id, ".webm");
            recorderStreams[id] = new MediaStream();

            recorderStreams[id].addEventListener('addtrack', (event) =>
            {
              console.debug(`ofmeet.js new ${event.track.kind} track added`);
            });

            recorderStreams[id].addTrack(recordingVideoTrack[id].clone().getVideoTracks()[0]);
            recorderStreams[id].addTrack(recordingAudioTrack[id].clone().getAudioTracks()[0]);

            console.debug("ofmeet.js startRecorder stream", id, recorderStreams[id], recorderStreams[id].getVideoTracks()[0].getSettings());

            const dbname = 'ofmeet-db-' + id;
            dbnames.push(dbname);

            customStore[id] = new idbKeyval.Store(dbname, dbname);
            videoRecorder[id] = new MediaRecorder(recorderStreams[id], { mimeType: 'video/webm'});

            videoRecorder[id].ondataavailable = function(e)
            {
                if (e.data.size > 0)
                {
                    const key = "video-chunk-" + (new Date()).getTime();

                    idbKeyval.set(key, e.data, customStore[id]).then(function()
                    {
                        console.debug("ofmeet.js startRecorder - ondataavailable", id, key, e.data);

                    }).catch(function(err) {
                        console.error('ofmeet.js startRecorder - ondataavailable failed!', err)
                    });
                }
            }

            videoRecorder[id].onstop = function(e)
            {
                recorderStreams[id].getTracks().forEach(track => track.stop());

                idbKeyval.keys(customStore[id]).then(function(data)
                {
                    const duration = Date.now() - startTime;
                    const blob = new Blob(data, {type: 'video/webm'});

                   console.debug("ofmeet.js startRecorder - onstop", id, filenames[id], duration, data, blob);

                    ysFixWebmDuration(blob, duration, function(fixedBlob) {
                        createAnchor(filenames[id], fixedBlob);
                        idbKeyval.clear(customStore[id]);

                        delete filenames[id];
                        delete videoRecorder[id];
                        delete recorderStreams[id];
                        delete customStore[id];
                    });
                });
            }
            videoRecorder[id].start(1000);
            const startTime = Date.now();
        });

        of.recording = true;
    }

    function recoverRecording(dbname)
    {
        console.debug("recovering db " + dbname);

        dbnames.push(dbname);
        const store = new idbKeyval.Store(dbname, dbname);
        const filename = getFilename("ofmeet-video-" + dbname, ".webm");

        idbKeyval.keys(store).then(function(data)
        {
            console.debug("ofmeet.js recoverRecording", filename, data);

            const blob = new Blob(data, {type: 'video/webm'});
            createAnchor(filename, blob);

            idbKeyval.clear(store);
        });
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
