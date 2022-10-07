# Galene SFU plugin for converse.js

<img src="https://github.com/conversejs/community-plugins/blob/master/packages/galene/galene.png?raw=true" />

## Overview
This plugin implements [XEP-XXXX: In-band SFU Sessions](https://igniterealtime.github.io/openfire-galene-plugin/xep/index.html) and [XEP-0327: Rayo](https://xmpp.org/extensions/xep-0327.html) to provide audio and video conferencing features for Converse.
Galene like Jitsi Meet uses an SFU to provide an audio/video conference bridge. Galene however uses seperate uni-directional streams instead of bi-directional steams. This makes it more flexible to provide seminar and webinar type conferences with single or few speakers and a large number of listeners.

## Install
see https://m.conversejs.org/docs/html/plugin_development.html on how to install this plugin

## Configure
To configure, edit the converse settings and modify all the galene_  values. See index.html for an example

```
converse.initialize({
    ....
	galene_url: "https://conversejs.github.io/community-plugins/packages/galene",
	galene_host: 'pade.chat',
    ....
});
```

Set _galene_host_ to the XMPP server or a federated server that supports the above XEPs otherwise, it won't work.
Set _galene_url_ to the url of the web app for users who access the conference/webinar by clicking on the generated link

## How to use
Click on the video icon on the conversation toolbar to create a seminar/webinar for participants of a chat or groupchat.
Click on the telephone icon on the conversation toolbar to initiate an audio call from a chat conversation.
