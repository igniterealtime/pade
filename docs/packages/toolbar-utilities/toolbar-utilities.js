(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    let __, html, _converse;

    converse.plugins.add("toolbar-utilities", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            __ = _converse.__;
            html = converse.env.html;

            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
                console.debug("getToolbarButtons", toolbar_el.model.get("jid"));

                buttons.push(html`
                    <button class="toolbar-utilities-scroll" title="${__('Scroll to the bottom')}" @click=${scrollToBottom}/>
                        <converse-icon class="fa fa-angle-double-down" size="1em"></converse-icon>
                    </button>
                `);

                buttons.push(html`
                    <button class="toolbar-utilities-thrash" title="${__('Trash chat history')}" @click=${trashHistory}/>
                        <converse-icon class="far fa-trash-alt" size="1em"></converse-icon>
                    </button>
                `);

                buttons.push(html`
                    <button class="toolbar-utilities-refresh" title="${__('Refresh chat history')}" @click=${refreshHistory}/>
                        <converse-icon class="fa fa-sync" size="1em"></converse-icon>
                    </button>
                `);

                return buttons;
            });

        }
    });

		
	function openChatbox(view)
	{
		let jid = view.model.get("jid");
		let type = view.model.get("type");

		console.debug("openChatbox", jid, type);

		if (jid)
		{
			if (type == "chatbox") _converse.api.chats.open(jid, {'bring_to_foreground': true}, true);
			else
			if (type == "chatroom") _converse.api.rooms.open(jid, {'bring_to_foreground': true}, true);
		}
	}
		
    function refreshHistory(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();
		
		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));		
		console.debug("refreshHistory", chatview);

		chatview.close();
		setTimeout(function() { openChatbox(chatview) });
    }

    async function trashHistory(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();

		const result = confirm(__('Are you sure you want to clear the messages from this conversation?'));

		if (result === true) {		
			const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
			await toolbar_el.model.messages.clearStore(); 
			toolbar_el.model.messages.fetched.resolve();		
		}
    }

    function scrollToBottom(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();
		
		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));		
		console.debug("scrollToBottom", chatview);

        chatview.scrollDown();
    }

}));
