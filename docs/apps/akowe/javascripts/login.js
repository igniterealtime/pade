/*global document, FileReader*/
var formSwitch = document.getElementById("formSwitch"),
    loginForm = document.getElementById("loginForm"),
    oauthForm = document.getElementById("oauthForm"),
    signupForm = document.getElementById("signupForm"),
    uploadButton = document.getElementById("imageUploadButton"),
    input = document.getElementById("imageInput"),
    previewImage = document.getElementById("avatarPreview");

    loginText = "... or log in. →",
    signupText = "... or sign up for an account. →";

// is signup available?
if (formSwitch) {
    formSwitch.textContent = signupText;
    formSwitch.addEventListener("click", function () {
        "use strict";
        if (loginForm.style.display === "none") {
            loginForm.style.display = "block";
            if (oauthForm) {
                oauthForm.style.display = "block";
            }

            signupForm.style.display = "none";
            formSwitch.textContent = signupText;
        } else {
            loginForm.style.display = "none";
            if (oauthForm) {
                oauthForm.style.display = "none";
            }

            signupForm.style.display = "block";
            formSwitch.textContent = loginText;
        }
    });
    input.addEventListener("change", function () {
        "use strict";
        var fileReader = new FileReader();
        fileReader.onload = function (fileReaderEvent) {
            previewImage.src = fileReaderEvent.target.result;
        };
        fileReader.readAsDataURL(input.files[0]);
    });
}

if (uploadButton) {
    uploadButton.addEventListener("click", function () {
        "use strict";
        input.click();
    });
}

