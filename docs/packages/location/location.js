(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
     var _converse = null, Strophe, $iq, $msg, $pres, $build, b64_sha1, dayjs, html, _, __, Model, BootstrapModal, location_label;
     var geoLocationDialog, GeoLocationDialog;

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
            Model = converse.env.Model;
            BootstrapModal = converse.env.BootstrapModal;
            _ = converse.env._;
            __ = _converse.__;
            dayjs = converse.env.dayjs;
            html = converse.env.html;

            location_label = __('Publish My Geo Location');

            GeoLocationDialog = BootstrapModal.extend({
                id: "plugin-location-modal",					
                initialize() {
                    BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  return html`<div class="modal-dialog modal-lg"> <div class="modal-content">
                         <div class="modal-header"><h1 class="modal-title">${location_label}</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>
                         <div class="modal-body"></div>
                         <div class="modal-footer"> <button title="Publish" type="button" class="btn btn-success btn-publish" data-dismiss="modal">Publish</button> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button></div>
                         </div> </div>`;
                },
                afterRender() {
                    const that = this;
                    const url = this.model.get("url");
                    const view = this.model.get("view");

                    this.el.addEventListener('shown.bs.modal', function()
                    {
                        if (url)
                        {
                            that.el.querySelector('.modal-body').innerHTML = '<iframe frameborder="0" style="border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:600px;" src="' + url + '"></iframe>';
                        }

                    }, false);
                },
                events: {
                    "click .btn-publish": "publishGeoLoc",
                },

                publishGeoLoc() {
                    const view = this.model.get("view");
                    const url = this.model.get("url");
                    const position = this.model.get("position");

                    if (view) publishUserLocation(view, url, position);
                }
            });

            _converse.api.listen.on('connected', function()
            {
                listenForGeoLoc();
            });

            _converse.api.listen.on('getToolbarButtons', function(toolbar_el, buttons)
            {
                console.debug("getToolbarButtons", toolbar_el.model.get("jid"));
                let color = "fill:var(--chat-toolbar-btn-color);";
                if (toolbar_el.model.get("type") == "chatroom") color = "fill:var(--muc-toolbar-btn-color);";

                buttons.push(html`
                    <button class="plugin-location" title="${location_label}" @click=${performLocation}/>
                        <svg style="width:18px; height:18px; ${color}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g><path d="M 15.272,31.458c 0.168,0.186, 0.33,0.306, 0.486,0.39c 0.002,0.002, 0.006,0.002, 0.008,0.004 c 0.108,0.056, 0.214,0.098, 0.314,0.098c 0.1,0, 0.206-0.042, 0.314-0.098c 0.002-0.002, 0.006-0.002, 0.008-0.004 c 0.156-0.084, 0.318-0.204, 0.486-0.39c0,0, 9.296-10.11, 10.23-18.87c 0.056-0.452, 0.094-0.91, 0.094-1.376C 27.212,5.020, 22.192,0, 16,0 S 4.788,5.020, 4.788,11.212c0,0.474, 0.038,0.936, 0.096,1.394C 5.842,21.362, 15.272,31.458, 15.272,31.458z M 16,4 c 3.976,0, 7.212,3.236, 7.212,7.212c0,3.976-3.236,7.212-7.212,7.212S 8.788,15.188, 8.788,11.212C 8.788,7.236, 12.024,4, 16,4z"></path></g></svg>
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

    function performLocation(ev)
    {
        ev.stopPropagation();
        ev.preventDefault();
		
		const toolbar_el = converse.env.utils.ancestor(ev.target, 'converse-chat-toolbar');
		const view = _converse.chatboxviews.get(toolbar_el.model.get('jid'));		

        getMyGeoLoc(function(url, position)
        {
            if (url)
            {
                geoLocationDialog = new GeoLocationDialog({'model': new Model({view: view}) });
                geoLocationDialog.model.set("position", position);
                geoLocationDialog.model.set("url", url);
                geoLocationDialog.show(ev);
            }
        });
    }

    function publishUserLocation(view, url, position)
    {
        console.debug("publishUserLocation", url, position);

        const stanza = $iq({type: 'set'}).c('pubsub', {xmlns: "http://jabber.org/protocol/pubsub"}).c('publish', {node: "http://jabber.org/protocol/geoloc"}).c('item').c('geoloc', {xmlns: "http://jabber.org/protocol/geoloc"}).c("accuracy").t(position.coords.accuracy).up().c("lat").t(position.coords.latitude).up().c("lon").t(position.coords.longitude).up();

        _converse.connection.sendIQ(stanza, function(iq)
        {
            console.debug("User location pubsub ok");

        }, function(error){
            console.error("User location error", error);
        });
		
		let type = 'chat';
		if (view.model.get("type") == "chatroom") type = 'groupchat';			  
		_converse.api.send($msg({ to: view.model.get('jid'), from: _converse.connection.jid, type}).c('body').t(url).up().c('x', {'xmlns': 'jabber:x:oob'}).c('url').t(url).root());				
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

    function listenForGeoLoc()
    {
        _converse.connection.addHandler(function(message)
        {
            console.debug('geoloc handler', message);
            const handleElement = message.querySelector('geoloc');

            if (handleElement)
            {
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