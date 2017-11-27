/**
 * Mam plugin for Candy
 *
 */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.Mam = (function(self, Candy, $) {

	var connection = null;
	var nickname = null;
	var queryid = null;
	var roomJid = null;

	self.init = function()
	{
		console.log("Mam.init");

		$(Candy).on('candy:core.chat.connection', function(obj, data)
		{
			switch(data.status)
			{
				case Strophe.Status.CONNECTED:
					connection = Candy.Core.getConnection();
					nickname = Strophe.escapeNode(Candy.Core.getUser().getNick());

					Candy.Core.addHandler(onMamMessage, "urn:xmpp:mam:0", 'message', null);
					break;
			}
		    	return true;
		});

		$(Candy).on('candy:view.private-room.before-open', function(obj, data)
		{
			//console.log("candy:view.private-room.before-open", data);

			queryid = Math.round(Math.random() * 10000);
			roomJid = data.roomJid;

			connection.send($iq({type: 'set'}).c('query', {xmlns: "urn:xmpp:mam:0", queryid: queryid}).c('x',{xmlns:'jabber:x:data', type:'submit'}).c('field',{var:'FORM_TYPE', type:'hidden'}).c('value').t('urn:xmpp:mam:0').up().up().c('field',{var:'with'}).c('value').t(data.roomJid).up().up());

		    	return true;
		});

	}

        if(CandyShop.Timeago === undefined) {
		Candy.View.Template.Chat.MamMessage = '<li><small>{{time}}</small><div class="infomessage"><span class="spacer"></span>&nbsp;<span><strong>{{name}}</strong>&nbsp;{{{message}}}</span></div></li>';
	}
	else {
		Candy.View.Template.Chat.MamMessage = '<li><small><abbr title="{{time}}">{{time}}</abbr></small><div class="infomessage"><span class="spacer"></span>&nbsp;<span><strong>{{name}}</strong>&nbsp;{{{message}}}</span></div></li>';
	}

	var onMamMessage = function(message)
	{
		var msg = $(message).find("forwarded message");
		var body = $(message).find("forwarded message body").text();
		var timestamp = $(message).find("forwarded delay").attr("stamp");
		var from = msg.attr("from");
		var to = msg.attr("to");
		var item = {from: from, to: to, type: msg.attr("type"), body: body, timestamp: timestamp};

		if (body && body.indexOf('"action":"o') == -1)
		{
			//console.log('onMamMessage', item);

			var html = Mustache.to_html(Candy.View.Template.Chat.MamMessage, {
				name: Strophe.getNodeFromJid(from),
				message: body,
				time: Candy.Util.localizedTime(new Date(timestamp).toGMTString())
			});

			Candy.View.Pane.Room.appendToMessagePane(roomJid, html);

			if(Candy.View.getCurrent().roomJid === roomJid)
			{
				Candy.View.Pane.Room.scrollToBottom(roomJid);
			}
		}

		return true;
	}


    return self;

}(CandyShop.Mam || {}, Candy, jQuery));
