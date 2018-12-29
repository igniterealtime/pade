this.manifest = {
    "name": chrome.i18n.getMessage('manifest_extensionName') + " - " + chrome.runtime.getManifest().version,
    "icon": "../icon.png",
    "settings": [
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("connection"),
            "name": "server",
            "type": "text",
            "label": i18n.get("server"),
            "text": "server_name:port or ip_address:port"
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
            "group": i18n.get("connection"),
            "name": "useWinSSO",
            "type": "checkbox",
            "label": i18n.get("Use Windows Single Sign On (SSO)")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("connection"),
            "name": "useCredsMgrApi",
            "type": "checkbox",
            "label": i18n.get("Use Credential Management API SSO")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("connection"),
            "name": "useSmartIdCard",
            "type": "checkbox",
            "label": i18n.get("Use E-Residency Smart ID")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("login"),
            "name": "displayname",
            "type": "text",
            "label": i18n.get("displayname"),
            "text": i18n.get("Another User")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("login"),
            "name": "username",
            "type": "text",
            "label": i18n.get("username"),
            "text": i18n.get("another.user")
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("login"),
            "name": "password",
            "type": "text",
            "label": i18n.get("password"),
            "text": i18n.get("Pa55w0rd!!#"),
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
            "group": i18n.get("About"),
            "name": "credits",
            "text": i18n.get("<a href='https://igniterealtime.org' target='_blank' style='font-size: 14px;'>P&agrave;d&eacute; ver " + chrome.runtime.getManifest().version + " Ignite Realtime Community</a>"),
            "type": "description"
        },
        {
            "tab": i18n.get("connection"),
            "group": i18n.get("About"),
            "name": "factoryReset",
            "type": "button",
            "text": i18n.get("Factory Reset")
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
            "group": i18n.get("Language"),
            "name": "language",
            "type": "popupButton",
            "label": i18n.get("Language"),
            "options": [
                {"text": "Afrikaans", "value": "af"},
                {"text": "Bahasa_Indonesia", "value": "id"},
                {"text": "BrazilianPortuguese", "value": "pt_br"},
                {"text": "Catalan", "value": "ca"},
                {"text": "Chinese", "value": "zh_TW"},
                {"text": "SimplifiedChinese", "value": "zh_CN"},
                {"text": "Dutch", "value": "nl"},
                {"text": "English", "value": "en"},
                {"text": "French", "value": "fr"},
                {"text": "German", "value": "de"},
                {"text": "Hebrew", "value": "he"},
                {"text": "Hindi", "value": "hi"},
                {"text": "Hungarian", "value": "hu"},
                {"text": "Italian", "value": "it"},
                {"text": "Japanese", "value": "ja"},
                {"text": "Norwegian", "value": "nb"},
                {"text": "Polish", "value": "pl"},
                {"text": "Romanian", "value": "ro"},
                {"text": "Russian", "value": "ru"},
                {"text": "Spanish", "value": "es"},
                {"text": "Ukrainian", "value": "uk"}
            ]
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Profile"),
            "name": "email",
            "type": "text",
            "label": i18n.get("email"),
            "text": "name@domain"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Profile"),
            "name": "phone",
            "type": "text",
            "label": i18n.get("phone"),
            "text": "+447925488496"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Profile"),
            "name": "sms",
            "type": "text",
            "label": i18n.get("SMS"),
            "text": "+447925488496"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Profile"),
            "name": "country",
            "type": "text",
            "label": i18n.get("country"),
            "text": "Country code: GB, US"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Profile"),
            "name": "exten",
            "type": "text",
            "text": i18n.get("Enter phone extension to be call controlled"),
            "label": i18n.get("Phone Extension")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Profile"),
            "name": "role",
            "type": "text",
            "label": i18n.get("role"),
            "text": "List of comma separated roles"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Profile"),
            "name": "url",
            "type": "text",
            "label": i18n.get("url"),
            "text": "http://my-home-page.com"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Profile"),
            "name": "saveProfile",
            "type": "button",
            "text": i18n.get("Save on Server")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Friends"),
            "name": "enableFriendships",
            "type": "checkbox",
            "label": i18n.get("Enable Direct Friendships")
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
            "name": "updateAvatar",
            "type": "checkbox",
            "label": i18n.get("Update vCard with browser generated avatar")
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
            "name": "saveWinPositions",
            "type": "checkbox",
            "label": i18n.get("Save Window postions and sizes")
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
            "name": "wgNotifications",
            "type": "checkbox",
            "label": i18n.get("Workgroup Notifications")
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
            "group": i18n.get("Auto Presence"),
            "name": "idleTimeout",
            "type": "slider",
            "label": i18n.get("Timeout (secs)"),
            "max": 900,
            "min": 60,
            "step": 30
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Auto Presence"),
            "name": "idleMessage",
            "type": "text",
            "label": i18n.get("Idle Message"),
            "text": "see you later"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Auto Presence"),
            "name": "idleActiveMessage",
            "type": "text",
            "label": i18n.get("Active Message"),
            "text": "hello"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("Auto Presence"),
            "name": "idleLockedMessage",
            "type": "text",
            "label": i18n.get("Locked Message"),
            "text": "good bye"
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("URL Protocol Handlers"),
            "name": "unregisterUrlProtocols",
            "type": "description",
            "text": i18n.get("Goto chrome://settings/handlers to un-register protocol handlers")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("URL Protocol Handlers"),
            "name": "registerIMProtocol",
            "type": "checkbox",
            "label": i18n.get("IM: user@domain - one-to-one instant messaging")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("URL Protocol Handlers"),
            "name": "registerXMPPProtocol",
            "type": "checkbox",
            "label": i18n.get("XMPP: chat-room - group-chat in a multi-user chat room")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("URL Protocol Handlers"),
            "name": "registerSIPProtocol",
            "type": "checkbox",
            "label": i18n.get("SIP: destination@domain - SIP audio/video conference")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("URL Protocol Handlers"),
            "name": "registerTELProtocol",
            "type": "checkbox",
            "label": i18n.get("TEL: destination@domain - telephone call")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("URL Protocol Handlers"),
            "name": "registerMEETProtocol",
            "type": "checkbox",
            "label": i18n.get("WEB+MEET: meeting-room - Openfire meeting")
        },
        {
            "tab": i18n.get("general"),
            "group": i18n.get("URL Protocol Handlers"),
            "name": "registerUrlProtocols",
            "type": "button",
            "text": i18n.get("Register URL Protocols")
        },
        {                                   // ofmeet config
            "tab": i18n.get("Meetings"),
            "group": i18n.get("Invites"),
            "name": "inviteMeetingsString",
            "type": "text",
            "label": i18n.get(""),
            "text": i18n.get("Enter the partial name of meeting or blank for all"),
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("Invites"),
            "name": "inviteMeetings",
            "type": "button",
            "label": i18n.get(""),
            "text": i18n.get("Find")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("Invites"),
            "name": "inviteMeetingsResults",
            "text": i18n.get(""),
            "type": "description"
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("Planner"),
            "name": "enableMeetingPlanner",
            "type": "checkbox",
            "label": i18n.get("Enable Meeting Planner")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("Planner"),
            "name": "meetingPlanner",
            "text": i18n.get(""),
            "type": "description"
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("Planner Settings"),
            "name": "plannerNotice",
            "type": "slider",
            "label": i18n.get("Meeting Planner notice period (mins)"),
            "max": 30,
            "min": 0,
            "step": 5
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("Planner Settings"),
            "name": "plannerExpire",
            "type": "slider",
            "label": i18n.get("Meeting Planner expiry period (mins)"),
            "max": 30,
            "min": 0,
            "step": 5
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("Planner Settings"),
            "name": "plannerCheck",
            "type": "slider",
            "label": i18n.get("Meeting Planner check interval (mins)"),
            "max": 30,
            "min": 5,
            "step": 5
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "webinarMode",
            "type": "checkbox",
            "label": i18n.get("Enable Webinar Presenter")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "disableAudioLevels",
            "type": "checkbox",
            "label": i18n.get("Disable Audio levels")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "enableLipSync",
            "type": "checkbox",
            "label": i18n.get("Enable LipSync")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "p2pMode",
            "type": "checkbox",
            "label": i18n.get("Enable P2P Mode")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "startWithAudioMuted",
            "type": "checkbox",
            "label": i18n.get("Start with Audio Muted")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "startWithVideoMuted",
            "type": "checkbox",
            "label": i18n.get("Start with Video Muted")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "recordAudio",
            "type": "checkbox",
            "label": i18n.get("Record Audio")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "recordVideo",
            "type": "checkbox",
            "label": i18n.get("Record Audio/Video")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "enableTranscription",
            "type": "checkbox",
            "label": i18n.get("Enable Voice-to-Text Transcription")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "transcribeLanguage",
            "type": "popupButton",
            "label": i18n.get("Transcription Language"),
            "options": [
                {"text": "Algeria", "value": "ar-DZ"},
                {"text": "Argentina", "value": "es-AR"},
                {"text": "Australia", "value": "en-AU"},
                {"text": "Bahrain", "value": "ar-BH"},
                {"text": "Bolivia", "value": "es-BO"},
                {"text": "Brazil", "value": "pt-BR"},
                {"text": "Bulgaria", "value": "bg-BG"},
                {"text": "Canada", "value": "en-CA"},
                {"text": "Chile", "value": "es-CL"},
                {"text": "China (Simp.)", "value": "cmn-Hans-CN"},
                {"text": "Colombia", "value": "es-CO"},
                {"text": "Costa Rica", "value": "es-CR"},
                {"text": "Croatia", "value": "hr_HR"},
                {"text": "Czech Republic", "value": "cs-CZ"},
                {"text": "Denmark", "value": "da-DK"},
                {"text": "Dominican Republic", "value": "es-DO"},
                {"text": "Ecuador", "value": "es-EC"},
                {"text": "Egypt", "value": "ar-EG"},
                {"text": "El Salvador", "value": "es-SV"},
                {"text": "Finland", "value": "fi-FI"},
                {"text": "France", "value": "fr-FR"},
                {"text": "Germany", "value": "de-DE"},
                {"text": "Greece", "value": "el-GR"},
                {"text": "Guatemala", "value": "es-GT"},
                {"text": "Honduras", "value": "es-HN"},
                {"text": "Hong Kong SAR (Trad.)", "value": "cmn-Hans-HK"},
                {"text": "Hong Kong", "value": "yue-Hant-HK"},
                {"text": "Hungary", "value": "hu-HU"},
                {"text": "Iceland", "value": "is-IS"},
                {"text": "India", "value": "en-IN"},
                {"text": "India", "value": "hi-IN"},
                {"text": "Indonesia", "value": "id-ID"},
                {"text": "Iran", "value": "fa-IR"},
                {"text": "Iraq", "value": "ar-IQ"},
                {"text": "Ireland", "value": "en-IE"},
                {"text": "Israel", "value": "he-IL"},
                {"text": "Israel", "value": "ar-IL"},
                {"text": "Italy", "value": "it-IT"},
                {"text": "Japan", "value": "ja-JP"},
                {"text": "Jordan", "value": "ar-JO"},
                {"text": "Korea", "value": "ko-KR"},
                {"text": "Kuwait", "value": "ar-KW"},
                {"text": "Lebanon", "value": "ar-LB"},
                {"text": "Lithuania", "value": "lt-LT"},
                {"text": "Malaysia", "value": "ms-MY"},
                {"text": "Morocco", "value": "ar-MA"},
                {"text": "México", "value": "es-MX"},
                {"text": "Netherlands", "value": "nl-NL"},
                {"text": "New Zealand", "value": "en-NZ"},
                {"text": "Nicaragua", "value": "es-NI"},
                {"text": "Norway", "value": "nb-NO"},
                {"text": "Oman", "value": "ar-OM"},
                {"text": "Palestinian Territory", "value": "ar-PS"},
                {"text": "Panamá", "value": "es-PA"},
                {"text": "Paraguay", "value": "es-PY"},
                {"text": "Perú", "value": "es-PE"},
                {"text": "Philippines", "value": "en-PH"},
                {"text": "Philippines", "value": "fil-PH"},
                {"text": "Poland", "value": "pl-PL"},
                {"text": "Portugal", "value": "pt-PT"},
                {"text": "Puerto Rico", "value": "es-PR"},
                {"text": "Qatar", "value": "ar-QA"},
                {"text": "Romania", "value": "ro-RO"},
                {"text": "Russia", "value": "ru-RU"},
                {"text": "Saudi Arabia", "value": "ar-SA"},
                {"text": "Serbia", "value": "sr-RS"},
                {"text": "Slovakia", "value": "sk-SK"},
                {"text": "Slovenia", "value": "sl-SI"},
                {"text": "South Africa", "value": "en-ZA"},
                {"text": "Spain", "value": "es-ES"},
                {"text": "Sweden", "value": "sv-SE"},
                {"text": "Switzerland", "value": "it-CH"},
                {"text": "Taiwan (Trad.)", "value": "cmn-Hant-TW"},
                {"text": "Thailand", "value": "th-TH"},
                {"text": "Tunisia", "value": "ar-TN"},
                {"text": "Turkey", "value": "tr-TR"},
                {"text": "UAE", "value": "ar-AE"},
                {"text": "Ukraine", "value": "uk-UA"},
                {"text": "United Kingdom", "value": "en-GB"},
                {"text": "United States", "value": "en-US"},
                {"text": "Uruguay", "value": "es-UY"},
                {"text": "Venezuela", "value": "es-VE"},
                {"text": "Viet Nam", "value": "vi-VN"}
            ]
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "ofmeetUrl",
            "type": "text",
            "label": i18n.get("Base Url"),
            "text": "https://server:7443/ofmeet"
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "channelLastN",
            "type": "slider",
            "label": i18n.get("Maximium Video Streams"),
            "max": 32,
            "min": -1,
            "step": 1
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "startAudioMuted",
            "type": "slider",
            "label": i18n.get("Start Audio muted after"),
            "max": 15,
            "min": 1,
            "step": 1
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "startVideoMuted",
            "type": "slider",
            "label": i18n.get("Start Video muted after"),
            "max": 15,
            "min": 1,
            "step": 1
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "startBitrate",
            "type": "slider",
            "label": i18n.get("Start Bitrate"),
            "max": 1600,
            "min": 800,
            "step": 100
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "resolution",
            "type": "slider",
            "label": i18n.get("Resolution"),
            "max": 1080,
            "min": 320,
            "step": 160
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "minHDHeight",
            "type": "slider",
            "label": i18n.get("Min HD Height"),
            "max": 1000,
            "min": 0,
            "step": 100
        },
        {                                               // ofmeet ui
            "tab": i18n.get("Meetings"),
            "group": i18n.get("UI Settings"),
            "name": "VERTICAL_FILMSTRIP",
            "type": "checkbox",
            "label": i18n.get("Enable Vertical Filmstrip")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("UI Settings"),
            "name": "enableCaptions",
            "type": "checkbox",
            "label": i18n.get("Show Chat as Captions/Sub-titles")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("UI Settings"),
            "name": "INITIAL_TOOLBAR_TIMEOUT",
            "type": "slider",
            "label": i18n.get("Initial Toolbar Timeout"),
            "max": 50000,
            "min": 10000,
            "step": 10000
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("UI Settings"),
            "name": "TOOLBAR_TIMEOUT",
            "type": "slider",
            "label": i18n.get("Toolbar Timeout"),
            "max": 10000,
            "min": 2000,
            "step": 1000
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("UI Settings"),
            "name": "FILM_STRIP_MAX_HEIGHT",
            "type": "slider",
            "label": i18n.get("Filmstrip Maximum Height"),
            "max": 160,
            "min": 80,
            "step": 10
        },
        {                                             // converse-inverse
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "enableInverse",
            "type": "checkbox",
            "label": i18n.get("Enable Converse")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "converseAutoStart",
            "type": "checkbox",
            "label": i18n.get("Auto Start Converse")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "converseDebug",
            "type": "checkbox",
            "label": i18n.get("Enable Debug")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "messageCarbons",
            "type": "checkbox",
            "label": i18n.get("Enable message carbons")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "conversePlaySounds",
            "type": "checkbox",
            "label": i18n.get("Enable sound notification")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "autoReconnect",
            "type": "checkbox",
            "label": i18n.get("Auto reconnect")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "allowNonRosterMessaging",
            "type": "checkbox",
            "label": i18n.get("Allow non roster messaging")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "autoListRooms",
            "type": "checkbox",
            "label": i18n.get("Auto List Rooms")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "enablePasting",
            "type": "checkbox",
            "label": i18n.get("Enable Clipboard pasting of URLs and images")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "rosterGroups",
            "type": "checkbox",
            "label": i18n.get("Show roster groups")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "showGroupChatStatusMessages",
            "type": "checkbox",
            "label": i18n.get("Show GroupChat Status Messages")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "converseRosterIcons",
            "type": "checkbox",
            "label": i18n.get("Enable Coloured Deterministic Roster Icons")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "converseRosterFilter",
            "type": "checkbox",
            "label": i18n.get("Enable Contacts Filter")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "useMarkdown",
            "type": "checkbox",
            "label": i18n.get("Enable Markdown formatting in chat")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "enableInfoPanel",
            "type": "checkbox",
            "label": i18n.get("Enable Information Panel")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "converseTheme",
            "type": "popupButton",
            "label": i18n.get("UI Theme"),
            "options": [
                {"text": "Paper White", "value": "paperwhite"},
                {"text": "Plain Simple", "value": "plainsimple"},
                {"text": "Dark Room", "value": "darkroom"},
                {"text": "Black Board", "value": "blackboard"}
            ]
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Canned Responses"),
            "name": "enableCannedResponses",
            "type": "checkbox",
            "label": i18n.get("Enable Canned Responses")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Canned Responses"),
            "name": "cannedResponses",
            "text": i18n.get(""),
            "type": "description"
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Notifications"),
            "name": "notifyAllRoomMessages",
            "type": "checkbox",
            "label": i18n.get("Notify all room messages")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Notifications"),
            "name": "notifyRoomMentions",
            "type": "checkbox",
            "label": i18n.get("Notify on room mentions")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Notifications"),
            "name": "notifyOnInterests",
            "type": "checkbox",
            "label": i18n.get("Notify on any interest")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Notifications"),
            "name": "interestList",
            "type": "textarea",
            "label": i18n.get(""),
            "text": i18n.get("List of words of interest. For example:\npade\nxmpp\nsip"),
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Labels"),
            "name": "ofmeetInvitation",
            "type": "text",
            "label": i18n.get("Invitation"),
            "text": i18n.get("Please join meeting at"),
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Labels"),
            "name": "letsCollaborate",
            "type": "text",
            "label": i18n.get("Collaborate"),
            "text": i18n.get("Lets collaborate on"),
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Labels"),
            "name": "webinarInvite",
            "type": "text",
            "label": i18n.get("Webinar"),
            "text": i18n.get("Please join webinar at"),
        },
        {                                               // collaboration
            "tab": i18n.get("Applications"),
            "group": i18n.get("Collaboration"),
            "name": "collabUrlListlabel",
            "type": "description",
            "text": i18n.get("List of collaboration/co-browse urls")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Collaboration"),
            "name": "updateCollabUrlList",
            "type": "button",
            "label": i18n.get(""),
            "text": i18n.get("Update")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Collaboration"),
            "name": "collabUrlList",
            "type": "textarea",
            "label": i18n.get(""),
            "text": i18n.get("https://igniterealtime.org\nhttps://www.princeton.edu/~archss/webpdfs08/BaharMartonosi.pdf"),
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Collaboration"),
            "name": "uploadAppLabel",
            "type": "description",
            "text": i18n.get("upload_app")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Collaboration"),
            "name": "uploadApp",
            "type": "description",
            "text": ""
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Collaboration"),
            "name": "uploadStatus",
            "type": "description",
            "text": ""
        },
        {                                       // touchpad
            "tab": i18n.get("Applications"),
            "group": i18n.get("TouchPad"),
            "name": "enableTouchPad",
            "type": "checkbox",
            "label": i18n.get("Enable Communicator TouchPad")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("TouchPad"),
            "name": "useStreamDeck",
            "type": "checkbox",
            "label": i18n.get("Use Stream Deck as a TouchPad")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("TouchPad"),
            "name": "touchPadAutoStart",
            "type": "checkbox",
            "label": i18n.get("Auto Start Communicator Touchpad")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("TouchPad"),
            "name": "audioOnly",
            "type": "checkbox",
            "label": i18n.get("Audioconference Only (no video)")
        },
        {                                      // community web app
            "tab": i18n.get("Applications"),
            "group": i18n.get("Community"),
            "name": "enableCommunity",
            "type": "checkbox",
            "label": i18n.get("Enable Community")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Community"),
            "name": "communityAutoStart",
            "type": "checkbox",
            "label": i18n.get("Auto Start Community")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Community"),
            "name": "embedCommunityChat",
            "type": "checkbox",
            "label": i18n.get("Embed Converse for Community chat")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Community"),
            "name": "communitySidecar",
            "type": "checkbox",
            "label": i18n.get("Use a sidecar panel for Converse")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Community"),
            "name": "disableChatButton",
            "type": "checkbox",
            "label": i18n.get("Disable chat button for Converse")
        },
/*
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Community"),
            "name": "chatWithOnlineContacts",
            "type": "checkbox",
            "label": i18n.get("Chat with Online Contacts")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Community"),
            "name": "notifyWhenMentioned",
            "type": "checkbox",
            "label": i18n.get("Notify/Highlight when mentioned")
        },
*/
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Community"),
            "name": "communityUrl",
            "type": "text",
            "label": i18n.get("Web Url"),
            "text": i18n.get("https://my_server/tiki"),
        },
        {                                       // sip phone
            "tab": i18n.get("Applications"),
            "group": i18n.get("Phone"),
            "name": "sipDescription",
            "type": "description",
            "text": i18n.get("SIP Phone. <b>The ofswitch plugin for Openfire is required for this</b>")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Phone"),
            "name": "enableSip",
            "type": "checkbox",
            "label": i18n.get("Enable CTX SIP Phone")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Phone"),
            "name": "sipAutoStart",
            "type": "checkbox",
            "label": i18n.get("Auto Start Phone")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Phone"),
            "name": "enableVerto",
            "type": "checkbox",
            "label": i18n.get("Enable Verto Communicator")
        },
        {                                        // draw.io web apps
            "tab": i18n.get("Applications"),
            "group": i18n.get("DrawIO"),
            "name": "drawioDescription",
            "type": "description",
            "text": i18n.get("Diagramming Tool. <b>The DrawIO plugin for Openfire is required for this</b>")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("DrawIO"),
            "name": "enableDrawIO",
            "type": "checkbox",
            "label": i18n.get("Enable Diagraming Tool")
        },
        {                                        // ONLYOFFICE collaboration document editors
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlyOfficeDescription",
            "type": "description",
            "text": i18n.get("ONLYOFFICE Collaboration Document Editors. <b>The Docker plugin for Openfire is required for this</b>")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "enableOnlyOffice",
            "type": "checkbox",
            "label": i18n.get("Enable Collaboration Document Editors")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlychat",
            "type": "checkbox",
            "label": i18n.get("Enable Chat")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlycomments",
            "type": "checkbox",
            "label": i18n.get("Allow Comments")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlycompactToolbar",
            "type": "checkbox",
            "label": i18n.get("Enable Compact Toolbar")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlyleftMenu",
            "type": "checkbox",
            "label": i18n.get("Enable Left menu")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlyrightMenu",
            "type": "checkbox",
            "label": i18n.get("Enable Right menu")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlytoolbar",
            "type": "checkbox",
            "label": i18n.get("Enable Main Toolbar")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlyheader",
            "type": "checkbox",
            "label": i18n.get("Enable Header")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "statusBar",
            "type": "checkbox",
            "label": i18n.get("Enable Status bar")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlyautosave",
            "type": "checkbox",
            "label": i18n.get("Enable Auto Save")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlyforcesave",
            "type": "checkbox",
            "label": i18n.get("Enable Force Save")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlycommentAuthorOnly",
            "type": "checkbox",
            "label": i18n.get("Comments by Author only")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlyshowReviewChanges",
            "type": "checkbox",
            "label": i18n.get("Show Review Changes")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlyOfficeVersion",
            "type": "text",
            "text": i18n.get("Enter the ONLYOFFICE version eg 5.2.2-2"),
            "label": i18n.get("Version")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("ONLYOFFICE"),
            "name": "onlyzoom",
            "type": "slider",
            "label": i18n.get("Zoom factor"),
            "max": 100,
            "min": 50,
            "step": 5
        },
        {                                       // RDP (remote desktop protocol)
            "tab": i18n.get("Applications"),
            "group": i18n.get("RDP"),
            "name": "rdpDescription",
            "type": "description",
            "text": i18n.get("Remote Desktop protocol (RDP). <b>The RDP plugin for Openfire is required for this</b>")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("RDP"),
            "name": "remoteHost",
            "type": "text",
            "text": i18n.get("Enter remote host name or IP Address"),
            "label": i18n.get("Remote Host")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("RDP"),
            "name": "remoteDomain",
            "type": "text",
            "text": i18n.get("Enter remote domain name"),
            "label": i18n.get("Remote Domain")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("RDP"),
            "name": "remoteUsername",
            "type": "text",
            "text": i18n.get("Enter remote username or leave blank"),
            "label": i18n.get("Remote Username")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("RDP"),
            "name": "remotePassword",
            "type": "text",
            "masked": true,
            "text": i18n.get("Enter remote password or leave blank"),
            "label": i18n.get("Remote Password")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("RDP"),
            "name": "remoteConnect",
            "type": "button",
            "label": i18n.get(""),
            "text": i18n.get("Connect")
        },
        {                                       // blogger
            "tab": i18n.get("Applications"),
            "group": i18n.get("Blogger"),
            "name": "blogDescription",
            "type": "description",
            "text": i18n.get("Blogger and Website Tool for LiveChat. <b>The solo plugin for Openfire is required for this</b>")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Blogger"),
            "name": "enableBlog",
            "type": "checkbox",
            "label": i18n.get("Enable Blogging")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Blogger"),
            "name": "blogName",
            "type": "text",
            "label": i18n.get("Blog Name"),
            "text": i18n.get("solo"),
        },
        {                                        // message blast
            "tab": i18n.get("Applications"),
            "group": i18n.get("Message Blast"),
            "name": "blastDescription",
            "type": "description",
            "text": i18n.get("Message blast to multiple people Tool. <b>The ofchat plugin for Openfire is required for this</b>")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Message Blast"),
            "name": "enableBlast",
            "type": "checkbox",
            "label": i18n.get("Enable Message Blast")
        },
        {                                       // hosted web apps
            "tab": i18n.get("Applications"),
            "group": i18n.get("Hosted Apps"),
            "name": "enableOffice365Business",
            "type": "checkbox",
            "label": i18n.get("Enable Office 365 Business")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Hosted Apps"),
            "name": "enableOffice365Personal",
            "type": "checkbox",
            "label": i18n.get("Enable Office 365 Personal")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Hosted Apps"),
            "name": "of365AutoStart",
            "type": "checkbox",
            "label": i18n.get("Auto Start Hosted Apps")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Hosted Apps"),
            "name": "enableWebApps",
            "type": "checkbox",
            "label": i18n.get("Enable Web Apps")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Hosted Apps"),
            "name": "webApps",
            "type": "text",
            "label": i18n.get("Web Apps"),
            "text": i18n.get("Enter list of web app URLs"),
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Hosted Apps"),
            "name": "enableGmail",
            "type": "checkbox",
            "label": i18n.get("Enable Gmail")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Hosted Apps"),
            "name": "gmailAccounts",
            "type": "text",
            "label": i18n.get("Gmail"),
            "text": i18n.get("Enter list of email accounts"),
        },
        {                                       // a/v capture
            "tab": i18n.get("Applications"),
            "group": i18n.get("A/V Capture"),
            "name": "enableAVCapture",
            "type": "checkbox",
            "label": i18n.get("Enable Audio/Video Capture")
        },
        {                                   // search
            "tab": i18n.get("Search"),
            "group": i18n.get("Conversations"),
            "name": "convSearchString",
            "type": "text",
            "label": i18n.get(""),
            "text": i18n.get("Enter the keywords delimted by space"),
        },
        {
            "tab": i18n.get("Search"),
            "group": i18n.get("Conversations"),
            "name": "convSearch",
            "type": "button",
            "label": i18n.get(""),
            "text": i18n.get("search")
        },
        {
            "tab": i18n.get("Search"),
            "group": i18n.get("Conversations"),
            "name": "convPdf",
            "type": "button",
            "label": i18n.get(""),
            "text": i18n.get("Download PDF File")
        },
        {
            "tab": i18n.get("Search"),
            "group": i18n.get("Conversations"),
            "name": "convSearchResults",
            "text": i18n.get(""),
            "type": "description"
        },
        {
            "tab": i18n.get("Search"),
            "group": i18n.get("User Directory"),
            "name": "searchString",
            "type": "text",
            "label": i18n.get(""),
            "text": i18n.get("Enter the partial name or email address"),
        },
        {
            "tab": i18n.get("Search"),
            "group": i18n.get("User Directory"),
            "name": "search",
            "type": "button",
            "label": i18n.get(""),
            "text": i18n.get("search")
        },
        {
            "tab": i18n.get("Search"),
            "group": i18n.get("User Directory"),
            "name": "searchResults",
            "text": i18n.get(""),
            "type": "description"
        },
        {
            "tab": i18n.get("Search"),
            "group": i18n.get("Invitation List"),
            "name": "meetingName",
            "type": "text",
            "label": i18n.get(""),
            "text": i18n.get("Enter a name for the meeting"),
        },
        {
            "tab": i18n.get("Search"),
            "group": i18n.get("Invitation List"),
            "name": "invitationList",
            "type": "textarea",
            "label": i18n.get(""),
            "text": i18n.get("Edit the list of meeting invitees"),
        },
        {
            "tab": i18n.get("Search"),
            "group": i18n.get("Invitation List"),
            "name": "inviteToMeeting",
            "type": "button",
            "label": i18n.get(""),
            "text": i18n.get("Meet Now")
        },
        {
            "tab": i18n.get("Search"),
            "group": i18n.get("Invitation List"),
            "name": "saveMeeting",
            "type": "button",
            "label": i18n.get(""),
            "text": i18n.get("Save for Later")
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
            "sms",
            "phone",
            "role",
            "exten",
            "country",
            "url"
        ],
        [
            "remoteHost",
            "remoteDomain",
            "remoteUsername",
            "remotePassword",
        ],
        [
            "friendId",
            "friendName"
        ],
        [
            "idleMessage",
            "idleActiveMessage",
            "idleLockedMessage"
        ]
    ]
};


