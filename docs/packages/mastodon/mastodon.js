(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var mastodonInterval;
    var Strophe, dayjs

    converse.plugins.add("mastodon", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            Strophe = converse.env.Strophe;
            dayjs = converse.env.dayjs;
			
            _converse.api.settings.update({
				mastodon: {
					url: "https://toot.igniterealtime.org", 
					token: "",
					toolbar: true,
					limit: 25,	
					check: 15,	
					title: "Mastodon Feed"
				}		
            });			
			
            _converse.api.listen.on('beforeMessageBodyTransformed', function(text)
            {					
				if (text.trim().startsWith("MASTODON:")) {	
					const strings = [text.substr(9)];
					strings.raw = strings;								
					text.addTemplateResult(0, text.length, html(strings));
				}				
            });
			
            _converse.api.listen.on('chatBoxViewInitialized', function (view)
            {
				var jid = view.model.get("jid");
				var type = view.model.get("type");
				console.debug("chatBoxViewInitialized", jid, type);

				if (jid === "converse-mastodon@" + _converse.connection.domain)
				{
					if (_converse.api.settings.get("mastodon").toolbar) {
						const textarea = view.querySelector('.chat-textarea')
						if (textarea) textarea.setAttribute("disabled", "true");
					} else {
						view.querySelector('.bottom-panel').style.display = "none";
					}
					mastodonRefresh();
				}					
            });

            _converse.api.listen.on('connected', function()
            {
                _converse.api.waitUntil('rosterContactsFetched').then(() => {

					window.addEventListener("unload", function ()
					{
						console.debug("mastodon unloading all feed refreshing");

						if (mastodonInterval) clearInterval(mastodonInterval);
					});

					var mastodonCheck = _converse.api.settings.get("mastodon").check * 60000;
					mastodonInterval = setInterval(mastodonRefresh, mastodonCheck);	
					
					const jid = "converse-mastodon@" + _converse.connection.domain;
					openChat(jid, _converse.api.settings.get("mastodon").title, ["Bots"]);	

					setupTimer();
                });
            });

            console.log("mastodon plugin is ready");
        }
    });	

	function setupTimer() {	
		setupTimeAgo();		
		setTimeout(setupTimer, 10000);	
	}

	function setupTimeAgo() {
		timeago.cancel();
		const locale = navigator.language.replace('-', '_');
		
		const elements = document.querySelectorAll('.chat-msg__time');
		
		for (let i=0; i < elements.length; i++)
		{
			if (!elements[i].querySelector('.chat-msg__time_span')) {
				const timestamp = elements[i].getAttribute('timestamp');	
				const pretty_time = elements[i].innerHTML;				
				const timeAgo = timeago.format(new Date(pretty_time));
				elements[i].innerHTML = '<span class="chat-msg__time_span" title="' + pretty_time + '" datetime="' + timestamp + '">' + timeAgo + '</span>';
			}
		}
		
		timeago.render(document.querySelectorAll('.chat-msg__time_span'), locale);
	}	

	function mastodonRefresh()
	{
		mastodonFetch("/api/v1/timelines/public");
		mastodonFetch("/api/v1/timelines/home");		
	}
	
	async function mastodonFetch(path)
	{
		console.debug("mastodon mastodonRefresh", path);	

		const token = _converse.api.settings.get("mastodon").token;				
		const endpoint = _converse.api.settings.get("mastodon").url + path + "?limit=" + _converse.api.settings.get("mastodon").limit;
		
		const options = {method: "GET", headers: {"Authorization": (token ? "Bearer " + token : token), "Accept":"application/json", "Content-Type":"application/json"}};
		const response = await fetch(endpoint, options);
		const posts = await response.json();				
						
		posts.forEach(async function(json)
		{	
			console.debug("mastodon mastodonRefresh", path, json);			
			
			if ((!json.content || json.content == "") && json.reblog?.account) {
				json = json.reblog;		
			}
			
			const user = json.account.username + "@" + _converse.connection.domain;				
			const time = dayjs(json.created_at).format('YYYY-MM-DDTHH:mm:ssZ');
			const msgId = json.id;
			const title = json.account.display_name.trim() == "" ? json.account.username : json.account.display_name;
			const avatar = json.account.avatar_static;	
			const timeAgo = timeago.format(new Date(json.created_at));
			const timeAgoSpan = "<span class=chat-msg__time_span title='" + time + "' datetime='" + json.created_at + "'>" + timeAgo + '</span>';
			const header = "<img width=48 style='border-radius: var(--avatar-border-radius)' src='" + avatar + "'/><br/><b>" + title + '</b> - ' + timeAgoSpan + " - <a href='" + json.url + "'>Reply<br/>"			
			
			let footer = "";
			let cardImage = "";

			if (json.card) {
				if (json.card.image) cardImage = '<img src="' + json.card.image + '"/>';				
				footer = `<p>${cardImage}</p><p>${json.card.description}</p><p><a target=_blank href='${json.card.url}'>${json.card.title}</a></p>`
			}
			const from = "converse-mastodon@" + _converse.connection.domain;			
			const body = 'MASTODON:' + header + json.content + footer;			
			const attrs = {json, body, message: body, id: msgId, msgId, type: 'chat', from, time, is_unstyled: true};  
			chatbox = await _converse.api.chats.get(from, {}, true);
			await (chatbox === null || chatbox === void 0 ? void 0 : chatbox.queueMessage(attrs));						
		})				
	}
	
	function openChat(from, name, groups, closed) {
		console.debug("openChat", from, name, groups, closed);
		
		if (_converse && _converse.roster)
		{
			if (!groups) groups = [];

			if (!name)
			{
				name = from.split("@")[0];
				if (name && name.indexOf("sms-") == 0) name = name.substring(4);
			}

			var contact = _converse.roster.findWhere({'jid': from});

			if (!contact)
			{
			  _converse.roster.create({
				'nickname': name,
				'groups': groups,
				'jid': from,
				'subscription': 'both'
			  }, {
				sort: false
			  });
			}

			if (!closed) _converse.api.chats.open(from, {'bring_to_foreground': true}, true);
		}
	}	
}));
