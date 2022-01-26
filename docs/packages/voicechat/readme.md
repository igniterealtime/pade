# Voice Chat plugin for converse.js

<img src="https://github.com/conversejs/community-plugins/blob/master/packages/voicechat/voicechat.png?raw=true" />

## Overview
This plugin uses a Jitsi-Meet service (beta.meet.jit.si) to deliver a voice chat user experience. 
It is for remote teams who will use it everyday to just talk to each other all day long without the need to show their faces or any other video. With the absence of video, it ensures high quality audio for the conversation at most times, even with a large number of participants.
It also has an optional voice to text transcription feature (using web speech) that auto-types into your Converse chat or groupchat, what was spoken.

## Install
see https://m.conversejs.org/docs/html/plugin_development.html on how to install this plugin

## Configure
To configure, edit the converse settings and modify all the voicechat properties. See index.html for an example

```
converse.initialize({
    ....
	voicechat: {
		hosts: {
			domain: 'beta.meet.jit.si',
			muc: 'conference.beta.meet.jit.si'
		},					
		serviceUrl: 'wss://beta.meet.jit.si/xmpp-websocket',
		prefix: 'voicechat-',					
		transcribe: false,
		transcribeLanguage: 'en-GB'.
		start:  __('Start Voice Chat'),
		stop: __('Stop Voice Chat'),
		started: __('has started speaking'),
		stopped: __('has stopped speaking')	
	}
    ....
});
```

Default setting will use the public beta.meet.ji.si service and disable voice to text transcription.

## How to use
Click on the speaker icon on the conversation toolbar to start/stop a voice chat
