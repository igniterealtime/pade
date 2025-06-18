(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    let _converse, html, __, converseConn, voicechatServer;

	converse.plugins.add("voicechat", {
		dependencies: [],

		initialize: function () {
             _converse = this._converse;
            html = converse.env.html;
            __ = _converse.__;
			
			_converse.api.settings.extend({
				voicechat_server: 'https://talk.4ng.net'
			});			
			
            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons) {
				voicechatServer = _converse.api.settings.get('voicechat_server');				
                console.debug("getToolbarButtons", voicechatServer, toolbar_el.model);					
				
				if (toolbar_el.model.get("type") === "chatroom") {
					const voiceChatStart = __('Voice Chat');														
					const color = "fill:var(--muc-color);";

					buttons.push(html`
						<button class="btn plugin-voicechat" title="${voiceChatStart}" @click=${performAudio}/>
							<svg style="width:18px; height:18px; ${color}" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="volume-up" class="svg-inline--fa fa-volume-up fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M215.03 71.05L126.06 160H24c-13.26 0-24 10.74-24 24v144c0 13.25 10.74 24 24 24h102.06l88.97 88.95c15.03 15.03 40.97 4.47 40.97-16.97V88.02c0-21.46-25.96-31.98-40.97-16.97zm233.32-51.08c-11.17-7.33-26.18-4.24-33.51 6.95-7.34 11.17-4.22 26.18 6.95 33.51 66.27 43.49 105.82 116.6 105.82 195.58 0 78.98-39.55 152.09-105.82 195.58-11.17 7.32-14.29 22.34-6.95 33.5 7.04 10.71 21.93 14.56 33.51 6.95C528.27 439.58 576 351.33 576 256S528.27 72.43 448.35 19.97zM480 256c0-63.53-32.06-121.94-85.77-156.24-11.19-7.14-26.03-3.82-33.12 7.46s-3.78 26.21 7.41 33.36C408.27 165.97 432 209.11 432 256s-23.73 90.03-63.48 115.42c-11.19 7.14-14.5 22.07-7.41 33.36 6.51 10.36 21.12 15.14 33.12 7.46C447.94 377.94 480 319.54 480 256zm-141.77-76.87c-11.58-6.33-26.19-2.16-32.61 9.45-6.39 11.61-2.16 26.2 9.45 32.61C327.98 228.28 336 241.63 336 256c0 14.38-8.02 27.72-20.92 34.81-11.61 6.41-15.84 21-9.45 32.61 6.43 11.66 21.05 15.8 32.61 9.45 28.23-15.55 45.77-45 45.77-76.88s-17.54-61.32-45.78-76.86z"></path></svg>					
						</button>
					`);
				}
				
                return buttons;
            });	

			_converse.api.listen.on('connected', async function() {
				converseConn = await _converse.api.connection.get();					
			});				
			
			console.log("voicechat plugin is ready");
		}
	});	
	
    function performAudio(ev) {
        ev.stopPropagation();
        ev.preventDefault();
	
		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));		
		console.debug("performAudio", chatview, toolbar_el.model);
		
		const jid = toolbar_el.model.get("jid");
		const id = toolbar_el.model.get("box_id");
		const occupants = chatview.querySelector('.occupants');	

		console.debug("performAudio", jid, id, occupants, chatview);	

		const button = toolbar_el.querySelector('.plugin-voicechat');
        const chatroom_body = chatview.querySelector('.chatroom-body');
        let iframe = chatview.querySelector('.occupants-voice-chat');
		
        if (!iframe)
        {
            iframe = document.createElement("div");
            iframe.classList.add('occupants-voice-chat'); // col-xs-12 col-md-4 col-xl-2
			iframe.style.display = "none";				
			iframe.style.width = "500px";			
            iframe.classList.add('col-xs-12');
            iframe.classList.add('col-md-4');
            iframe.classList.add('col-xl-2');			
            chatroom_body.appendChild(iframe);
        }

		if (iframe.style.display == "none") {
			chatview.model.save({'hidden_occupants': true});			
			const style = "width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden;";
			console.debug("performAudio iframe", voicechatServer, jid);
			iframe.innerHTML = '<iframe allow="microphone;" style="' + style + '" src="' + voicechatServer + '/converse_' + jid.split("@")[0] + '"></iframe>';
			iframe.style.display = "";	
			button.classList.add('blink_me');		

		} else {
			chatview.model.save({'hidden_occupants': false});
			iframe.innerHTML = "";			
			iframe.style.display = "none";
			button.classList.remove('blink_me');
		}
		
        chatview.scrollDown();
    }	
	
}));
