# Jitsi Meet plugin for converse.js

<img src="https://github.com/conversejs/community-plugins/blob/master/packages/voicechat/voicechat.png?raw=true" />

## Overview
This plugin uses a Jitsi-Meet service to deliver a voice chat user experience.

## Install
see https://m.conversejs.org/docs/html/plugin_development.html on how to install this plugin

## Configure
To configure, edit the converse settings and modify all the voicechat properties. See index.html for an example

```
converse.initialize({
    ....
	voicechat: {
		hosts: {
			domain: 'meet.jit.si',
			muc: 'conference.meet.jit.si'
		},					
		serviceUrl: 'wss://meet.jit.si/xmpp-websocket',
		prefix: 'voicechat-',					
		transcribe: true,
		transcribeLanguage: 'en-GB'
	}
    ....
});
```

Default setting will use the public meet.ji.si service.

## How to use
Click on the headset icon on the conversation toolbar to start/stop a voice chat
