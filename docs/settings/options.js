converse_settings.options.opts.about = "";
converse_settings.options.opts.autoSave = true;
converse_settings.options.opts.saveDefaults = true;

converse_settings.options.addTab('General', [
    { name: 'allow_logout', desc: 'Allows you to log out' },
    { name: 'allow_public_bookmarks', desc: 'Enable if your server does not support #publish-options feature\nYour room bookmarks will be exposed' },
    { name: 'allow_registration', desc: 'Support for XEP-0077: In band registration' },
    { name: 'auto_reconnect', desc: 'Automatically reconnect to the XMPP server if the connection drops unexpectedly' },
    { name: 'clear_messages_on_reconnection', desc: 'Clear cached chat messages once you\'ve reconnected to the server' },
    { name: 'message_carbons', desc: 'Enable support for XEP-0280: Message Carbons' },
    { name: 'send_chat_state_notifications', desc: 'Determines whether chat state notifications (XEP-0085) should be sent out or not' },
    { name: 'play_sounds', desc: 'Plays a notification sound when you receive a personal message or when your nickname is mentioned' },
    { name: 'synchronize_availability', desc: 'Synchronize your chat status (`online`, `busy`, `away`) with other chat clients' },
    { name: 'enable_smacks', desc: 'Enable XEP-0198 Stream Management' },

    { type: 'h3', desc: ' ' },

    { name: 'allow_message_corrections', 'default': 'all', type: 'select', desc: 'Configures the last message correction (LMC). How you edit all of your own messages', options: [
      'none', 'all', 'last'
    ]},
    { name: 'allow_message_retraction', type: 'select', desc: 'Allows you to retract messages.', options: [
      'none', 'all', 'own', 'moderator'
    ]},
    { name: 'message_archiving', type: 'select', desc: 'Enable support for `XEP-0313: Message Archive Management', options: [
      'never', 'always', 'roster', 'undefined'
    ]},

    { name: 'auto_away', 'default': '0', type: 'text', desc: 'The amount of seconds after which your presence status should automatically become away' },
    { name: 'auto_xa', 'default': '0', type: 'text', desc: 'The amount of seconds after which your presence status should automatically become extended away' },

]);

converse_settings.options.addTab('Contacts', [

    { name: 'allow_non_roster_messaging', desc: 'Determines whether you will receive messages from users that are not in your roster' },
    { name: 'allow_chat_pending_contacts', desc: 'Enable you to chat with pending contacts' },
    { name: 'allow_contact_removal', desc: 'Enable you to remove roster contacts by clicking on the delete icon' },
    { name: 'allow_contact_requests', desc: 'Enable you to add other users as contacts' },
    { name: 'auto_subscribe', desc: 'Automatically subscribe back to any contact requests' },
    { name: 'autocomplete_add_contact', desc: 'Determines whether search suggestions are shown in the "Add Contact" modal' },

    { type: 'h3', desc: ' ' },

    { type: 'list', name: 'chatstate_notification_blacklist', desc: 'A list of JIDs to be ignored when showing desktop notifications of changed chat states',
        head: false, sortable: true, fields: [{ type: 'text'}]
    },
    { type: 'list', name: 'auto_join_private_chats', desc: 'Provide a list of private chats that should automatically be started upon login',
        head: false, sortable: true, fields: [{ type: 'text'}]
    },

]);


converse_settings.options.addTab('Group Chat', [
    { name: 'allow_muc', desc: 'Allow multi-user chat (muc) in chatrooms' },
    { name: 'allow_bookmarks', desc: 'Enables/disables chatroom bookmarks functionality' },
    { name: 'allow_muc_invitations', desc: 'Enables you to be invited to join MUC chatrooms' },
    { name: 'auto_join_on_invite', desc: 'Automatically join a chatroom on invite without any confirm' },
    { name: 'auto_register_muc_nickname', desc: 'Automatically register your nickname when you enter a groupchat' },
    { name: 'muc_fetch_members', desc: 'Fetch and show all room members' },
    { name: 'muc_instant_rooms', desc: 'Support instant/dynamic room creation' },
    { name: 'muc_nickname_from_jid', desc: 'Do not prompt to provide nicknames for groupchat' },
    { name: 'muc_respect_autojoin', desc: 'MUCs are automatically joined based on their bookmarks' },

    { type: 'h3', desc: ' ' },

    { name: 'notify_all_room_messages', type: 'list', desc: 'Provide a list of chatrooms that should automatically notify of all messages received in the room',
        head: false, sortable: true, fields: [{ type: 'text'}]
    },
    { name: 'auto_join_rooms', type: 'list', desc: 'Provide a list of groupchats that should automatically be started upon login',
        head: false, sortable: true, fields: [{ type: 'text'}]
    },

    { name: 'nickname', type: 'text', desc: 'Use this nickname for groupchat and presence' },
    { name: 'notification_delay', 'default': '5000', type: 'text', desc: 'Desktop notifications will be shown for this time in milli-seconds' },

]);

