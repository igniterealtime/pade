window.addEventListener("load", function()
{
    function urlParam(name)
    {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (!results) { return undefined; }
        return unescape(results[1] || undefined);
    };

    function showMap(latLng, label)
    {
        var mymap = L.map('mapid').setView(latLng, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mymap);

        var radius = latLng.accuracy / 2;
        L.marker(latLng).addTo(mymap).bindPopup(label + "\n is within " + radius + " meters from here").openPopup();
        L.circle(latLng, radius).addTo(mymap);
    }

    var accuracy = urlParam("accuracy");
    var label = urlParam("label");
    var lat = urlParam("lat");
    var lng = urlParam("lng");

    if (lat && lng && label && accuracy)
    {
        showMap({lat: lat, lng: lng, accuracy: accuracy}, label)
    }
    else

    if (navigator.geolocation)
    {
        navigator.geolocation.getCurrentPosition(function(position)
        {
            var name = "Me";

            if (localStorage["store.settings.displayname"]) {
                name = JSON.parse(localStorage["store.settings.displayname"]);
            }
            showMap({lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy}, name)

        }, function() {
            console.error("navigator.geolocation.getCurrentPosition error");
        });
    }
});