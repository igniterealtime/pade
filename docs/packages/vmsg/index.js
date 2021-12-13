var mp3File = null;

function getMp3File()
{
  return mp3File;
}

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
document.getElementById("formats").innerHTML="Format: 1 channel mp3 @ "+audioCtx.sampleRate/1000+"kHz"
console.log(audioCtx.sampleRate);