converse_settings.options.addTab('User Interface', [
    { name: 'allow_dragresize', desc: 'Enable you to resize chats by dragging the edges' },
    { name: 'auto_focus', desc: 'Textarea for composing chat messages will automatically become focused as soon as a chat is opened' },
    { name: 'hide_open_bookmarks', desc: 'Don\'t show bookmarks for rooms not currently open' },
    { name: 'hide_offline_users', desc: 'Don\'t show offline users in the roster' },
    { name: 'muc_mention_autocomplete_show_avatar', desc: 'Show avatars of MUC participants when using auto-complete' },
    { name: 'muc_show_join_leave', desc: 'Show info messages inside a chatroom whenever a user joins or leaves it' },
    { name: 'muc_show_join_leave_status', desc: 'Show status messages inside a chatroom whenever a user joins or leaves it' },
    { name: 'muc_show_logs_before_join', desc: 'Show groupchat history before you join chatroom' },
    { name: 'roster_groups', desc: 'Show any roster groups you might have configured' },
    { name: 'show_images_inline', desc: 'Images won\'t be rendered in chats, instead only their links will be shown' },
    { name: 'show_desktop_notifications', desc: 'Should any desktop notifications be shown' },
    { name: 'show_chat_state_notifications', desc: 'Specifies whether chat state (online, dnd, away) desktop notifications should be shown' },
    { name: 'show_client_info', desc: 'Specifies whether the info icon is shown on the controlbox' },
    { name: 'show_retraction_warning', desc: 'Shows a warning that complete message retraction cannot be guaranteed' },
    { name: 'show_send_button', desc: 'Adds a button to the chat which can be clicked or tapped in order to send the message' },

    { type: 'h3', desc: ' ' },

    { name: 'time_format', type: 'select', desc: 'The time format for the time shown, for each message', options: [
      'HH:mm', 'hh:mm', 'hh:mm a'
    ]},
    { name: 'theme', type: 'select', desc: 'Let\'s you set a color theme for Converse', options: [
      'default', 'concord'
    ]},
    { name: 'muc_mention_autocomplete_filter', type: 'select', desc: 'The method used for filtering MUC participants when using auto-complete', options: [
      {value: 'contains',  desc: 'Contains'}, {value: 'starts_with', desc: 'Starts With'}
    ]},
    { name: 'muc_mention_autocomplete_min_chars', 'default': '0', type: 'text', desc: 'The number of characters that need to be entered to trigger the auto-complete list' },


]);

converse_settings.options.addTab('Advanced', [

    { name: 'csi_waiting_time', 'default': '0', type: 'text', desc: 'The amount of idle seconds, after which a chat state indication of inactive will be sent out to the XMPP server' },
    { name: 'idle_presence_timeout', 'default': '60', type: 'text', desc: 'The amount of seconds after which the user is considered to be idle' },
    { name: 'ping_interval', 'default': '300', type: 'text', desc: 'The amount of seconds in between ping messages to keep connection alive' },
    { name: 'archived_messages_page_size', 'default': '50', type: 'text', desc: 'The maximum amount of archived messages to be returned per query.' },

    { type: 'h3', desc: ' ' },

    { name: 'push_app_servers', type: 'list', desc: 'Configure Push Notification servers',
        head: true, sortable: true, fields: [
            { name: 'jid', type: 'text', desc: 'JID'},
            { name: 'node', type: 'text', desc: 'Node'},
            { name: 'secret', type: 'text', desc: 'Secret'},
            { name: 'disable', type: 'checkbox', desc: 'Disabled'},
        ]
    },

    { name: 'loglevel', 'default': 'info', type: 'select', desc: 'Debug logging level', options: [
      'debug', 'info', 'warn', 'error', 'fatal'
    ]},
    { name: 'default_state', 'default': 'online', type: 'select', desc: 'The default chat status that you will have', options: [
      'online', 'chat', 'away', 'busy'
    ]},
    { name: 'persistent_store', type: 'select', desc: 'Determines which store is used for storing persistent data', options: [
      {value: 'localStorage',  desc: 'Local Storage'}, {value: 'IndexedDB', desc: 'Indexed Database'}
    ]},

]);