var getSetting = function (name)
{
    console.debug("getSetting", name);
    var value = null;

    if (window.localStorage["store.settings." + name])
    {
        value = JSON.parse(window.localStorage["store.settings." + name]);
    }

    return value;
}

if (getSetting("useSmartIdCard", false))
{
    this.manifest.settings.push(
    {
        "tab": i18n.get("connection"),
        "group": i18n.get("connection"),
        "name": "smartCardIframe",
        "text": i18n.get(""),
        "type": "description",
        "text": "<iframe id='id-login-iframe' allowtransparency='true' width='200' height='46' frameborder='0' scrolling='no'></iframe>"
    });
}

if (getSetting("enableFriendships", false))
{
    this.manifest.settings.push(
    {
        "tab": i18n.get("general"),
        "group": i18n.get("Friends"),
        "name": "friendType",
        "type": "popupButton",
        "label": i18n.get(""),
        "options": [
            {"text": "Select how friend will communicate with you", "value": "xmpp"},
            {"text": "XMPP", "value": "xmpp"},
            {"text": "Email", "value": "email"},
            {"text": "SMS", "value": "sms"}
        ]
    });

    this.manifest.settings.push(
    {
        "tab": i18n.get("general"),
        "group": i18n.get("Friends"),
        "name": "friendId",
        "type": "text",
        "label": i18n.get(""),
        "text": i18n.get("Enter the email, phone no or XMPP JID for friend")
    });

    this.manifest.settings.push(
    {
        "tab": i18n.get("general"),
        "group": i18n.get("Friends"),
        "name": "friendName",
        "type": "text",
        "label": i18n.get(""),
        "text": i18n.get("Enter the name of your friend")
    });

    this.manifest.settings.push(
    {
        "tab": i18n.get("general"),
        "group": i18n.get("Friends"),
        "name": "friendGroups",
        "type": "textarea",
        "label": i18n.get(""),
        "text": i18n.get("Enter the list of roster groups to which this friend should belong")
    });

    this.manifest.settings.push(
    {
        "tab": i18n.get("general"),
        "group": i18n.get("Friends"),
        "name": "friendCreate",
        "type": "button",
        "label": i18n.get(""),
        "text": i18n.get("Create Friendship")
    });
}

