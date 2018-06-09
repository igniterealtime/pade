this.manifest = {
    "name": chrome.i18n.getMessage('manifest_extensionName'),
    "icon": "../icon.png",
    "settings": [
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("connection"),
            "name": "server",
            "type": "text",
            "label": i18n.get("server"),
            "text": "server name:port"
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("connection"),
            "name": "domain",
            "type": "text",
            "label": i18n.get("domain"),
            "text": "domain name"
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("connection"),
            "name": "useWebsocket",
            "type": "checkbox",
            "label": i18n.get("Use Websockets")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("uPort"),
            "name": "useUport",
            "type": "checkbox",
            "label": i18n.get("Open Identity System for the Decentralized Web")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("uPort"),
            "name": "uport",
            "type": "button",
            "text": i18n.get("QR Code")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("uPort"),
            "name": "uportPermission",
            "type": "text",
            "label": i18n.get("permission"),
            "text": i18n.get("uport_permission")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("TOTP"),
            "name": "useTotp",
            "type": "checkbox",
            "label": i18n.get("Time based One-Time Password - Use OfChat and FreeOTP or Google Authernticator App")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("TOTP"),
            "name": "qrcode",
            "type": "button",
            "text": i18n.get("QR Code")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("Certificate"),
            "name": "useClientCert",
            "type": "checkbox",
            "label": i18n.get("Use Client Certificate (No password required)")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("Certificate"),
            "name": "certificate",
            "type": "button",
            "text": i18n.get("Download")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("login"),
            "name": "displayname",
            "type": "text",
            "label": i18n.get("displayname"),
            "text": i18n.get("x_characters")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("login"),
            "name": "username",
            "type": "text",
            "label": i18n.get("username"),
            "text": i18n.get("x_characters")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("login"),
            "name": "password",
            "type": "text",
            "label": i18n.get("password"),
            "text": i18n.get("x_characters_pw"),
            "masked": true
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("login"),
            "name": "connect",
            "type": "button",
            "text": i18n.get("login")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("login"),
            "name": "status",
            "text": i18n.get(""),
            "type": "description"
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("About"),
            "name": "changelog",
            "type": "button",
            "text": i18n.get("Change Log")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("About"),
            "name": "help",
            "type": "button",
            "text": i18n.get("Help")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("contact"),
            "name": "email",
            "type": "text",
            "label": i18n.get("email"),
            "text": "name@domain"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("contact"),
            "name": "phone",
            "type": "text",
            "label": i18n.get("phone"),
            "text": "+447925488496"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("contact"),
            "name": "country",
            "type": "text",
            "label": i18n.get("country"),
            "text": "Country code: GB, US"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("contact"),
            "name": "role",
            "type": "text",
            "label": i18n.get("role"),
            "text": "List of coma sperated roles"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("contact"),
            "name": "url",
            "type": "text",
            "label": i18n.get("url"),
            "text": "http://my-home-page.com"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Avatar/Picture"),
            "name": "uploadAvatarLabel",
            "type": "description",
            "text": i18n.get("upload_avatar")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Avatar/Picture"),
            "name": "uploadAvatar",
            "type": "description",
            "text": ""
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Avatar/Picture"),
            "name": "uploadAvatarStatus",
            "type": "description",
            "text": ""
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
            "name": "enableRemoteControl",
            "type": "checkbox",
            "label": i18n.get("Enable Remote Control")
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
            "name": "useStreamDeck",
            "type": "checkbox",
            "label": i18n.get("Use Stream Deck as a TouchPad")
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
            "name": "registerUrlProtocols",
            "type": "checkbox",
            "label": i18n.get("Register Url Protocols im: (chat) and xmpp: (meeting)")
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
            "name": "p2pMode",
            "type": "checkbox",
            "label": i18n.get("Enable P2P Mode - Does not work properly with screen share or remote control")
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
            "name": "recordAudio",
            "type": "checkbox",
            "label": i18n.get("Record Audio")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "recordVideo",
            "type": "checkbox",
            "label": i18n.get("Record Audio/Video")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "enableTranscription",
            "type": "checkbox",
            "label": i18n.get("Enable Voice-to-Text Transcription")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "startBitrate",
            "type": "slider",
            "label": i18n.get("Start Bitrate"),
            "max": 1600,
            "min": 800,
            "step": 100
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "resolution",
            "type": "slider",
            "label": i18n.get("Resolution"),
            "max": 1080,
            "min": 320,
            "step": 160
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("config"),
            "name": "minHDHeight",
            "type": "slider",
            "label": i18n.get("Min HD Height"),
            "max": 1000,
            "min": 0,
            "step": 100
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
            "name": "CAPTIONS_SUBTITLES",
            "type": "checkbox",
            "label": i18n.get("Enable Captions/Sub Titles")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("ui"),
            "name": "INITIAL_TOOLBAR_TIMEOUT",
            "type": "slider",
            "label": i18n.get("Initial Toolbar Timeout"),
            "max": 50000,
            "min": 10000,
            "step": 10000
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("ui"),
            "name": "TOOLBAR_TIMEOUT",
            "type": "slider",
            "label": i18n.get("Toolbar Timeout"),
            "max": 10000,
            "min": 2000,
            "step": 1000
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("ui"),
            "name": "FILM_STRIP_MAX_HEIGHT",
            "type": "slider",
            "label": i18n.get("Filmstrip Maximium Height"),
            "max": 160,
            "min": 80,
            "step": 10
        },
        {                                       // touchpad
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("TouchPad"),
            "name": "enableTouchPad",
            "type": "checkbox",
            "label": i18n.get("Enable Communicator TouchPad")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("TouchPad"),
            "name": "touchPadAutoStart",
            "type": "checkbox",
            "label": i18n.get("Auto Start Communicator Touchpad")
        },
        {                                      // candy chat
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Candy Chat"),
            "name": "enableChat",
            "type": "checkbox",
            "label": i18n.get("Enable Candy")
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
            "name": "converseAutoStart",
            "type": "checkbox",
            "label": i18n.get("Auto Start Converse")
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
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Converse"),
            "name": "autoListRooms",
            "type": "checkbox",
            "label": i18n.get("Auto List Rooms")
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
            "name": "notifyOnInterests",
            "type": "checkbox",
            "label": i18n.get("Notify on any interest")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Converse"),
            "name": "interestList",
            "type": "text",
            "label": i18n.get("Interests"),
            "text": i18n.get("List of coma seperated interest words. For example, xmpp, sip"),
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Converse"),
            "name": "ofmeetInvitation",
            "type": "text",
            "label": i18n.get("Invitation"),
            "text": i18n.get("Please join meeting at"),
        },
        {                                       // hosted web apps
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Hosted Apps"),
            "name": "enableOffice365Business",
            "type": "checkbox",
            "label": i18n.get("Enable Office 365 Business")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Hosted Apps"),
            "name": "enableOffice365Personal",
            "type": "checkbox",
            "label": i18n.get("Enable Office 365 Personal")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Hosted Apps"),
            "name": "of365AutoStart",
            "type": "checkbox",
            "label": i18n.get("Auto Start Hosted Apps")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Hosted Apps"),
            "name": "enableWebApps",
            "type": "checkbox",
            "label": i18n.get("Enable Web Apps")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Hosted Apps"),
            "name": "webApps",
            "type": "text",
            "label": i18n.get("Web Apps"),
            "text": i18n.get("Enter list of web app urls"),
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Hosted Apps"),
            "name": "enableGmail",
            "type": "checkbox",
            "label": i18n.get("Enable Gmail")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Hosted Apps"),
            "name": "gmailAccounts",
            "type": "text",
            "label": i18n.get("Gmail"),
            "text": i18n.get("Enter list of email accounts"),
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
        {                                       // message blast
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Message Blast"),
            "name": "enableBlast",
            "type": "checkbox",
            "label": i18n.get("Enable Message Blast")
        },
        {                                       // a/v capture
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("A/V Capture"),
            "name": "enableAVCapture",
            "type": "checkbox",
            "label": i18n.get("Enable Audio/Video Capture")
        },
        {                                       // sip phone
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Phone"),
            "name": "enableSip",
            "type": "checkbox",
            "label": i18n.get("Enable SIP Phone")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Phone"),
            "name": "enableVerto",
            "type": "checkbox",
            "label": i18n.get("Enable Verto Communicator")
        },
        {
            "tab": i18n.get("ofmeet"),
            "group": i18n.get("Phone"),
            "name": "sipAutoStart",
            "type": "checkbox",
            "label": i18n.get("Auto Start Phone")
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
            "uportPermission",
            "domain"
        ],
        [
            "username",
            "displayname",
            "password"
        ],
        [
            "email",
            "phone",
            "country"
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