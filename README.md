<img src="https://igniterealtime.github.io/Pade/help/assets/images/pade_fosdem.png" />

Pade is the Yoruba word for "Meet". It is a unified communications client for Openfire Meetings and uses the following front end web applications.

- [Jitsi Meet](https://jitsi.org/jitsi-meet/) for SFU-based WebRTC audio/video conferencing, screen share and real-time application collaboration with Jitsi Video-bridge
- [ctxPhone](https://collecttix.github.io/ctxSip/) for SIP based telephony with FreeSWITCH
- [Converse.js](https://conversejs.org/) for XMPP chat/groupchat with Openfire

All web application run from within a browser extension in native application windows and combine together to provide:

- Modern HTML5 user interface;
- Single user authentication and sign-on; Windows SSO, Credential Management API and Smart ID support
- Modern chat user experience; chats, group chats and message broadcasts with private chat responses.
- Message Styling with markdown plain text
- Interactive content; mentions, hashtags, forms and H5P/xAPI support
- Audio Video conferencing (WebRTC);
- Webinars; Single talker and multiple listeners
- Telephone (SIP soft-phone) and MCU-based audio/video conferencing;
- Online Meeting/Conference planner with a calendar or CRON trigger;
- Screen sharing, Co-browsing and Application sharing/real-time collaboration
- Agent support for live conversations with web site visitors using chat, audio and video conferencing.
- Support hardware devices like MIDI touch-pads and HID USB touch devices like the Elgato stream deck

To install, visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/pade-openfire-meetings/fohfnhgabmicpkjcpjpjongpijcffaba?hl=en)

On your [Openfire] server, you will need at least the two [Openfire Meetings](https://github.com/igniterealtime/community-plugins/tree/master/ofmeet) [(download from here)](https://github.com/igniterealtime/community-plugins/raw/master/openfire_4_1_5/target/openfire/plugins/ofmeet.jar) plugins and the [bookmarks](https://www.igniterealtime.org/projects/openfire/plugins/bookmarks/readme.html) [(download from here)](https://www.igniterealtime.org/projects/openfire/plugins/bookmarks.jar) plugin. If you are running an [Openfire] server lower than 4.2, you will also need the websocket plugin.

For the advanced telephony features with SIP and a REST API, you will need the [Openfire chat plugin](https://github.com/igniterealtime/openfire-chat/releases) and the [Openfire Switch plugin](https://github.com/igniterealtime/openfire-switch/releases)

-------
[Openfire Meetings]:https://discourse.igniterealtime.org/c/openfire-plugins/openfire-meetings
[P&agrave;d&eacute;]: https://chrome.google.com/webstore/detail/pade-openfire-meetings/fohfnhgabmicpkjcpjpjongpijcffaba?hl=en-GB
[Openfire]:http://www.igniterealtime.org/projects/openfire/index.jsp
[Ignite Realtime]:http://www.igniterealtime.org
