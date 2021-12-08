import { record } from "./vmsg-lib.js";

let recordButton = document.getElementById("recordButton");

recordButton.onclick = function()
{
  record({wasmURL: "vmsg.wasm"}).then(blob =>
  {
    mp3File = new File([blob], "vmsg-" + Math.random().toString(36).substr(2,9) + ".mp3", {type: "audio/mpeg"});
    console.log("Recorded MP3", mp3File);

    var url = URL.createObjectURL(blob);
    var preview = document.createElement('audio');
    preview.controls = true;preview.src = url;
    document.body.appendChild(preview);
  });
};
