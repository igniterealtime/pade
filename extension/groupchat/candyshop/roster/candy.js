/**
 * Roster plugin for Candy
 *
 */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.Roster = (function(self, Candy, $) {

	var connection = null;
	var nickname = null;
	var roster = {};
	var presence = {};

	self.init = function()
	{
		//console.log("Roster.init");

		$(Candy).on('candy:core.chat.connection', function(obj, data)
		{
			switch(data.status)
			{
				case Strophe.Status.CONNECTED:
					connection = Candy.Core.getConnection();
					Candy.Core.addHandler(presCallback, null, 'presence');
					nickname = Strophe.escapeNode(Candy.Core.getUser().getNick());
					getRoster();
					break;
			}
		    	return true;
		});
	}

	var getRoster = function()
	{
		connection.sendIQ($iq({type: "get"}).c("query", {xmlns: "jabber:iq:roster"}).tree(), function(resp)
		{
			//console.log("get roster", resp)

			$(resp).find('item').each(function()
			{
				var jid = $(this).attr("jid");
				var name = $(this).attr("name");

				//console.log('roster.item',jid, name);
				roster[jid] = {jid: jid, name: name}
			})

		}, function (error) {
			console.error(error);
		});
	};


	var presCallback = function(presence)
	{
		//console.log('presCallback', presence);

		var to = $(presence).attr('to');
		var type = $(presence).attr('type');
		var from = Strophe.getBareJidFromJid($(presence).attr('from'));

        var pres = "online";
        if (type == "unavailable") pres = "unavailable";

		if (roster[from] && !presence[from])
		{
			console.log("presence handler", from, to, pres, roster[from].name);

			if (type == "unavailable")
			{
				// TODO remove later on
				//Candy.View.Pane.Room.close(from);
			} else {
				Candy.View.Pane.PrivateRoom.open(from, roster[from].name, true, true);
				presence[from] = from;
			}
		}

		return true;
	}

    return self;

}(CandyShop.Roster || {}, Candy, jQuery));
