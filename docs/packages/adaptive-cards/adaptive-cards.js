(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
	let DesignDialog = null, designDialog = null, _converse, dayjs, html, _, __, Model, BootstrapModal;	

    converse.plugins.add("adaptive-cards", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;
            html = converse.env.html;
            dayjs = converse.env.dayjs;
            Model = converse.env.Model;
            BootstrapModal = converse.env.BootstrapModal;
            _ = converse.env._;
            __ = _converse.__;

            DesignDialog = BootstrapModal.extend({
                id: "plugin-design-modal",
                initialize() {
                    BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.listenTo(this.model, 'change', this.render);
                },
                toHTML() {
                  return html`<div class="modal-dialog modal-xl" role="document"> <div class="modal-content">
                         <div class="modal-header"><h1 class="modal-title" id="converse-plugin-design-label">Adaptice Cards Designer</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>
                         <div id="designerRootHost" class="modal-body">
							<iframe src="https://adaptivecards.io/designer/" style="width: 100%; height: 600px; border:none; margin:0; padding:0; overflow:hidden;"></iframe>
						 </div>
                         <div class="modal-footer">		
						 <button type="button" class="btn btn-success btn-post-clipboard">Post from Clipboard</button>							 
                         <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>
                         </div>
                         </div> </div>`;
                },
                afterRender() {
                  this.el.addEventListener('shown.bs.modal', () => {

                  }, false);
                },
                events: {
                    'click .btn-post-clipboard': 'postClipboard',		
                },

                keyUp(ev) {
                    if (ev.key === "Enter")
                    {

                    }
                },
				postClipboard() {
                    const model = this.model.get("view").model;
					
					navigator.clipboard.readText().then((clipText) => {	
						console.debug("postClipboard", clipText);
						
						const type = (model.get('type') == 'chatroom') ? 'groupchat' : 'chat';
						const target = model.get('jid');
						_converse.api.send($msg({to: target, from: _converse.connection.jid, type}).c("json", {'xmlns': 'urn:xmpp:json:0'}).t(clipText));						
						
					});					
				}
            });				
				
				
			if (getSetting("enableAdaptiveCardDesign", false)) 
			{
				_converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
				{
					let color = "fill:var(--chat-toolbar-btn-color);";
					if (toolbar_el.model.get("type") === "chatroom") color = "fill:var(--muc-toolbar-btn-color);";
					
					buttons.push(html`
						<button class="adaptive-cards-design" title="${__('Design an Adaptive Card')}" @click=${designCard}/>
							<converse-icon style="width:18px; height:18px; ${color}" class="fa fa-id-card" size="1em"></converse-icon>
						</button>
					`);

					return buttons;
				});
			}
			
            _converse.api.listen.on('beforeMessageBodyTransformed', function(text)
            {	
				console.log("afterMessageBodyTransformed", text.parentNode);
		
				if (text.startsWith('ADAPTIVE-CARD') && text.length > 13) {	
					const json = text.substring(13);
					const adaptiveCard = new AdaptiveCards.AdaptiveCard();
					//adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
					//	fontFamily: "Segoe UI, Helvetica Neue, sans-serif"
					//});
					
					adaptiveCard.onExecuteAction = function(action) { alert("Ow!"); }
					adaptiveCard.parse(JSON.parse(json));
					const renderedCard = adaptiveCard.render();
					console.debug("Adapative card", text);
					text.render_styling = false;
					text.references = [{begin: 0,  end: text.length,  template: renderedCard }];
				}
				
            });	

			_converse.api.listen.on('parseMessage', async (stanza, attrs) => {
				return parseStanza(stanza, attrs);
			});	

			_converse.api.listen.on('parseMUCMessage', async (stanza, attrs) => {
				return parseStanza(stanza, attrs);
			});			

            console.debug("adaptive-cards plugin is ready");
        }
    });

	async function parseStanza(stanza, attrs) {
		const json = stanza.querySelector('json');

		if (json) {
			attrs.message = 'ADAPTIVE-CARD' + json.innerHTML;			
		}
		return attrs;
	}
		
    function designCard(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();
		
		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));		
		console.debug("designCard", chatview);
		
        designDialog = new DesignDialog({ 'model': new Model({view: chatview}) });
        designDialog.show(ev);		
    }

}));
