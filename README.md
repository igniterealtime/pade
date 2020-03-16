<img src="https://discourse.igniterealtime.org/uploads/default/original/2X/8/8a20644093cdefad9f3d16e92a7a3d83c9a1fffe.png" />

Pade is the Yoruba word for "Meet". It is a web based unified communications client for Openfire Meetings and uses the following front end web applications.

- [Converse.js](https://conversejs.org/) for XMPP chat/groupchat with Openfire
- [Jitsi Meet](https://jitsi.org/jitsi-meet/) for SFU-based WebRTC audio/video conferencing, screen share and real-time application collaboration with Jitsi Video-bridge

All the web applications run from within a browser extension in native application windows and combine together to provide:

- Modern HTML5 user interface
- Single user authentication and sign-on; Windows SSO, Credential Management API and Smart ID support
- Modern chat user experience; chats, group chats and message broadcasts with private chat responses
- Message Styling with Markdown plain text
- Interactive content; mentions, hashtags, forms and H5P/xAPI support
- Audio Video conferencing (WebRTC)
- Webinars; Single talker and multiple listeners
- Telephone (SIP soft-phone) and MCU-based audio/video conferencing
- Online Meeting/Conference planner with a calendar or CRON trigger
- Screen sharing, Co-browsing and Application sharing/real-time collaboration
- Agent support for live conversations with web site visitors using chat, audio and video conferencing
- Support hardware devices like MIDI touch-pads and HID USB touch devices like the Elgato stream deck

To install, visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/pade-openfire-meetings/fohfnhgabmicpkjcpjpjongpijcffaba?hl=en) or [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/ckfiipkgbinakolndmobaflkeljfhecl).

On your [Openfire] server, you may need the following plugins:
1. [openfire-meetings](https://github.com/igniterealtime/pade/releases) plugins modified for Pade
2. [bookmarks](https://www.igniterealtime.org/projects/openfire/plugins/bookmarks.jar) for shared group-chat rooms and shared document urls. 
3. [fastpath](https://igniterealtime.org/projects/openfire/plugins/4.4.5/fastpath.jar) if you want to be an agent
4. [httpfileupload](https://igniterealtime.org/projects/openfire/plugins/1.1.3/httpfileupload.jar) to transfer/share files
5. [monitoring](https://igniterealtime.org/projects/openfire/plugins/2.0.0/monitoring.jar) to save and fetch chat history from openfire
6. [registration](https://igniterealtime.org/projects/openfire/plugins/1.7.2/registration.jar) to performs various actions whenever a new user account is created.
7. [broadcast](https://igniterealtime.org/projects/openfire/plugins/1.9.2/broadcast.jar) to broadcasts messages to all users in the system or to specific groups
8. [chat plugin](https://github.com/igniterealtime/openfire-chat/releases) for the advanced features which includes (SSO, REST API and others)
9. [openfire switch plugin](https://github.com/igniterealtime/openfire-switch/releases) for SIP telephony using FreeSWITCH.

-------
[Openfire Meetings]:https://discourse.igniterealtime.org/c/openfire-plugins/openfire-meetings
[P&agrave;d&eacute;]: https://chrome.google.com/webstore/detail/pade-openfire-meetings/fohfnhgabmicpkjcpjpjongpijcffaba?hl=en-GB
[Openfire]:http://www.igniterealtime.org/projects/openfire/index.jsp
[Ignite Realtime]:http://www.igniterealtime.org
