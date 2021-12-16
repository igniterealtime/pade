(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var videoRecorder = null, _converse, html, __;

    converse.plugins.add("screencast", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            html = converse.env.html;
            __ = _converse.__;

            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
                let color = "fill:var(--chat-toolbar-btn-color);";
                if (toolbar_el.model.get("type") == "chatroom") color = "fill:var(--muc-toolbar-btn-color);";

                buttons.push(html`
                    <button class="plugin-screencast" title="${__('ScreenCast. Click to start and stop')}" @click=${performScreenCast} .chatview=${this.chatview}/>
                        <svg style="width:18px; height:18px; ${color}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g><path d="M 30,2L 2,2 C 0.896,2,0,2.896,0,4l0,18 c0,1.104, 0.896,2, 2,2l 9.998,0 c-0.004,1.446-0.062,3.324-0.61,4L 10.984,28 C 10.44,28, 10,28.448, 10,29C 10,29.552, 10.44,30, 10.984,30l 10.030,0 C 21.56,30, 22,29.552, 22,29c0-0.552-0.44-1-0.984-1l-0.404,0 c-0.55-0.676-0.606-2.554-0.61-4L 30,24 c 1.104,0, 2-0.896, 2-2L 32,4 C 32,2.896, 31.104,2, 30,2z M 14,24l-0.002,0.004 C 13.998,24.002, 13.998,24.002, 14,24L 14,24z M 18.002,24.004L 18,24l 0.002,0 C 18.002,24.002, 18.002,24.002, 18.002,24.004z M 30,20L 2,20 L 2,4 l 28,0 L 30,20 z"></path></g></svg>
                    </button>
                `);

                return buttons;
            });

            console.debug("screencast plugin is ready");
        }
    });

    var performScreenCast = function(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();

		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const view = _converse.chatboxviews.get(toolbar_el.model.get('jid'));

        if (videoRecorder == null)  // toggle - start otherwise stop
        {
            getDisplayMedia({ video: true }).then(stream => {
                handleStream(stream, view);

            }, error => {
                handleError(error)
            });

        } else {
            videoRecorder.stop();
        }
    }

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
}));