// TouchPad

if (getSetting("enableTouchPad", false) || getSetting("useStreamDeck", false))
{
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

        this.manifest.settings.push(
        {
            "tab": i18n.get("TouchPad Page:" + p),
            "group": i18n.get("General"),
            "name": "PageLabel_" + p,
            "type": "text",
            "label": i18n.get("Label"),
            "text": i18n.get("Enter the label for page " + p),
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

    this.manifest.settings.push(
    {
        "tab": i18n.get("TouchPad Page:" + p),
        "group": i18n.get("General"),
        "name": "speakersEnabled",
        "type": "checkbox",
        "label": i18n.get("Enable Speakers")
    });


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
}

// branding overrides

var overrides = Object.getOwnPropertyNames(branding);

for (var i=0; i<overrides.length; i++)
{
    var setting = overrides[i];
    var override = branding[setting];

    var index = getStaticSetting(setting, this.manifest.settings);

    if ( index > -1)
    {
        if (override.value)
        {
            var oldSetting = this.manifest.settings[index]

            if (oldSetting.type == "description")
            {
                oldSetting.text = override.value
            }

            if (!window.localStorage["store.settings." + setting])  // override default value
            {
                window.localStorage["store.settings." + setting] = JSON.stringify(override.value);
            }
        }

        if (override.disable) this.manifest.settings.splice(index, 1);
    }

    console.debug("branding - found " + i, index, setting, override.value, override.disable);
}


function getStaticSetting(name, settings)
{
    var index = -1;

    for (var i=0; i<settings.length; i++)
    {
        if (name == settings[i].name)
        {
            index = i;
            break;
        }
    }
    return index;
}
