<!DOCTYPE html>
<html><head><title>Client Certificate</title>
<script>
    window.addEventListener("load", function()
    {
        var url = location.protocol + "//" + location.host + "/rest/api/restapi/v1/chat/certificate";
        var options = {method: "GET", headers: {"authorization":"<%= request.getHeader("authorization") %>"}};    

        console.log("fetch", url, options);    

        fetch(url, options).then(function(response){ return response.blob()}).then(function(blob) 
        {  
            location.href = window.URL.createObjectURL(blob);
            
        }).catch(function (err) {
            console.error('connection error', err);
        });
    });
    
</script>
</head>
<body>
</body>
</html>
