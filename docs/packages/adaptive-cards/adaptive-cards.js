(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
	let DesignDialog = null, designDialog = null, _converse, dayjs, html, _, __, Strophe, $iq, adaptiveCard, converseConn;	

    converse.plugins.add("adaptive-cards", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

            Strophe = converse.env.Strophe;
            $iq = converse.env.$iq;			
            html = converse.env.html;
            dayjs = converse.env.dayjs;

            _ = converse.env._;
            __ = _converse.__;
			

			adaptiveCard = new AdaptiveCards.AdaptiveCard();
			
			adaptiveCard.onExecuteAction = function(action) { 
				console.debug("adaptiveCard.onExecuteAction", action) 
				
				if (converseConn && action._propertyBag?.title) {
					let data = {};
					
					if (action._processedData && Object.getOwnPropertyNames(action._processedData).length > 0) {
						data = action._processedData;
					}
					
					sendCardResult(action._propertyBag?.title, JSON.stringify(data)).then(resp => resultsSaved(resp, action._propertyBag?.title)).catch(err => resultsError(err, action._propertyBag?.title));
				}
			}		

			class DesignDialog extends _converse.exports.BaseModal {

				initialize() {
					super.initialize();					
					this.listenTo(this.model, "change", () => this.requestUpdate());
					
					this.addEventListener('shown.bs.modal', () => {
					  
						this.querySelector("#adaptive-card-text").style.display = '';
						this.querySelector("#adaptive-card-preview").style.display = 'none';		
						
						this.querySelector('.btn-design-card').addEventListener('click', (ev) => { 
							this.designCard(ev);
						});	

						this.querySelector('.btn-paste-card').addEventListener('click', (ev) => { 
							this.pasteCard(ev);
						});	
						
						this.querySelector('.btn-post-card').addEventListener('click', (ev) => { 
							this.postCard(ev);
						});
						
						this.querySelector('.btn-preview-card').addEventListener('click', (ev) => { 
							this.previewCard(ev);
						});							

					});
				}

				getModalTitle () {
					return __('Adaptice Cards Designer');
				}

				renderModal() {
                  return html`<div class="modal-dialog modal-xl" role="document"> <div class="modal-content">
                         <div class="modal-header"></div>
                         <div class="modal-body">
							<textarea placeholder="Paste or type JSON" style="width:100%; height:600px;" id="adaptive-card-text"></textarea>
							<div id="adaptive-card-preview" style="width:100%; height:600px;"></div>
						 </div>
                         <div class="modal-footer">		
						 <button type="button" class="btn btn-success btn-design-card">Design</button>	
						 <button type="button" class="btn btn-success btn-paste-card">Paste</button>		
						 <button type="button" class="btn btn-success btn-post-card">Post</button>
						 <button type="button" class="btn btn-success btn-preview-card">Preview</button>							 
                         </div>
                         </div> </div>`;
				}
				
				designCard() {					
					openWebAppsWindow("https://adaptivecards.io/designer/");
				}
				
				pasteCard() {
					navigator.clipboard.readText().then((clipText) => {
                        this.querySelector("#adaptive-card-text").value = clipText;
						
					}, function(err) {
						console.error('adaptive card paste clipboard error', err);
					});
				}
				
				postCard() {
                    const model = this.model.get("view").model;
                    const clipText = JSON.stringify(JSON.parse(this.querySelector("#adaptive-card-text").value.trim()));						
					console.debug("postClipboard", clipText);
					
					if (clipText && converseConn) {					
						const type = (model.get('type') == 'chatroom') ? 'groupchat' : 'chat';
						const target = model.get('jid');
						_converse.api.send($msg({to: target, from: converseConn.jid, type}).c("json", {'xmlns': 'urn:xmpp:json:0'}).t(clipText));						
					}			
				}
				
				previewCard() {
					const textarea = this.querySelector("#adaptive-card-text");
					const button = this.querySelector(".btn-preview-card");
					const preview = this.querySelector("#adaptive-card-preview");
					
					if (preview.style.display == 'none') {
						const clipText = JSON.stringify(JSON.parse(this.querySelector("#adaptive-card-text").value.trim()));												
						const adaptiveCard = new AdaptiveCards.AdaptiveCard();
						adaptiveCard.parse(JSON.parse(clipText));
						const renderedCard = adaptiveCard.render();
						
						textarea.style.display = 'none';						
						preview.innerHTML = "";
						preview.appendChild(renderedCard);
						preview.style.display = '';
						button.innerHTML = 'Edit';
						
					} else {						
						preview.innerHTML = '';	
						preview.style.display = 'none';	
						textarea.style.display = '';
						button.innerHTML = 'Preview';						
					}
				}				
					
			}
			
			_converse.api.elements.define('converse-pade-design-dialog', DesignDialog);						
				
				
			if (getSetting("enableAdaptiveCardDesign", false)) 
			{
				_converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
				{
					let style = "width:18px; height:18px; fill:var(--chat-color);";
					if (toolbar_el.model.get("type") === "chatroom") {
						style = "width:18px; height:18px; fill:var(--muc-color);";
					}
					
					buttons.push(html`
						<button class="btn adaptive-cards-design" title="${__('Design an Adaptive Card')}" @click=${designCard}/>
							<converse-icon style="${style}" class="fa fa-id-card" size="1em"></converse-icon>
						</button>
					`);

					return buttons;
				});
			}
			
			_converse.api.listen.on('connected', async function() {	
				converseConn = await _converse.api.connection.get();
			});				
			
            _converse.api.listen.on('beforeMessageBodyTransformed', function(text)
            {			
				if (text.startsWith('ADAPTIVE-CARD:') && text.length > 14) {	
					const json = text.substring(14);
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

	function resultsSaved(resp, title) {
		console.debug("resultsSaved", title, resp);
		const message = 'Saved results OK for ' + title;
		getSelectedChatBox().model.createMessage({ message, body: message,  'type': 'info' });
	}

	function resultsError(err, title) {
		console.error("resultsError", title, err);
		const message = 'Saved results ERROR for ' + title;		
		getSelectedChatBox().model.createMessage({ body: message, message,  'type': 'info' });
	}
	
	async function parseStanza(stanza, attrs) {
		const json = stanza.querySelector('json');

		if (json) {
			const card = JSON.parse(json.innerHTML);
			console.debug("parseStanza", card);
			
			if (card.type == 'AdaptiveCard') {
				attrs.message = 'ADAPTIVE-CARD:' + json.innerHTML;	
				attrs.body = attrs.message;
			}				
		}
		return attrs;
	}
		
    function designCard(ev) {
        ev.stopPropagation();
        ev.preventDefault();
		
		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const chatview = _converse.chatboxviews.get(toolbar_el.model.get('jid'));		
		console.debug("designCard", chatview);

		const model = new converse.env.Model();
		model.set({ view: chatview});
		_converse.api.modal.show('converse-pade-design-dialog', { model });			
    }

	function sendCardResult(id, result) {
		const stanza = $iq({
		  'type': 'set',
		  'from': converseConn.jid
		}).c('pubsub', {
		  'xmlns': Strophe.NS.PUBSUB
		}).c('publish', {
		  'node': "https://adaptivecards.io"
		}).c('item', {
		  'id': id
		}).c('storage', {
		  'xmlns': "https://adaptivecards.io"
		});
		
		stanza.c('result').t(result).up();
		
		stanza.up().up().up();
		stanza.c('publish-options').c('x', {
		  'xmlns': Strophe.NS.XFORM,
		  'type': 'submit'
		}).c('field', {
		  'var': 'FORM_TYPE',
		  'type': 'hidden'
		}).c('value').t('http://jabber.org/protocol/pubsub#publish-options').up().up().c('field', {
		  'var': 'pubsub#persist_items'
		}).c('value').t('true').up().up().c('field', {
		  'var': 'pubsub#access_model'
		}).c('value').t('whitelist');
		return _converse.api.sendIQ(stanza);
	}
}));
