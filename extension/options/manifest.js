this.manifest = {
    "name": chrome.i18n.getMessage('manifest_extensionName'),
    "icon": "../icon.png",
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
            "group": i18n.get("TOTP"),
            "name": "useTotp",
            "type": "checkbox",
            "label": i18n.get("Time based One-Time Password - Use OfChat and FreeOTP or Google Authernticator App")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("TOTP"),
            "name": "qrcode",
            "type": "button",
            "text": i18n.get("QR Code")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Certificate"),
            "name": "useClientCert",
            "type": "checkbox",
            "label": i18n.get("Use Client Certificate (No password required)")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Certificate"),
            "name": "certificate",
            "type": "button",
            "text": i18n.get("Download")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "displayname",
            "type": "text",
            "label": i18n.get("displayname"),
            "text": i18n.get("x_characters")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "username",
            "type": "text",
            "label": i18n.get("username"),
            "text": i18n.get("x_characters")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "password",
            "type": "text",
            "label": i18n.get("password"),
            "text": i18n.get("x_characters_pw"),
            "masked": true
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("login"),
            "name": "connect",
            "type": "button",
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
            "name": "desktopShareMode",
            "type": "checkbox",
            "label": i18n.get("Desktop Share mode only")
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
            "name": "audioOnly",
            "type": "checkbox",
            "label": i18n.get("Audioconference Only")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Preferences"),
            "name": "enableTouchPad",
            "type": "checkbox",
            "label": i18n.get("Enable Communicator TouchPad")
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
        {                                      // candy chat
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Candy Chat"),
            "name": "enableChat",
            "type": "checkbox",
            "label": i18n.get("Enable Candy Chat")
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
        {                                             // converse-inverse
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Converse"),
            "name": "enableInverse",
            "type": "checkbox",
            "label": i18n.get("Enable Converse")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Converse"),
            "name": "converseDebug",
            "type": "checkbox",
            "label": i18n.get("Enable Debug")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Converse"),
            "name": "notifyAllRoomMessages",
            "type": "checkbox",
            "label": i18n.get("Notify all room messages")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Converse"),
            "name": "messageCarbons",
            "type": "checkbox",
            "label": i18n.get("Enable message carbons")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Converse"),
            "name": "autoReconnect",
            "type": "checkbox",
            "label": i18n.get("Auto reconnect")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Converse"),
            "name": "rosterGroups",
            "type": "checkbox",
            "label": i18n.get("Show roster groups")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Converse"),
            "name": "allowNonRosterMessaging",
            "type": "checkbox",
            "label": i18n.get("Allow non roster messaging")
        },
        {                                       // blogger
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Blogger"),
            "name": "enableBlog",
            "type": "checkbox",
            "label": i18n.get("Enable Blogging")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Blogger"),
            "name": "blogName",
            "type": "text",
            "label": i18n.get("Blog Name"),
            "text": i18n.get("solo"),
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("SIP Phone"),
            "name": "enableSip",
            "type": "checkbox",
            "label": i18n.get("Enable SIP Phone")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Collaboration"),
            "name": "uploadAppLabel",
            "type": "description",
            "text": i18n.get("upload_app")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Collaboration"),
            "name": "uploadApp",
            "type": "description",
            "text": ""
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Collaboration"),
            "name": "uploadStatus",
            "type": "description",
            "text": ""
        },
        {                                           // user directory
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
        },
        {                                           // touch pad
            "tab": i18n.get("TouchPad Page:1"),
            "group": i18n.get("General"),
            "name": "pageLabel_1",
            "type": "text",
            "label": i18n.get("Label"),
            "text": i18n.get("Enter the label for page 1"),
        },
        {
            "tab": i18n.get("TouchPad Page:2"),
            "group": i18n.get("General"),
            "name": "pageLabel_2",
            "type": "text",
            "label": i18n.get("Label"),
            "text": i18n.get("Enter the label for page 2"),
        },
        {
            "tab": i18n.get("TouchPad Page:3"),
            "group": i18n.get("General"),
            "name": "pageLabel_3",
            "type": "text",
            "label": i18n.get("Label"),
            "text": i18n.get("Enter the label for page 3"),
        },
        {
            "tab": i18n.get("TouchPad Page:4"),
            "group": i18n.get("General"),
            "name": "pageLabel_4",
            "type": "text",
            "label": i18n.get("Label"),
            "text": i18n.get("Enter the label for page 4"),
        },
        {
            "tab": i18n.get("TouchPad Page:5"),
            "group": i18n.get("General"),
            "name": "pageLabel_5",
            "type": "text",
            "label": i18n.get("Label"),
            "text": i18n.get("Enter the label for page 5"),
        },
        {
            "tab": i18n.get("TouchPad Speakers"),
            "group": i18n.get("General"),
            "name": "speakersEnabled",
            "type": "checkbox",
            "label": i18n.get("Enable Speakers"),
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

for (var p=1; p<6; p++)
{
    this.manifest.settings.push(
    {
        "tab": i18n.get("TouchPad Page:" + p),
        "group": i18n.get("General"),
        "name": "pageEnabled_" + p,
        "type": "checkbox",
        "label": i18n.get("Enable page " + p),
    });

    for (var i=1; i<8; i++)     // row 8 is soft key area
    {
        for (var j=1; j<9; j++)
        {
            this.manifest.settings.push(
            {
                "tab": i18n.get("TouchPad Page:" + p),
                "group": i18n.get("Cell " + i + "/" + j),
                "name": "cellEnabled_" + p + "_" + i + "_" + j,
                "type": "checkbox",
                "label": i18n.get("Enable row " + i + " col " + j),
            });

            this.manifest.settings.push(
            {
                "tab": i18n.get("TouchPad Page:" + p),
                "group": i18n.get("Cell " + i + "/" + j),
                "name": "cellLabel_" + p + "_" + i + "_" + j,
                "type": "text",
                "label": i18n.get("Label"),
                "text": i18n.get("Enter the label for row " + i + " col " + j),
            });

            this.manifest.settings.push(
            {
                "tab": i18n.get("TouchPad Page:" + p),
                "group": i18n.get("Cell " + i + "/" + j),
                "name": "cellValue_" + p + "_" + i + "_" + j,
                "type": "text",
                "label": i18n.get("Value"),
                "text": i18n.get("Enter the value for row " + i + " col " + j),
            });
        }
    }
}

for (var s=1; s<9; s++)
{
    this.manifest.settings.push(
    {
        "tab": i18n.get("TouchPad Speakers"),
        "group": i18n.get("Speaker " + s),
        "name": "speakerEnabled_" + s,
        "type": "checkbox",
        "label": i18n.get("Enable speaker " + s),
    });

    this.manifest.settings.push(
    {
        "tab": i18n.get("TouchPad Speakers"),
        "group": i18n.get("Speaker " + s),
        "name": "speakerLabel_" + s,
        "type": "text",
        "label": i18n.get("Label"),
        "text": i18n.get("Enter the label for speaker " + s),
    });

    this.manifest.settings.push(
    {
        "tab": i18n.get("TouchPad Speakers"),
        "group": i18n.get("Speaker " + s),
        "name": "speakerValue_" + s,
        "type": "text",
        "label": i18n.get("Value"),
        "text": i18n.get("Enter the value for speaker " + s),
    });
}