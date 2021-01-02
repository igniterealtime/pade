var branding = {};

fetch("../options/branding.json", {method: "GET"}).then(function(response){ return response.json()}).then(function(json)
{
    branding = json;
    console.log('branding', json);

}).catch(function (err) {
    console.error('branding error', err);
});
