var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.OfMeet = (function(self, Candy, $) {

	self.init = function(win) {
		var html = '<li id="ofmeet-control-icon" data-tooltip="Openfire Meetings"><img id="ofmeet-control" src="candyshop/ofmeet/webcam.png"></span></li>';
		$('#emoticons-icon').after(html);

		var makeRoomName = function makeRoomName(me, contact)
		{
			if (me <= contact)
			{
				return me + "-" + contact;
			}
			else return contact + "-" + me;
		}

		$('#ofmeet-control-icon').click(function(event)
		{
			if (win)
			{
				win.closeVideoWindow();

				var roomJid = Candy.View.getCurrent().roomJid;
				var privateChat = Strophe.escapeNode(Strophe.getResourceFromJid(roomJid));
				var imChat = Strophe.escapeNode(Strophe.getNodeFromJid(roomJid));
				var meUser = Strophe.escapeNode(Candy.Core.getUser().getNick());
				var domain = Strophe.getDomainFromJid(roomJid);
				var room = Strophe.getNodeFromJid(roomJid);

				if (privateChat)
				{
					// Private Chat
					room = makeRoomName(meUser, privateChat);
				}
				else

				if (domain == win.pade.domain)
				{
					// IM Chat
					room = makeRoomName(meUser, room);
				}
				else {
					Candy.Core.Action.Jabber.Room.Leave(roomJid);
				}
				self.showOfMeet(room);
			}
		});

		var html2 = '<div id="video-modal"><a id="video-modal-cancel" class="close" href="#">×</a><span id="video-modal-body"></span></div><div id="video-modal-overlay"></div>';
		$(html2).appendTo("body");

		$("#video-modal").css("height", window.innerHeight - 40);
		$("#video-modal").css("width", window.innerWidth - 20);
		$("#video-modal-overlay").hide();

		$(window).resize(function ()
		{
			$("#video-modal").css("height", window.innerHeight - 40);
			$("#video-modal").css("width", window.innerWidth - 20);
		});

	};

	self.showOfMeet = function(room)
	{
		$("#video-modal-cancel").show().click(function(e)
		{
			$("#video-modal").fadeOut("fast", function() {
				$("#video-modal-body").text("");
				$("#video-modal-overlay").hide();
			});
			e.preventDefault();
			window.location.reload();
		});

		$("#video-modal").stop(false, true);
		$("#video-modal").fadeIn("fast");
		$("#video-modal-body").html('<iframe id="ofmeet" src="../jitsi-meet/chrome.index.html?room=' + room + '"></iframe>');
		$("#video-modal-overlay").show();

		return true;
	};

	return self;
}(CandyShop.OfMeet || {}, Candy, jQuery));
