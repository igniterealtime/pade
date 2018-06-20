
Polymer({
    is: "google-youtube-upload",
    properties: {
        clientId: {
            type: String,
            value: ""
        },
        auto: {
            type: Boolean,
            value: !1
        },
        videoTitle: {
            type: String,
            value: "Untitled Video"
        },
        description: {
            type: String,
            value: "Uploaded via a web component! Check out https://github.com/GoogleWebComponents/google-youtube-upload"
        },
        tags: {
            type: Array,
            value: function() {
                return ["google-youtube-upload"]
            }
        },
        categoryId: {
            type: Number,
            value: 22
        },
        privacyStatus: {
            type: String,
            value: "unlisted"
        },
        videoId: {
            notify: !0,
            readOnly: !0,
            type: String,
            value: ""
        },
        recordSupported: {
            readOnly: !0,
            type: Boolean,
            value: Boolean("MediaRecorder" in window && "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices)
        },
        audio: {
            type: Object,
            value: !0
        },
        video: {
            type: Object,
            value: !0
        },
        mimeType: {
            type: String,
            value: "video/webm;codecs=vp9,vp8"
        }
    },
    ready: function() {
        this._selectedFile = null, this._STATUS_POLLING_ITERVAL_MILLIS = 6e4, this.clientId ? this._transitionToLoginLogout() : this._transitionToNoClientId()
    },
    uploadFile: function(e) {
        var t = {
                snippet: {
                    title: this.videoTitle,
                    description: this.description,
                    tags: this.tags,
                    categoryId: this.categoryId
                },
                status: {
                    privacyStatus: this.privacyStatus
                }
            },
            i = new MediaUploader({
                baseUrl: "https://www.googleapis.com/upload/youtube/v3/videos",
                file: e,
                token: this._accessToken,
                metadata: t,
                params: {
                    part: Object.keys(t).join(",")
                },
                onError: function(e) {
                    var t = e;
                    try {
                        var i = JSON.parse(e);
                        t = i.error.message
                    } finally {
                        this.fire("youtube-upload-fail", t)
                    }
                }.bind(this),
                onProgress: function(e) {
                    var t = Date.now(),
                        i = e.loaded,
                        o = e.total,
                        n = i / ((t - this._uploadStartTime) / 1e3),
                        s = (o - i) / n,
                        a = i / o;
                    this.fire("youtube-upload-progress", {
                        progressEvent: e,
                        bytesPerSecond: n,
                        estimatedSecondsRemaining: s,
                        fractionComplete: a
                    })
                }.bind(this),
                onComplete: function(e) {
                    var t = JSON.parse(e);
                    this._setVideoId(t.id), this.fire("youtube-upload-complete", t.id), this._pollForVideoStatus()
                }.bind(this)
            });
        this.fire("youtube-upload-start", e), this._uploadStartTime = Date.now(), i.upload(), this._transitionToThanks()
    },
    _initializeMediaRecorder: function() {
        return this._mediaRecorder ? Promise.resolve() : navigator.mediaDevices.getUserMedia({
            audio: this.audio,
            video: this.video
        }).then(function(e) {
            this.$$("#get-user-media").src = URL.createObjectURL(e), this._recordedBlobs = [], this._mediaRecorder = new MediaRecorder(e, {
                mimeType: this.mimeType
            }), this._mediaRecorder.addEventListener("dataavailable", function(e) {
                e.data.size > 0 && this._recordedBlobs.push(e.data)
            }.bind(this)), this._mediaRecorder.addEventListener("stop", function() {
                this._videoBlob = new Blob(this._recordedBlobs, {
                    type: this._mediaRecorder.mimeType
                }), this.$$("#get-user-media").src = URL.createObjectURL(this._videoBlob), this._tearDownMediaRecorder()
            }.bind(this))
        }.bind(this))
    },
    _tearDownMediaRecorder: function() {
        this._recordingState = "stopped", this._mediaRecorder && (this._mediaRecorder.stream.getAudioTracks().forEach(function(e) {
            e.stop()
        }), this._mediaRecorder.stream.getVideoTracks().forEach(function(e) {
            e.stop()
        }), this._mediaRecorder = null, this._recordedBlobs = null)
    },
    _loadChannels: function() {
        gapi && gapi.client && this._accessToken && !this._loadChannelRequested && (this._loadChannelRequested = !0, gapi.client.request({
            path: "/youtube/v3/channels",
            params: {
                part: "snippet",
                mine: !0
            },
            callback: function(e) {
                e.error ? (this.fire("youtube-upload-fail", e.error.message), this._channel = null) : this._channel = {
                    name: e.items[0].snippet.title,
                    thumbnail: e.items[0].snippet.thumbnails.default.url
                }
            }.bind(this)
        }))
    },
    _pollForVideoStatus: function() {
        gapi.client.request({
            path: "/youtube/v3/videos",
            params: {
                part: "status",
                id: this.videoId
            },
            callback: function(e) {
                if (e.error) setTimeout(this._pollForVideoStatus.bind(this), this._STATUS_POLLING_ITERVAL_MILLIS);
                else {
                    var t = e.items[0].status;
                    switch (t.uploadStatus) {
                        case "uploaded":
                            this.fire("youtube-processing-poll", t), setTimeout(this._pollForVideoStatus.bind(this), this._STATUS_POLLING_ITERVAL_MILLIS);
                            break;
                        case "processed":
                            this.fire("youtube-processing-complete", this.videoId);
                            break;
                        default:
                            this.fire("youtube-processing-fail", t)
                    }
                }
            }.bind(this)
        })
    },
    _transitionToNoClientId: function() {
        this._selectedSection = "no-client-id"
    },
    _transitionToLoginLogout: function() {
        this._tearDownMediaRecorder(), this._selectedSection = "login-logout"
    },
    _transitionToUploadFile: function() {
        this._selectedSection = "upload-file"
    },
    _transitionToRecordVideo: function() {
        this._selectedSection = "record-video", this._initializeMediaRecorder().then(function() {
            this._recordingState = "not-started"
        }.bind(this))
    },
    _transitionToThanks: function() {
        this._selectedSection = "thanks"
    },
    _handleUploadClicked: function() {
        this.uploadFile(this._selectedFile)
    },
    _handleRecordClicked: function() {
        this._initializeMediaRecorder().then(function() {
            this._mediaRecorder.start(100), this._recordingState = "started"
        }.bind(this))
    },
    _handleStopClicked: function() {
        this._mediaRecorder.stop()
    },
    _handleRecordingUploadClicked: function() {
        this.uploadFile(this._videoBlob)
    },
    _handleFileChanged: function(e) {
        this._selectedFile = e.target.files[0], this._selectedFile && (this._uploadButtonDisabled = !1, this.auto && this.uploadFile(this._selectedFile))
    },
    _handleSignedIn: function() {
        this._accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token, this._loadChannels()
    },
    _handleSignedOut: function() {
        this._accessToken = null, this._channel = null, this._loadChannelRequested = !1
    },
    _calculateRecordButtonHidden: function(e) {
        return "started" === e
    },
    _calculateStopButtonHidden: function(e) {
        return "started" !== e
    },
    _calculateRecordingUploadButtonHidden: function(e) {
        return "stopped" !== e
    },
    _calculateVideoControls: function(e) {
        return "stopped" === e
    }
});


Polymer.IronRangeBehavior = {
    properties: {
        value: {
            type: Number,
            value: 0,
            notify: !0,
            reflectToAttribute: !0
        },
        min: {
            type: Number,
            value: 0,
            notify: !0
        },
        max: {
            type: Number,
            value: 100,
            notify: !0
        },
        step: {
            type: Number,
            value: 1,
            notify: !0
        },
        ratio: {
            type: Number,
            value: 0,
            readOnly: !0,
            notify: !0
        }
    },
    observers: ["_update(value, min, max, step)"],
    _calcRatio: function(t) {
        return (this._clampValue(t) - this.min) / (this.max - this.min)
    },
    _clampValue: function(t) {
        return Math.min(this.max, Math.max(this.min, this._calcStep(t)))
    },
    _calcStep: function(t) {
        if (t = parseFloat(t), !this.step) return t;
        var e = Math.round((t - this.min) / this.step);
        return this.step < 1 ? e / (1 / this.step) + this.min : e * this.step + this.min
    },
    _validateValue: function() {
        var t = this._clampValue(this.value);
        return this.value = this.oldValue = isNaN(t) ? this.oldValue : t, this.value !== t
    },
    _update: function() {
        this._validateValue(), this._setRatio(100 * this._calcRatio(this.value))
    }
};
