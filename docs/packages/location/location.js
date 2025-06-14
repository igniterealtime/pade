(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
     var _converse = null, Strophe, $iq, $msg, $pres, $build, b64_sha1, dayjs, html, _, __, location_label, converseConn;
 
	converse.plugins.add("location", {
        dependencies: [],

        initialize: function () {
            _converse = this._converse;

            Strophe = converse.env.Strophe;
            $iq = converse.env.$iq;
            $msg = converse.env.$msg;
            $pres = converse.env.$pres;
            $build = converse.env.$build;
            b64_sha1 = converse.env.b64_sha1;

            _ = converse.env._;
            __ = _converse.__;
            dayjs = converse.env.dayjs;
            html = converse.env.html;

            location_label = __('Publish My Geo Location');
			
			class GeoLocationDialog extends _converse.exports.BaseModal {

				initialize() {
					super.initialize();					
					this.listenTo(this.model, "change", () => this.requestUpdate());
					
					this.addEventListener('shown.bs.modal', () => {
						const url = this.model.get("url");
						const view = this.model.get("view");
						
						if (url) {
							this.querySelector('.modal-body').innerHTML = '<iframe frameborder="0" style="border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:580px;" src="' + url + '"></iframe><button title="Publish" type="button" class="btn btn-success btn-publish" data-dismiss="modal">Publish</button>';
							
							this.querySelector('.btn-publish').addEventListener('click', (ev) => { 
								this.publishGeoLoc(ev);
							});							
						}						

					});
				}

				getModalTitle () {
					return location_label;
				}

				renderModal() {
                  return html`<div class="modal-dialog"> <div class="modal-content">
                         <div class="modal-body"></div>
                         <div class="modal-footer"></div>
						 </div> </div>`;
				}

                publishGeoLoc() {
                    const view = this.model.get("view");
                    const url = this.model.get("url");
                    const position = this.model.get("position");

                    if (view) publishUserLocation(view, url, position);
                }
			}
			
			_converse.api.elements.define('converse-pade-location-dialog', GeoLocationDialog);			

            _converse.api.listen.on('connected', async function()  {
				converseConn = await _converse.api.connection.get();				
                listenForGeoLoc();
            });

            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
				let style = "width:18px; height:18px; fill:var(--chat-color);";
				if (toolbar_el.model.get("type") === "chatroom") {
					style = "width:18px; height:18px; fill:var(--muc-color);";
				}
				
                buttons.push(html`
                    <button class="btn plugin-location" title="${location_label}" @click=${performLocation}/>
                        <svg style="${style}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g><path d="M 15.272,31.458c 0.168,0.186, 0.33,0.306, 0.486,0.39c 0.002,0.002, 0.006,0.002, 0.008,0.004 c 0.108,0.056, 0.214,0.098, 0.314,0.098c 0.1,0, 0.206-0.042, 0.314-0.098c 0.002-0.002, 0.006-0.002, 0.008-0.004 c 0.156-0.084, 0.318-0.204, 0.486-0.39c0,0, 9.296-10.11, 10.23-18.87c 0.056-0.452, 0.094-0.91, 0.094-1.376C 27.212,5.020, 22.192,0, 16,0 S 4.788,5.020, 4.788,11.212c0,0.474, 0.038,0.936, 0.096,1.394C 5.842,21.362, 15.272,31.458, 15.272,31.458z M 16,4 c 3.976,0, 7.212,3.236, 7.212,7.212c0,3.976-3.236,7.212-7.212,7.212S 8.788,15.188, 8.788,11.212C 8.788,7.236, 12.024,4, 16,4z"></path></g></svg>
                    </button>
                `);

                return buttons;
            });

            _converse.api.listen.on('afterMessageBodyTransformed', function(text)
            {
				let url = text;

                if (url && url.indexOf("location/leaflet/index.html?accuracy=") > -1)
                {
                    text.references = [];
                    text.addTemplateResult(0, url.length, html`<iframe frameborder='0' style='border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:600px;' src="${url}"></iframe>`);
                }
            });

            console.debug("location plugin is ready");
        }
    });

    function performLocation(ev)  {
        ev.stopPropagation();
        ev.preventDefault();
		
		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const view = _converse.chatboxviews.get(toolbar_el.model.get('jid'));		

        getMyGeoLoc(function(url, position)
        {
            if (url) {				
				const model = new converse.env.Model();
                model.set("view", view);
                model.set("position", position);				
                model.set("url", url);
				_converse.api.modal.show('converse-pade-location-dialog', { model });					
            }
        });
    }

    function publishUserLocation(view, url, position) {
        console.debug("publishUserLocation", url, position);

        const stanza = $iq({type: 'set'}).c('pubsub', {xmlns: "http://jabber.org/protocol/pubsub"}).c('publish', {node: "http://jabber.org/protocol/geoloc"}).c('item').c('geoloc', {xmlns: "http://jabber.org/protocol/geoloc"}).c("accuracy").t(position.coords.accuracy).up().c("lat").t(position.coords.latitude).up().c("lon").t(position.coords.longitude).up();
		_converse.api.sendIQ(stanza);	
		
		const model = view.model;	
		const target = (model.get('type') == 'chatbox') ? model.get('jid') : (model.get('type') == 'chatroom' ? model.get('jid') : model.get('from'));		
		const type = (model.get('type') == 'chatroom') ? 'groupchat' : 'chat';				
		const msg = converse.env.stx`<message xmlns="jabber:client" from="${converseConn.jid}" to="${target}" type="${type}"><body>${url}</body><x xmlns='jabber:x:oob'><url>${url}</url></x></message>`;
		_converse.api.send(msg);			
    }

    function getMyGeoLoc(callback)
    {
        var showPosition = function (position)
        {
            console.debug("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude, position);

            const label = _converse.xmppstatus.get('fullname') || _converse.xmppstatus.get('nickname') || _converse.bare_jid;
            const pos = location.href.lastIndexOf('/') + 1;
            const url = location.href.substring(0, pos) + "packages/location/leaflet/index.html?accuracy=" + position.coords.accuracy + "&lat=" + position.coords.latitude + "&lng=" + position.coords.longitude + "&label=" + label;

            callback(url, position);
        }

        var showError = function (error) {
            var errorMsg = "";
            switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "User denied the request for Geolocation."
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "Location information is unavailable."
              break;
            case error.TIMEOUT:
              errorMsg = "The request to get user location timed out."
              break;
            case error.UNKNOWN_ERROR:
              errorMsg = "An unknown error occurred."
              break;
            }
            console.error("location plugin - " + errorMsg, error);
            callback();
        }

        navigator.geolocation.getCurrentPosition(showPosition, showError);
    }

    function listenForGeoLoc()    {
		console.debug("listenForGeoLoc");
		
        converseConn.addHandler(function(message)  {
            console.debug('geoloc handler', message);
            const handleElement = message.querySelector('geoloc');

            if (handleElement) {
                const accuracy = message.querySelector('accuracy').innerHTML;
                const lat = message.querySelector('lat').innerHTML;
                const lon = message.querySelector('lon').innerHTML;

                const label = message.getAttribute("from");
                const position = {coords: {accuracy: accuracy, latitude: lat, longitude: lon}};
                const pos = location.href.lastIndexOf('/') + 1;
                const url = location.href.substring(0, pos) + "packages/location/leaflet/index.html?accuracy=" + position.coords.accuracy + "&lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&label=" + label;

                var prompt = new Notification(label,
                {
                    'body': "View Geo Location",
                    'lang': _converse.locale,
                    'icon': _converse.DEFAULT_IMAGE,
                    'requireInteraction': true
                });

                prompt.onclick = function(event)
                {
                    event.preventDefault();

                    geoLocationDialog = new GeoLocationDialog({'model': new Model({position: position, url: url}) });
                    geoLocationDialog.show();
                }
            }

            return true;

        }, "http://jabber.org/protocol/geoloc", 'message');
    }
}));