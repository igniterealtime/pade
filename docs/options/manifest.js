this.manifest = {
    "name": chrome.i18n.getMessage('manifest_extensionName') + " - " + chrome.runtime.getManifest().version,
    "icon": "../icon.png",
    "settings": [
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Connection"),
            "name": "server",
            "type": "text",
            "label": i18n.get("server"),
            "text": "example.com:7443"
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Connection"),
            "name": "domain",
            "type": "text",
            "label": i18n.get("domain"),
            "text": "example.com"
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Connection"),
            "name": "useWebsocket",
            "type": "checkbox",
            "label": i18n.get("Use a websocket connection to server")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Connection"),
            "name": "autoReconnect",
            "type": "checkbox",
            "label": i18n.get("Auto reconnect background connection")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Login"),
            "name": "displayname",
            "type": "text",
            "label": i18n.get("displayname"),
            "text": i18n.get("Another User")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Login"),
            "name": "username",
            "type": "text",
            "label": i18n.get("username"),
            "text": i18n.get("another.user")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Login"),
            "name": "email",
            "type": "text",
            "label": i18n.get("email"),
            "text": "name@domain"
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Login"),
            "name": "password",
            "type": "text",
            "label": i18n.get("password"),
            "text": i18n.get("Pa55w0rd!!#"),
            "masked": true
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Login"),
            "name": "connect",
            "type": "button",
            "text": i18n.get("login")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("URIs"),
            "name": "boshUri",
            "type": "text",
            "label": i18n.get("Bosh"),
            "text": "https://example.com:7443/http-bind/"
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("URIs"),
            "name": "websocketUri",
            "type": "text",
            "label": i18n.get("WebSocket"),
            "text": "wss://example.com:7443/ws/"
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Authentication"),
            "name": "restartDesc",
            "type": "description",
            "text": i18n.get("<b>These settings can restart application</b>")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Authentication"),
            "name": "useBasicAuth",
            "type": "checkbox",
            "label": i18n.get("Use Basic Authentication <b>(requires openfire pade plugin)</b>")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Authentication"),
            "name": "useAnonymous",
            "type": "checkbox",
            "label": i18n.get("Use an Anonymous identity")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Authentication"),
            "name": "useWinSSO",
            "type": "checkbox",
            "label": i18n.get("Use Windows Single Sign On")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Authentication"),
            "name": "useGitea",
            "type": "checkbox",
            "label": i18n.get("Use Gitea authentication <b>(requires openfire gitea plugin)</b>")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Authentication"),
            "name": "useSmartIdCard",
            "type": "checkbox",
            "label": i18n.get("Use E-Residency Smart ID")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Authentication"),
            "name": "useSmartIdCardCert",
            "type": "checkbox",
            "label": i18n.get("Use E-Residency Smart ID Client Certificate <b>(requires openfire pade plugin)</b>")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Authentication"),
            "name": "useTotp",
            "type": "checkbox",
            "label": i18n.get("Time based One-Time Password - Use OfChat and FreeOTP or Google Authernticator App")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Authentication"),
            "name": "qrcode",
            "type": "button",
            "text": i18n.get("QR Code")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Authentication"),
            "name": "useClientCert",
            "type": "checkbox",
            "label": i18n.get("Use Client Certificate with no password.")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Authentication"),
            "name": "certificate",
            "type": "button",
            "text": i18n.get("Download")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Preferences"),
            "name": "exportPreferences",
            "type": "button",
            "text": i18n.get("Export")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Preferences"),
            "name": "exportPreferencesDesc",
            "text": i18n.get("Use this feature to <b>export</b> all current user preferences to an external branding file (pade.json)"),
            "type": "description"
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Preferences"),
            "name": "importPreferences",
            "type": "description",
            "text": ""
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Preferences"),
            "name": "importPreferencesDesc",
            "text": i18n.get("Use this feature to <b>import</b> all current user preferences from an external branding file"),
            "type": "description"
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("Preferences"),
            "name": "importExportStatus",
            "type": "description",
            "text": ""
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("About"),
            "name": "credits",
            "text": i18n.get("<a href='https://igniterealtime.org' target='_blank' style='font-size: 14px;'>P&agrave;d&eacute; ver " + chrome.runtime.getManifest().version + " Ignite Realtime Community</a>"),
            "type": "description"
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("About"),
            "name": "factoryReset",
            "type": "button",
            "text": i18n.get("Factory Reset")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("About"),
            "name": "changelog",
            "type": "button",
            "text": i18n.get("Change Log")
        },
        {
            "tab": i18n.get("Connection"),
            "group": i18n.get("About"),
            "name": "help",
            "type": "button",
            "text": i18n.get("Help")
        },
        {
            "tab": i18n.get("General"),
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
            "tab": i18n.get("General"),
            "group": i18n.get("Profile"),
            "name": "phone",
            "type": "text",
            "label": i18n.get("phone"),
            "text": "+447925488496"
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Profile"),
            "name": "sms",
            "type": "text",
            "label": i18n.get("SMS"),
            "text": "+447925488496"
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Profile"),
            "name": "country",
            "type": "text",
            "label": i18n.get("country"),
            "text": "Country code: GB, US"
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Profile"),
            "name": "exten",
            "type": "text",
            "text": i18n.get("Enter phone extension to be call controlled"),
            "label": i18n.get("Phone Extension")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Profile"),
            "name": "role",
            "type": "text",
            "label": i18n.get("role"),
            "text": "List of comma separated roles"
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Profile"),
            "name": "url",
            "type": "text",
            "label": i18n.get("url"),
            "text": "http://my-home-page.com"
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Profile"),
            "name": "saveProfile",
            "type": "button",
            "text": i18n.get("Save on Server")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Location"),
            "name": "publishLocation",
            "type": "checkbox",
            "label": i18n.get("Publish location to contacts")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Location"),
            "name": "userLocation",
            "type": "description",
            "text": ""
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Friends"),
            "name": "enableFriendships",
            "type": "checkbox",
            "label": i18n.get("Enable Direct Friendships")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Avatar/Picture"),
            "name": "uploadAvatarLabel",
            "type": "description",
            "text": i18n.get("Upload a local PNG/JPEG file as user image")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Avatar/Picture"),
            "name": "uploadAvatar",
            "type": "description",
            "text": ""
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Avatar/Picture"),
            "name": "updateAvatar",
            "type": "checkbox",
            "label": i18n.get("Update vCard with browser generated avatar")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Avatar/Picture"),
            "name": "uploadAvatarStatus",
            "type": "description",
            "text": ""
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Preferences"),
            "name": "saveWinPositions",
            "type": "checkbox",
            "label": i18n.get("Save window position and size")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Preferences"),
            "name": "openWinMinimized",
            "type": "checkbox",
            "label": i18n.get("Open auto-start windows minimized")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Fastpath (Workgroups)"),
            "name": "wgEnabled",
            "type": "checkbox",
            "label": i18n.get("Enable Workgroups (Fastpath) <b>(This will take effect on next login)</b>")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Fastpath (Workgroups)"),
            "name": "wgNotifications",
            "type": "checkbox",
            "label": i18n.get("Enable Workgroup Notifications")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Fastpath (Workgroups)"),
            "name": "wgStatusAlerts",
            "type": "checkbox",
            "label": i18n.get("Enable Workgroup status alerts")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Auto Presence"),
            "name": "enablePresenceTracking",
            "type": "checkbox",
            "label": i18n.get("Notify when a contact becomes available")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Auto Presence"),
            "name": "enablePresenceStatus",
            "type": "checkbox",
            "label": i18n.get("Notify when a contact changes their status message")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Auto Presence"),
            "name": "presNotifyWhitelist",
            "type": "textarea",
            "label": i18n.get(""),
            "text": i18n.get("List of contact JIDs. For example:\n\nuser@domain.org\nanother@domain.com"),
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Auto Presence"),
            "name": "presNotifyWhitelistDesc",
            "text": i18n.get("List of contact JIDs to to be considered when showing desktop notifications of changed contact status"),
            "type": "description"
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Auto Presence"),
            "name": "idleTimeout",
            "type": "slider",
            "label": i18n.get("Timeout (secs)"),
            "max": 900,
            "min": 0,
            "step": 30
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Auto Presence"),
            "name": "idleMessage",
            "type": "text",
            "label": i18n.get("Idle Message"),
            "text": "see you later"
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Auto Presence"),
            "name": "idleActiveMessage",
            "type": "text",
            "label": i18n.get("Active Message"),
            "text": "hello"
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("Auto Presence"),
            "name": "idleLockedMessage",
            "type": "text",
            "label": i18n.get("Locked Message"),
            "text": "good bye"
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("URL Protocol Handlers"),
            "name": "unregisterUrlProtocols",
            "type": "description",
            "text": i18n.get("Goto chrome://settings/handlers to un-register protocol handlers")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("URL Protocol Handlers"),
            "name": "registerIMProtocol",
            "type": "checkbox",
            "label": i18n.get("IM: user@domain - one-to-one instant messaging")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("URL Protocol Handlers"),
            "name": "registerXMPPProtocol",
            "type": "checkbox",
            "label": i18n.get("XMPP: chat-room - group-chat in a multi-user chat room")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("URL Protocol Handlers"),
            "name": "registerSIPProtocol",
            "type": "checkbox",
            "label": i18n.get("SIP: destination@domain - SIP audio/video conference")
        },
        {
            "tab": i18n.get("General"),
            "group": i18n.get("URL Protocol Handlers"),
            "name": "registerTELProtocol",
            "type": "checkbox",
            "label": i18n.get("TEL: destination@domain - telephone call")
        },
        {
            "tab": i18n.get("General"),
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
            "name": "showSharedCursor",
            "type": "checkbox",
            "label": i18n.get("Show Shared Cursor")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "enableRingtone",
            "type": "checkbox",
            "label": i18n.get("Enable Ringtone")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "enableRemoteControl",
            "type": "checkbox",
            "label": i18n.get("Enable Remote Control <b>(This will restart application)</b>")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "useJabra",
            "type": "checkbox",
            "label": i18n.get("Use Jabra Speakerphone (Models 410, 510, 710 & 810)")
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
            "name": "enableStereoAudio",
            "type": "checkbox",
            "label": i18n.get("Enable Stereo Audio (No echo cancellation, use headphones)")
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
            "name": "startScreenSharing",
            "type": "checkbox",
            "label": i18n.get("Start with Screen Sharing")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "recordMeeting",
            "type": "checkbox",
            "label": i18n.get("Record Meeting")
        },
        {
            "tab": i18n.get("Meetings"),
            "group": i18n.get("General Settings"),
            "name": "showCaptions",
            "type": "checkbox",
            "label": i18n.get("Show text messages as sub-titles/captions on screen")
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
            "text": "https://server:7443/ofmeet/"
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
            "min": 324,
            "step": 108
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
        {
            "tab": i18n.get("Converse"),        // converse-inverse
            "group": i18n.get("General"),
            "name": "converseAutoStart",
            "type": "checkbox",
            "label": i18n.get("Auto Start Converse")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "clearCacheOnConnect",
            "type": "checkbox",
            "label": i18n.get("Clear chat history cache at connection")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "autoReconnectConverse",
            "type": "checkbox",
            "label": i18n.get("Auto reconnect Converse connection")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "converseAutoReOpen",
            "type": "checkbox",
            "label": i18n.get("Auto re-open Converse if it was open after background reconnection")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "enableSmacks",
            "type": "checkbox",
            "label": i18n.get("Enable Stream Management")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "enableAudioConfWidget",
            "type": "checkbox",
            "label": i18n.get("Enable Audio Conferencing Widget")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "enableVoiceChat",
            "type": "checkbox",
            "label": i18n.get("Enable Voice Chat (Ohun)")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "enableVoiceChatText",
            "type": "checkbox",
            "label": i18n.get("Enable Voice Chat to Text Transcription")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "enableNotesTool",
            "type": "checkbox",
            "label": i18n.get("Enable Notes Tool")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "enableTasksTool",
            "type": "checkbox",
            "label": i18n.get("Enable Tasks Tool")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "enableTranslation",
            "type": "checkbox",
            "label": i18n.get("Enable Google translation service")
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
            "name": "conversePlaySounds",
            "type": "checkbox",
            "label": i18n.get("Enable sound notification")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "converseTimeAgo",
            "type": "checkbox",
            "label": i18n.get("Enable time ago")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "enableBookmarks",
            "type": "checkbox",
            "label": i18n.get("Enable server bookmarks")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "autoSubscribe",
            "type": "checkbox",
            "label": i18n.get("Automatically subscribe back to any contact requests")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "autoJoinOnInvite",
            "type": "checkbox",
            "label": i18n.get("Automatically join a chatroom on invite without any confirmation")
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
            "group": i18n.get("General"),
            "name": "enableHomePage",
            "type": "checkbox",
            "label": i18n.get("Enable Home Page")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "homePage",
            "type": "text",
            "label": i18n.get("Home Page"),
            "text": chrome.runtime.getManifest().homepage_url
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "homePageView",
            "type": "popupButton",
            "label": i18n.get("Home Page View Mode"),
            "options": [
                {"text": "Full Screen", "value": "fullscreen"},
                {"text": "Overlayed", "value": "overlayed"}
            ]
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "converseOpenState",
            "type": "popupButton",
            "label": i18n.get("Window Open presence state"),
            "options": [
                {"text": "I am online", "value": "online"},
                {"text": "I am free to chat", "value": "chat"},
                {"text": "I am busy", "value": "dnd"},
                {"text": "I am away", "value": "away"},
                {"text": "I am away for an extended period", "value": "xa"}
            ]
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "converseCloseState",
            "type": "popupButton",
            "label": i18n.get("Window Close presence state"),
            "options": [
                {"text": "I am online", "value": "online"},
                {"text": "I am free to chat", "value": "chat"},
                {"text": "I am busy", "value": "dnd"},
                {"text": "I am away", "value": "away"},
                {"text": "I am away for an extended period", "value": "xa"}
            ]
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("General"),
            "name": "archivedMessagesPageSize",
            "type": "slider",
            "label": i18n.get("Archived Messages Page Size"),
            "max": 201,
            "min": 1,
            "step": 20
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Storage"),
            "name": "conversePersistentStore",
            "type": "popupButton",
            "label": i18n.get("Persistent Store"),
            "options": [
                {"text": "No Storage", "value": "none"},
                {"text": "Browser Extension Local", "value": "BrowserLocal"},
                {"text": "Local Storage", "value": "localStorage"},
                {"text": "IndexedDB", "value": "IndexedDB"},
                {"text": "Browser Extension Sync", "value": "BrowserSync"}
            ]
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "converseSimpleView",
            "type": "checkbox",
            "label": i18n.get("Use simple conversations view")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "converseEmbedOfMeet",
            "type": "checkbox",
            "label": i18n.get("Embed Openfire Meetings in Converse")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "rosterGroups",
            "type": "checkbox",
            "label": i18n.get("Show Roster groups")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "showToolbarIcons",
            "type": "checkbox",
            "label": i18n.get("Show Advanced toolbar icons")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "useUpDownCursorKeys",
            "type": "checkbox",
            "label": i18n.get("Use UP & DOWN cursor keys to edit messages")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "converseRandomAvatars",
            "type": "checkbox",
            "label": i18n.get("Use Random Avatars. <b>(requires randomavatar plugin for openfire)</b>")
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
            "name": "hideOfflineUsers",
            "type": "checkbox",
            "label": i18n.get("Hide offline users")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "showWordCloud",
            "type": "checkbox",
            "label": i18n.get("Show Word Cloud in Chat Search")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "showSendButton",
            "type": "checkbox",
            "label": i18n.get("Show Send button which can be clicked to send a message")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "converseTheme",
            "type": "popupButton",
            "label": i18n.get("UI Theme"),
            "options": [
                {"text": "Plain Simple", "value": "plainsimple"},
                {"text": "Fly Concord", "value": "concord"},
                {"text": "Paper White", "value": "paperwhite"},
                {"text": "Hand Write", "value": "handwrite"},
                {"text": "Red Pill", "value": "redpill"},
                {"text": "Dark Room", "value": "darkroom"},
                {"text": "Black Board", "value": "blackboard"}
            ]
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("User Interface"),
            "name": "converseAutoCompleteFilter",
            "type": "popupButton",
            "label": i18n.get("AutoComplete Filter"),
            "options": [
                {"text": "Start With", "value": "starts_with"},
                {"text": "Contains", "value": "contains"}
            ]
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Message Threading"),
            "name": "enableThreading",
            "type": "checkbox",
            "label": i18n.get("Enable message threading")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Message Threading"),
            "name": "showUnThreaded",
            "type": "checkbox",
            "label": i18n.get("Show messages with no threads")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Message Threading"),
            "name": "broadcastThreading",
            "type": "checkbox",
            "label": i18n.get("Broadcast threading to groupchat")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Private Chat"),
            "name": "jingleCalls",
            "type": "checkbox",
            "label": i18n.get("Enable Jingle Audio/Video Calls")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Private Chat"),
            "name": "messageCarbons",
            "type": "checkbox",
            "label": i18n.get("Enable message carbons")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Private Chat"),
            "name": "allowNonRosterMessaging",
            "type": "checkbox",
            "label": i18n.get("Accept chat messages from contacts not in your roster list")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Private Chat"),
            "name": "saveAutoJoinChats",
            "type": "checkbox",
            "label": i18n.get("Save list of open chat conversations")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Private Chat"),
            "name": "autoJoinPrivateChats",
            "type": "textarea",
            "label": i18n.get(""),
            "text": i18n.get("List of contact JIDs. For example:\n\nuser@domain.org\nanother@domain.com/Title"),
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Private Chat"),
            "name": "autoJoinPrivateChatsDesc",
            "text": i18n.get("List of contact JIDs to auto-open"),
            "type": "description"
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "enableInfoPanel",
            "type": "checkbox",
            "label": i18n.get("Enable Information Panel")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "showGroupChatStatusMessages",
            "type": "checkbox",
            "label": i18n.get("Show GroupChat Status Messages")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "enableMucDirectory",
            "type": "checkbox",
            "label": i18n.get("Enable MUC Room Directory")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "alwaysShowOccupants",
            "type": "checkbox",
            "label": i18n.get("Always show occupants")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "fetchMembersList",
            "type": "checkbox",
            "label": i18n.get("Fetch Members List")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "autoCreateNickname",
            "type": "checkbox",
            "label": i18n.get("Auto Create Nickname")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "moderatorTools",
            "type": "checkbox",
            "label": i18n.get("Enable Moderator Tools GUI")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "autoListRooms",
            "type": "checkbox",
            "label": i18n.get("Auto List Rooms")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "allowMsgPinning",
            "type": "checkbox",
            "label": i18n.get("Allow messages to be pinned")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "allowMsgReaction",
            "type": "checkbox",
            "label": i18n.get("Allow message reaction")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "saveAutoJoinRooms",
            "type": "checkbox",
            "label": i18n.get("Save list of open groupchat conversations")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "autoJoinRooms",
            "type": "textarea",
            "label": i18n.get(""),
            "text": i18n.get("List of room JIDs. For example:\n\nopen_chat@conference.igniterealtime.org\nxsf@muc.xmpp.org"),
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Group Chat"),
            "name": "autoJoinRoomsDesc",
            "text": i18n.get("List of room JIDs to auto-join"),
            "type": "description"
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
            "label": i18n.get("Notify on all new groupchat messages")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Notifications"),
            "name": "notifyWhenClosed",
            "type": "checkbox",
            "label": i18n.get("Notify on all new groupchat messages from a closed local groupchat room")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Notifications"),
            "name": "notifyRoomMentions",
            "type": "checkbox",
            "label": i18n.get("Notify when my name is mentioned in groupchat conversations")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Notifications"),
            "name": "notifyOnInterests",
            "type": "checkbox",
            "label": i18n.get("Notify when any interest listed below is mentioned")
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Notifications"),
            "name": "interestList",
            "type": "textarea",
            "label": i18n.get(""),
            "text": i18n.get("List words of interest. For example:\n\npade\nxmpp\nsip"),
        },
        {
            "tab": i18n.get("Converse"),
            "group": i18n.get("Notifications"),
            "name": "interestListDesc",
            "text": i18n.get("List words of interest to be tracked and hash tagged"),
            "type": "description"
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
        {                                       // Applications
            "tab": i18n.get("Applications"),
            "group": i18n.get("Payment Systems"),
            "name": "enablePayPalMe",
            "type": "checkbox",
            "label": i18n.get("Enable PayPal Me")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Payment Systems"),
            "name": "enableTransferWise",
            "type": "checkbox",
            "label": i18n.get("Enable Transfer Wise")
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Payment Systems"),
            "name": "transferWiseKey",
            "type": "text",
            "masked": true,
            "label": i18n.get("TransferWise Key"),
            "text": i18n.get("Enter TransferWise API Key"),
        },
        {
            "tab": i18n.get("Applications"),
            "group": i18n.get("Collaboration"),
            "name": "enableCollaboration",
            "type": "checkbox",
            "label": i18n.get("Enable Collaboration - <b>requires enabling of context scripts in manifest.json</b>")
        },
        {
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
        {
            "tab": i18n.get("Applications"),    // touchpad
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
        {                                               // search
            "tab": i18n.get("Search"),
            "group": i18n.get("Rooms Directory"),
            "name": "roomsSearchString",
            "type": "text",
            "label": i18n.get(""),
            "text": i18n.get("Enter the search text"),
        },
        {
            "tab": i18n.get("Search"),
            "group": i18n.get("Rooms Directory"),
            "name": "roomsSearch",
            "type": "button",
            "label": i18n.get(""),
            "text": i18n.get("search")
        },
        {
            "tab": i18n.get("Search"),
            "group": i18n.get("Rooms Directory"),
            "name": "roomsSearchResults",
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
        },
        {
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
            "tab": i18n.get("Feeds"),
            "group": i18n.get("RSS/Atom"),
            "name": "enableRssFeeds",
            "type": "checkbox",
            "label": i18n.get("Enable RSS and Atom feeds")
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("RSS/Atom"),
            "name": "showRssSummary",
            "type": "checkbox",
            "label": i18n.get("Show RSS and Atom feed summary")
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("RSS/Atom"),
            "name": "useRssDate",
            "type": "checkbox",
            "label": i18n.get("Replace published timestamp with fetch timestamp")
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("RSS/Atom"),
            "name": "showRssToolbar",
            "type": "checkbox",
            "label": i18n.get("Show Chatbox Toolbar")
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("RSS/Atom"),
            "name": "rssFeedTitle",
            "type": "text",
            "label": i18n.get("Title"),
            "text": i18n.get("RSS Feed"),
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("RSS/Atom"),
            "name": "rssAtomFeedUrls",
            "type": "textarea",
            "label": i18n.get(""),
            "text": i18n.get("List of rss or atom feed urls. For example:\n\nhttps://discourse.igniterealtime.org/c/blogs/ignite-realtime-blogs.rss"),
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("RSS/Atom"),
            "name": "rssAtomFeedUrlsDesc",
            "text": i18n.get("List of rss or atom urls to feed from"),
            "type": "description"
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("RSS/Atom"),
            "name": "rssFeedCheck",
            "type": "slider",
            "label": i18n.get("Check interval (mins)"),
            "max": 60,
            "min": 5,
            "step": 5
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("BeeKeeper"),
            "name": "enableBeeKeeper",
            "type": "checkbox",
            "label": i18n.get("Enable BeeKeeper posts feed")
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("BeeKeeper"),
            "name": "beeKeeperTitle",
            "type": "text",
            "label": i18n.get("Title"),
            "text": i18n.get("BeeKeeper"),
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("BeeKeeper"),
            "name": "beeKeeperTopic",
            "type": "text",
            "label": i18n.get("Default topic name"),
            "text": i18n.get("post"),
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("BeeKeeper"),
            "name": "beeKeeperUrl",
            "type": "text",
            "label": i18n.get("Access Url"),
            "text": i18n.get("https://playgroundapi.industrioushive.com"),
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("BeeKeeper"),
            "name": "beeFeedCheck",
            "type": "slider",
            "label": i18n.get("Check interval (mins)"),
            "max": 60,
            "min": 5,
            "step": 5
        },
        {
            "tab": i18n.get("Feeds"),
            "group": i18n.get("BeeKeeper"),
            "name": "beeKeeperPageSize",
            "type": "slider",
            "label": i18n.get("Messages Page Size"),
            "max": 125,
            "min": 5,
            "step": 10
        },
    ],
    "alignment": [
        [   "beeKeeperTitle", "beeKeeperUrl"],
        [
            "server",
            "uportPermission",
            "domain"
        ],
        [
            "username",
            "email",
            "displayname",
            "password"
        ],
        [
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
        ],
        [
            "ofmeetInvitation",
            "letsCollaborate",
            "webinarInvite"
        ],
        [
            "boshUri",
            "websocketUri"
        ],
        [
            "homePage"
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

if (getSetting("enableFriendships", false))
{
    this.manifest.settings.push(
    {
        "tab": i18n.get("General"),
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
        "tab": i18n.get("General"),
        "group": i18n.get("Friends"),
        "name": "friendId",
        "type": "text",
        "label": i18n.get(""),
        "text": i18n.get("Enter the email, phone no or XMPP JID for friend")
    });

    this.manifest.settings.push(
    {
        "tab": i18n.get("General"),
        "group": i18n.get("Friends"),
        "name": "friendName",
        "type": "text",
        "label": i18n.get(""),
        "text": i18n.get("Enter the name of your friend")
    });

    this.manifest.settings.push(
    {
        "tab": i18n.get("General"),
        "group": i18n.get("Friends"),
        "name": "friendGroups",
        "type": "textarea",
        "label": i18n.get(""),
        "text": i18n.get("Enter the list of roster groups to which this friend should belong")
    });

    this.manifest.settings.push(
    {
        "tab": i18n.get("General"),
        "group": i18n.get("Friends"),
        "name": "friendCreate",
        "type": "button",
        "label": i18n.get(""),
        "text": i18n.get("Create Friendship")
    });
}

// TouchPad

if (getSetting("useStreamDeck", false))
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
            "name": "pageLabel_" + p,
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
        "tab": i18n.get("TouchPad Speakers"),
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

console.debug("branding - start", overrides, branding, this.manifest.settings);

for (var i=0; i<overrides.length; i++)
{
    var setting = overrides[i];
    var override = branding[setting];

    var index = getStaticSetting(setting);

    if ( index > -1)
    {
        if (override.value != null && override.value != undefined)
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

    console.debug("branding - found", i, index, setting, override.value, override.disable, window.localStorage["store.settings." + setting]);
}

function getStaticSetting(name)
{
    let zindex = -1;

    for (let z=0; z<this.manifest.settings.length; z++)
    {
        if (name === this.manifest.settings[z].name)
        {
            zindex = z;
            break;
        }
    }
    return zindex;
}
