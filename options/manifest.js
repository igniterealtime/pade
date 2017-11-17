this.manifest = {
    "name": "Openfire Meetings",
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
            "name": "enableRingtone",
            "type": "checkbox",
            "label": i18n.get("Enable Ringtone")
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
        ]
    ]
};
