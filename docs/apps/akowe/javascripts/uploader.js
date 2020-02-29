/*global document*/
var uploadButton = document.getElementById("file-uploader"),
    form = uploadButton.getElementsByTagName("form")[0],
    input = form.getElementsByTagName("input")[0];

uploadButton.addEventListener("click", function () {
    "use strict";
    input.click();
});
input.addEventListener("change", function () {
    "use strict";
    form.submit();
});
