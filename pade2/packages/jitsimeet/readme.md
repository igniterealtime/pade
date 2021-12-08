# Jitsi Meet plugin for converse.js

<img src="https://github.com/conversejs/community-plugins/blob/master/packages/jitsimeet/jitsimeet.png?raw=true" />
<img src="https://github.com/conversejs/community-plugins/blob/master/packages/jitsimeet/jitsimeet2.png?raw=true" />

## Overview
This plugin uses a hosted Jitsi-Meet service to deliver an audio/video conferencing user experience.

## Install
see https://m.conversejs.org/docs/html/plugin_development.html on how to install this plugin

## Configure
To configure, edit the converse settings and modify all the jitsimeet_  values. See index.html for an example

```
converse.initialize({
    ....
    jitsimeet_modal: false,
    jitsimeet_url: 'https://meet.jit.si',
    ....
});
```

Default setting will use the public meet.ji.si service.

## How to use
Click on the video icon on the conversation toolbar to turn a chat or groupchat into an audio/video conference
