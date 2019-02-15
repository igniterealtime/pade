window.addEventListener("load", function()
{
    if (navigator.geolocation)
    {
        var latLng = {};

        navigator.geolocation.getCurrentPosition(function(position) {
            var latLng = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            var mymap = L.map('mapid').setView(latLng, 13);
            var popup = L.popup();
            popup.setLatLng(latLng);
            popup.setContent('This is your current location');
            popup.openOn(mymap);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mymap);

        }, function() {
            console.error("navigator.geolocation.getCurrentPosition error");
        });
    }
});