(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var videoRecorder = null;

    converse.plugins.add("screencast", {
        'dependencies': [],

        'initialize': function () {

            this._converse.api.listen.on('renderToolbar', function(view)
            {
                var id = view.model.get("box_id");
                var html = '<a class="fa fa-desktop" title="ScreenCast. Click to start and stop"></a>';
                var screencast = addToolbarItem(view, id, "webmeet-screencast-" + id, html);

                if (screencast)
                {
                    screencast.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        if (videoRecorder == null)  // toggle - start otherwise stop
                        {
                            getDisplayMedia({ video: true }).then(stream =>
                            {
                                handleStream(stream, view);

                            }, error => {
                                handleError(error)
                            });

                        } else {
                            videoRecorder.stop();
                        }

                    }, false);
                }
            });

            console.log("screencast plugin is ready");
        }
    });

    var getDisplayMedia = function getDisplayMedia()
    {
        if (navigator.getDisplayMedia) {
          return navigator.getDisplayMedia({video: true});
        } else if (navigator.mediaDevices.getDisplayMedia) {
          return navigator.mediaDevices.getDisplayMedia({video: true});
        } else {
          return navigator.mediaDevices.getUserMedia({video: {mediaSource: 'screen'}});
        }
    }

    var handleStream = function handleStream (stream, view)
    {
        navigator.mediaDevices.getUserMedia({audio: true, video: false}).then((audioStream) => handleAudioStream(stream, audioStream, view)).catch((e) => handleError(e))
    }

    var handleAudioStream = function handleStream (stream, audioStream, view)
    {
        stream.addTrack(audioStream.getAudioTracks()[0]);
        audioStream.removeTrack(audioStream.getAudioTracks()[0]);

        var video = document.createElement('video');
        video.playsinline = true;
        video.autoplay = true;
        video.muted = true;
        video.srcObject = stream;
        video.style.display = "none";

        setTimeout(function()
        {
            videoRecorder = new MediaRecorder(stream);
            videoChunks = [];

            videoRecorder.ondataavailable = function(e)
            {
                if (e.data.size > 0)
                {
                    console.debug("screencast - ondataavailable", e.data);
                    videoChunks.push(e.data);
                }
            }

            videoRecorder.onstop = function(e)
            {
                console.debug("screencast - onstop", e);

                stream.getTracks().forEach(track => track.stop());

                var blob = new Blob(videoChunks, {type: 'video/webm;codecs=h264'});
                var file = new File([blob], "screencast-" + Math.random().toString(36).substr(2,9) + ".webm", {type: 'video/webm;codecs=h264'});
                view.model.sendFiles([file]);
                videoRecorder = null;
            }

            videoRecorder.start();
        });
    }

    var handleError = function handleError (e)
    {
        console.error("ScreenCast", e)
    }

    function newElement (el, id, html, className)
    {
        var ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        if (className) ele.classList.add(className);
        document.body.appendChild(ele);
        return ele;
    }

    function addToolbarItem (view, id, label, html)
    {
        let placeHolder = view.el.querySelector('#place-holder');

        if (!placeHolder)
        {
            const toolbar = view.el.querySelector('.chat-toolbar');
            toolbar.appendChild(newElement('li', 'place-holder'));
            placeHolder = view.el.querySelector('#place-holder');
        }
        var newEle = newElement('li', label, html);
        placeHolder.insertAdjacentElement('afterEnd', newEle);
        return newEle;
    }
}));
