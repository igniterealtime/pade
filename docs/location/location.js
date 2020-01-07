(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
     var _converse = null, Strophe, $iq, $msg, $pres, $build, b64_sha1, _ ,Backbone, dayjs;
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
            _ = converse.env._;
            Backbone = converse.env.Backbone;
            dayjs = converse.env.dayjs;


            GeoLocationDialog = _converse.BootstrapModal.extend({
                initialize() {
                    _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                    this.model.on('change', this.render, this);
                },
                toHTML() {
                  return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                         '<div class="modal-header"><h1 class="modal-title">' + _converse.api.settings.get("location_label") + '</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                         '<div class="modal-body"></div>' +
                         '<div class="modal-footer"> <button title="Publish" type="button" class="btn btn-success btn-publish" data-dismiss="modal">Publish</button> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button></div>' +
                         '</div> </div> </div>';
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

            _converse.api.settings.update({
                location_label: "Publish My Geo Location",
            });

            _converse.api.listen.on('connected', function()
            {
                listenForGeoLoc();
            });

            _converse.api.listen.on('renderToolbar', function(view)
            {
                console.debug('renderToolbar', view.model);

                if (navigator.geolocation)
                {
                    const id = view.model.get("box_id");
                    const html = '<a class="fas fa-location-arrow" title="' + _converse.api.settings.get("location_label") + '"></a>';
                    const location = addToolbarItem(view, id, "pade-geolocation-" + id, html);

                    location.addEventListener('click', function(evt)
                    {
                        evt.stopPropagation();

                        getMyGeoLoc(function(url, position)
                        {
                            if (url)
                            {
                                geoLocationDialog = new GeoLocationDialog({'model': new converse.env.Backbone.Model({position: position, url: url, view: view}) });
                                geoLocationDialog.show();
                            }
                        });

                    }, false);
                }
            });

            console.log("location plugin is ready");
        },

        overrides: {

            MessageView: {

                transformOOBURL: function(url)
                {
                    if (url && url.indexOf("location/leaflet/index.html?accuracy=") > -1)
                    {
                        return "<iframe frameborder='0' style='border:0px; border-width:0px; margin-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; width:100%;height:600px;' src='" + url + "'></iframe>";
                    }
                }
            }
        }
    });

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


        const attrs = view.model.getOutgoingMessageAttributes(url);
        const message = view.model.messages.create(attrs);
        message.set('oob_url', url);

        _converse.api.send(view.model.createMessageStanza(message));
        view.showHelpMessages([url]);
    }

    function getMyGeoLoc(callback)
    {
        var showPosition = function (position)
        {
            console.debug("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude, position);

            const label = _converse.xmppstatus.get('fullname') || _converse.xmppstatus.get('nickname') || _converse.bare_jid;
            const pos = location.href.lastIndexOf('/') + 1;
            const url = location.href.substring(0, pos) + "location/leaflet/index.html?accuracy=" + position.coords.accuracy + "&lat=" + position.coords.latitude + "&lng=" + position.coords.longitude + "&label=" + label;

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
                const url = location.href.substring(0, pos) + "leaflet/index.html?accuracy=" + position.coords.accuracy + "&lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&label=" + label;

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

                    geoLocationDialog = new GeoLocationDialog({'model': new converse.env.Backbone.Model({position: position, url: url}) });
                    geoLocationDialog.show();
                }
            }

            return true;

        }, "http://jabber.org/protocol/geoloc", 'message');
    }

    function __newElement (el, id, html, className)
    {
        var ele = document.createElement(el);
        if (id) ele.id = id;
        if (html) ele.innerHTML = html;
        if (className) ele.classList.add(className);
        document.body.appendChild(ele);
        return ele;
    }

    function addToolbarItem (view, id, label, html)
    {
        var placeHolder = view.el.querySelector('#place-holder');

        if (!placeHolder)
        {
            var smiley = view.el.querySelector('.toggle-smiley.dropup');
            smiley.insertAdjacentElement('afterEnd', __newElement('li', 'place-holder'));
            placeHolder = view.el.querySelector('#place-holder');
        }
        var newEle = __newElement('li', label, html);
        placeHolder.insertAdjacentElement('afterEnd', newEle);
        return newEle;
    }
}));