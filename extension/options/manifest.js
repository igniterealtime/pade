this.manifest = {
    "name": "Pade - Openfire Meetings",
    "icon": "../ofmeet.png",
    "settings": [
        {
            "tab": i18n.get("general"),
            "group": i18n.get("connection"),
            "name": "server",
            "type": "text",
            "label": i18n.get("server"),
            "text": "server name:port"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("connection"),
            "name": "domain",
            "type": "text",
            "label": i18n.get("domain"),
            "text": "domain name"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("connection"),
            "name": "useWebsocket",
            "type": "checkbox",
            "label": i18n.get("Use Websockets")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "displayname",
            "type": "text",
            "label": i18n.get("displayname"),
            "text": i18n.get("x-characters")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "username",
            "type": "text",
            "label": i18n.get("username"),
            "text": i18n.get("x-characters")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "password",
            "type": "text",
            "label": i18n.get("password"),
            "text": i18n.get("x-characters-pw"),
            "masked": true
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "connect",
            "type": "button",
            "label": i18n.get("connect"),
            "text": i18n.get("login")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "status",
            "text": i18n.get(""),
            "type": "description"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "showOnlyOnlineUsers",
            "type": "checkbox",
            "label": i18n.get("Show Only Online Users")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "popupWindow",
            "type": "checkbox",
            "label": i18n.get("Popup Window")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "showSharedCursor",
            "type": "checkbox",
            "label": i18n.get("Show Shared Cursor")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "enableRingtone",
            "type": "checkbox",
            "label": i18n.get("Enable Ringtone")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "useJabra",
            "type": "checkbox",
            "label": i18n.get("Use Jabra Speakerphone (Models 410, 510, 710 & 810)")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "enableChat",
            "type": "checkbox",
            "label": i18n.get("Enable Candy Chat")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "enableSip",
            "type": "checkbox",
            "label": i18n.get("Enable FreeSWITCH Audio")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "audioOnly",
            "type": "checkbox",
            "label": i18n.get("Audioconference Only")
        },
        {                                                   // ofmeet config
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "disableAudioLevels",
            "type": "checkbox",
            "label": i18n.get("Disable Audio levels")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "enableLipSync",
            "type": "checkbox",
            "label": i18n.get("Enable LipSync")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "startWithAudioMuted",
            "type": "checkbox",
            "label": i18n.get("Start with Audio Muted")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "startWithVideoMuted",
            "type": "checkbox",
            "label": i18n.get("Start with Video Muted")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "startBitrate",
            "type": "text",
            "label": i18n.get("Start Bitrate"),
            "text": i18n.get("800"),
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "resolution",
            "type": "text",
            "label": i18n.get("Resolution"),
            "text": i18n.get("720"),
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "minHDHeight",
            "type": "text",
            "label": i18n.get("Min HD Height"),
            "text": i18n.get("540"),
        },
        {                                               // ofmeet ui
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("ui"),
            "name": "VERTICAL_FILMSTRIP",
            "type": "checkbox",
            "label": i18n.get("Enable Vertical Filmstrip")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("ui"),
            "name": "ACTIVE_SPEAKER_AVATAR_SIZE",
            "type": "text",
            "label": i18n.get("Active Speaker Avatar Size"),
            "text": i18n.get("100"),
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("ui"),
            "name": "FILM_STRIP_MAX_HEIGHT",
            "type": "text",
            "label": i18n.get("Filmstrip Maximium Height"),
            "text": i18n.get("80"),
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Candy Chat"),
            "name": "chatWithOnlineContacts",
            "type": "checkbox",
            "label": i18n.get("Chat with Online Contacts")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Candy Chat"),
            "name": "notifyWhenMentioned",
            "type": "checkbox",
            "label": i18n.get("Notify/Highlight when mentioned")
        },
        {											// user directory
            "tab": i18n.get("User Directory"),
            "group": i18n.get("User Directory"),
            "name": "searchString",
            "type": "text",
            "label": i18n.get(""),
            "text": i18n.get("Enter the partial name or email address"),
        },
        {
            "tab": i18n.get("User Directory"),
            "group": i18n.get("User Directory"),
            "name": "search",
            "type": "button",
            "label": i18n.get(""),
            "text": i18n.get("search")
        },
        {
            "tab": i18n.get("User Directory"),
            "group": i18n.get("User Directory"),
            "name": "searchResults",
            "text": i18n.get(""),
            "type": "description"
        }
    ],
    "alignment": [
        [
            "server",
            "domain"
        ],
        [
            "username",
            "displayname",
            "password"
        ],
        [
            "startBitrate",
            "resolution",
            "minHDHeight"
        ],
        [
            "ACTIVE_SPEAKER_AVATAR_SIZE",
            "FILM_STRIP_MAX_HEIGHT"
        ]
    ]
};
