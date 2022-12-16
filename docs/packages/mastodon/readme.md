# Mastodon plugin for converse.js

<img src="https://github.com/conversejs/community-plugins/blob/master/packages/mastodon/mastodon.png?raw=true" />

## Overview
This plugin directly accesses the Mastodon REST API to provide a public and local server timeline feed. A token is required for the local server timeline.

## Install
see https://m.conversejs.org/docs/html/plugin_development.html on how to install this plugin

## Configure
To configure, edit the converse settings and modify the mastodon object attributes. See index.html for an example

```
converse.initialize({
    ....
	mastodon: {
		url: "https://toot.igniterealtime.org", 
		token: "",
		toolbar: true,
		limit: 25,	
		check: 15,	
		title: "Mastodon Feed"
	},
    ....
});
```

Default setting will use the public toot.igniterealtime.org service.

## How to use
Click on the arrow icon to publish your geo mastodon
