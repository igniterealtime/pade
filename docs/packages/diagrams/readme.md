# Diagrams plugin for converse.js

<img src="https://github.com/conversejs/community-plugins/blob/master/packages/diagrams/diagrams.png" />

## Overview
This plugin uses [mermaid.js](https://js.github.io/mermaid/#/) and [abcjs](https://github.com/paulrosen/abcjs) to generate diagrams, flowcharts and music notation from text in a similar manner as markdown
The purpose of this plugin with converse is to create a tool that makes it easier to create diagrams, flowcharts, music and other visuals in chat communication.

## Install
See https://m.conversejs.org/docs/html/plugin_development.html on how to install this plugin

See index.html for example usage

## How to use

Diagrams can be created in a chat through text like this in a conversation:

```
graph TD
A[Client] --> B[Load Balancer]
B --> C[Server01]
B --> D[Server02]
```

The text is then rendered into a SVG vector diagram and made part of the chat:

<img src="https://github.com/conversejs/community-plugins/blob/master/packages/diagrams/flowchat.png"/>

Music is produced with the ABC notation system like this
```
X:1
K:D
"Am" DDAA|BBA2|
```

The text is then rendered into music notation and made part of the chat:

<img src="https://github.com/conversejs/community-plugins/blob/master/packages/diagrams/music.png"/>