# Galene SFU plugin for converse.js

<img src="https://github.com/conversejs/community-plugins/blob/master/packages/galene/galene.png?raw=true" />

## Overview
This plugin implements [XEP-XXXX: In-band SFU Sessions](https://igniterealtime.github.io/openfire-galene-plugin/xep/index.html) and [XEP-0327: Rayo](https://xmpp.org/extensions/xep-0327.html) to provide audio and video conferencing features for Converse.

## Install
see https://m.conversejs.org/docs/html/plugin_development.html on how to install this plugin

## Configure
To configure, edit the converse settings and modify all the galene_  values. See index.html for an example

```
converse.initialize({
    ....
	galene_head_display_toggle: false,
	galene_host: 'localhost'
    ....
});
```

Set the galene_host to your XMPP server or a federated server that supports the above XEPs otherwise, it won't work.

## How to use
Click on the video icon on the conversation toolbar to turn a chat or groupchat into an audio/video conference
Click on the telephone icon on the conversation toolbar to initiate an audio call from a chat conversation.
