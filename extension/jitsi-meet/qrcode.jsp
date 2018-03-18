<!DOCTYPE html>
<html><head><title>QR-Code for TOTP Enrollment</title>
<script>
    window.addEventListener("load", function()
    {
        var url = location.protocol + "//" + location.host + "/rest/api/restapi/v1/chat/enroll";
        var options = {method: "GET", headers: {"authorization":"<%= request.getHeader("authorization") %>"}};    

        console.log("fetch", url, options);    

        fetch(url, options).then(function(response){ return response.text()}).then(function(qrUrl) 
        {           
            console.log('connection ok', qrUrl);
            
            var qrcode = document.getElementById("qrcode");
            qrcode.innerHTML = "<img src='" + qrUrl + "'>";

        }).catch(function (err) {
            console.error('connection error', err);
        });
    });
    
</script>
</head>
<body>
    <div id="qrcode">
    </div>
</body>
</html>
