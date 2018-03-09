var Tletherlynk = {};
Tletherlynk.Midi = ( function( window, undefined ) {

  var midi = null;  // global MIDIAccess object
  var thisid = null;
 
  function Init(){
      // //printout = document.getElementById("midistatus");
      
      console.log("Hello midi")
      if (navigator.requestMIDIAccess){
          // navigator.requestMIDIAccess().then( onMIDISuccess, onMIDIFailure );
          navigator.requestMIDIAccess({ sysex: false }).then( onMIDISuccess, onMIDIFailure );
      }
      else{
          console.log("No MIDI support present in your browser.  You're gonna have a bad time.")
      }
  }


  function onMIDISuccess( midiAccess ) {
    console.log( "MIDI ready!" );
    midi = midiAccess;  // store in the global (in real usage, would probably keep in an object instance)
    listInputsAndOutputs(midi);
    midi.onstatechange = function(e){
      console.log("MIDI device "+e.port.state);
      listInputsAndOutputs(midi);
    }
  }

  function onMIDIFailure(msg) {
    console.log( "Failed to get MIDI access - " + msg );
  }


  function listInputsAndOutputs( midiAccess ) {

    var haveAtLeastOneDevice=false;
    var inputs=midiAccess.inputs.values();
    for ( var input = inputs.next(); input && !input.done; input = inputs.next()) {
      input.value.onmidimessage = MIDIMessageEventHandler;
      haveAtLeastOneDevice = true;
      console.log("Midi Inputs =",input.value)
    }

    if (!haveAtLeastOneDevice){
      console.log("No MIDI input devices present.  You're gonna have a bad time.");
    }

    var outputs=midiAccess.outputs.values();
    for ( var output = outputs.next(); output && !output.done; output = outputs.next()) {
      console.log("Midi outputs",output.value);
      if(output.value.name=="APC Key 25" || output.value.name=="APC MINI"){
        thisid=output.value.id;
      }
    }

    console.log("output id = ",thisid)

  }


  function Sendlight(something,pad,onoff){
    // var noteOnMessage = [0x90, 36, 01];
    var noteOnMessage = [something, pad, onoff];   
    if (thisid){
      var output = midi.outputs.get(thisid);
      output.send( noteOnMessage );
    }
  }


  function MIDIMessageEventHandler(event) {
    
    // console.log("input event = ",event.data[0],event.data[1],event.data[2]);

    var webmidievent = new CustomEvent('webmidievent', { 'detail': {'data1':event.data[0], 'data2':event.data[1], 'data3':event.data[2]} });

    document.body.dispatchEvent(webmidievent);

  }




return{
                           init:Init,
                      sendlight:Sendlight
};


} )( window );
