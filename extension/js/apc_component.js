(function() {
'use strict';

// Feature detect
if (!(window.customElements && document.body.attachShadow)) {
  document.querySelector('tl-etherlynk').innerHTML = "<b>Your browser doesn't support Shadow DOM and Custom Elements v1.</b>";
  return;
}


customElements.define('tl-etherlynk', class extends HTMLElement {

  constructor() {
    super(); // always call super() first in the ctor.


    // Create shadow DOM for the component.
    let shadowRoot = this.attachShadow({mode: 'open'});


    //The following array is like this ... [midinumber,color,buttontitle]

    this.buttonmap=[
                      [null],
                      [56,null],[57,null],[58,null],[59,null],[60,null],[61,null],[62,null],[63,null],   [82,null],
                      [48,null],[49,null],[50,null],[51,null],[52,null],[53,null],[54,null],[55,null],   [83,null],
                      [40,null],[41,null],[42,null],[43,null],[44,null],[45,null],[46,null],[47,null],   [84,null],
                      [32,null],[33,null],[34,null],[35,null],[36,null],[37,null],[38,null],[39,null],   [85,null],
                      [24,null],[25,null],[26,null],[27,null],[28,null],[29,null],[30,null],[31,null],   [86,null],
                      [16,null],[17,null],[18,null],[19,null],[20,null],[21,null],[22,null],[23,null],   [87,null],
                      [8,null] ,[9,null] ,[10,null],[11,null],[12,null],[13,null],[14,null],[15,null],   [88,null],
                      [0,null] ,[1,null] ,[2,null] ,[3,null] ,[4,null] ,[5,null] ,[6,null] ,[7,null] ,   [89,null],

                      [64,null],[65,null],[66,null],[67,null],[68,null],[69,null],[70,null],[71,null],   [98,null]
    ]


    this.slidermap = {48:0,49:1,50:2,51:3,52:4,53:5,54:6,55:7,56:8}
    this.timeout={}
    this.timeoutval = 500;
    this.midienabled = true;


    this.defaultbuttonmap = this.buttonmap.slice(0);

    this.buttonSlot;

    shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 780px;
          height:580px;
          overflow:hidden;
          font-family: 'helvetica';
          contain: content;
          background-color: #656565;
          padding:10px;
          border-radius:10px;
          background-repeat: no-repeat;
          background-position: 762px 567px;
          background-size: 33px 27px;
        }
        .but{
          height:40px;
          width:75px;
          float:left;
          border-radius:5px;
          margin:4px;
          position:relative;
          font-family: 'helvetica';
          // font-weight:bold;
          font-size: 14px;
          box-sizing: border-box;
          // overflow:hidden;
          // white-space: nowrap;
          // text-overflow: ellipsis;
        }
        .round{
          position:relative;
          height:40px;
          width:40px;
          border-radius:50%;
          margin-left:15px;
          margin-right:40px;
          overflow:visible;
        }

        .round label{
          display:block;
          position:absolute;
          top:9px;
          left:40px;
          // white-space: nowrap;
          width:70px;
          text-align:left;
          color:#fff;
        }

        .bot{
          margin:15px 18px 14px 25px;
        }

        .bot label{
          display:block;
          position:absolute;
          top:40px;
          left:-13px;
          text-align:center;
          white-space: normal;
          color:#fff;
        }

        .square{
          border-radius:5px;
          margin: 15px 0 0 16px;
        }

        .red{
          background-color:red;
          color:#fff;
        }
        .green{
          background-color:green;
          color:#fff;
        }
        .yellow{
          background-color:orange;
          // color:#fff;
        }

        .greenflash{
          background-color: green;
          color: #fff;
          animation: backgroundblinker .5s step-end infinite alternate;
          -webkit-animation: backgroundblinker .5s step-end infinite alternate;
        }

        .redflash{
          background-color: red;
          color: black;
          animation: backgroundblinker .5s step-end infinite alternate;
          -webkit-animation: backgroundblinker .5s step-end infinite alternate;
        }

        .yellowflash{
          background-color: orange;
          color: black;
          animation: backgroundblinker .5s step-end infinite alternate;
          -webkit-animation: backgroundblinker .5s step-end infinite alternate;
        }


        @-webkit-keyframes backgroundblinker {
           // 50% { background-color: transparent; }
           50% { background-color: #DDD; color:black;}

        }
        @keyframes backgroundblinker {
           // 50% { background-color: transparent; }
           50% { background-color: #DDD; color:black;}

        }

        #sliders{
          // border:solid red 1px;
          width:800px;
          margin-top:475px;
          margin-left:10px;
        }


        input[type=range].vertical
        {
            writing-mode: bt-lr; /* IE */
            -webkit-appearance: slider-vertical; /* WebKit */
            width: 72px;
            height: 100px;
            padding: 0px;
            margin:0 6px 0 0;
        }

        .notifyindicator{
          position:absolute;
          width:13px;
          height:13px;
          color:#ffffff;
          font-size:10px;
          overflow:hidden;
          padding:2px;
          line-height:11px;
          top:-7px;
          right:-7px;
          border:solid 1px #c00606;
          border-radius:50%;
          background-color:red;
        }

        .hidden{
          display:none;
        }


      </style>
      <div id="buttonSlot"></div>
      <div id="sliders">
        <label for="slider1"></label><input id="slider1" mid="48" type="range" min="0" max="128" value="0" class="vertical">
        <label for="slider2"></label><input id="slider2" mid="49" type="range" min="0" max="128" value="0" class="vertical">
        <label for="slider3"></label><input id="slider3" mid="50" type="range" min="0" max="128" value="0" class="vertical">
        <label for="slider4"></label><input id="slider4" mid="51" type="range" min="0" max="128" value="0" class="vertical">
        <label for="slider5"></label><input id="slider5" mid="52" type="range" min="0" max="128" value="0" class="vertical">
        <label for="slider6"></label><input id="slider6" mid="53" type="range" min="0" max="128" value="0" class="vertical">
        <label for="slider7"></label><input id="slider7" mid="54" type="range" min="0" max="128" value="0" class="vertical">
        <label for="slider8"></label><input id="slider8" mid="55" type="range" min="0" max="128" value="0" class="vertical">
        <label for="slider9"></label><input id="slider8" mid="56" type="range" min="0" max="128" value="0" class="vertical">
      </div>
    `;
  }


  set data(data){
    this.buttonmap=data
    this._updateshaddowdom()
  }

  get data(){
    return this.buttonmap;
  }


  setbutton(data){
    var index = this.buttonmap.findIndex(x => x[0]==data[0]);
    this.buttonmap[index]=data
    this._updateshaddowdom()
  }


  connectedCallback() {

      if(this.midienabled==true){
        Tletherlynk.Midi.init()
      }

      this.buttonSlot = this.shadowRoot.querySelector('#buttonSlot');
      this.sliders = this.shadowRoot.querySelector('#sliders').getElementsByTagName("input")
      this.test = this.getAttribute('name');


      this.buttonSlot.addEventListener("mousedown", this._onclickbuttondown.bind(this), true);
      this.buttonSlot.addEventListener("mouseup", this._onclickbuttonup.bind(this), true);

      for (var i = 0; i < this.sliders.length; i++) {
        this.sliders[i].addEventListener("input", function(e){
          _this._broadcastevent(176,e.path[0].getAttribute("mid"),e.path[0].value)
        });

        this.sliders[i].addEventListener("wheel", function(e){

          console.log("wheel",e.deltaY)


          if(e.deltaY>0){
              this.value-=10;
          }else{
              this.value-=-10;
          }
          _this._broadcastevent(176,e.path[0].getAttribute("mid"),e.path[0].value)
        },{
          capture: true,
          passive: true
        });

      };


      var _this=this;


          document.body.addEventListener('webmidievent', function (e) {
              if(_this.midienabled==true){

                 // console.info('webmidievent recieved',e.detail)
                  _this._broadcastevent(e.detail.data1,e.detail.data2,e.detail.data3)

                  switch (e.detail.data1 & 0xf0) {
                    case 144:
                        //Note On
                        if (e.detail.data2!=0) {  // if velocity != 0, this is a note-on message
                          // console.log("midi call back button= ",midiassignmentmap.pads[e.detail.data2])
                           return;
                        }
                    case 128:
                          //Note off
                          //console.log("note off = ",e.detail.data2)
                          return;

                    case 176:
                          //cc value
                          // console.log("midi knob= ",e.detail.data2)

                          _this.sliders[_this.slidermap[e.detail.data2]].value=e.detail.data3;
                          return;
                  }

              }
          }, false);


      setTimeout(function(){
        _this._updateshaddowdom()
      },100);
  }


  _updateshaddowdom(){



      this.buttonSlot.innerHTML=""


      for (var i = 1; i < 82; i++) {
              var contactbut = document.createElement('button');
              var label = document.createElement('label');
              var notify = document.createElement('div');

              if(i==81){
                 contactbut.className = "but round square"
              }
              else if(i>72){
                 contactbut.className = "but round bot"
                    if(this.buttonmap[i][1]=="redflash"){
                        colorcode="00";
                    }
              }
              else{
                if(i % 9===0){
                    contactbut.className = "but round"

                }
                else{
                   contactbut.className = "but"
                }
              }

              if(this.buttonmap[i][2]!=undefined){
                contactbut.className = contactbut.className+" "+ this.buttonmap[i][1]
              }

              contactbut.id = "but"+i;
              if(this.buttonmap[i][2]!=undefined){
                label.innerHTML = this.buttonmap[i][2]
              }
              else{
                //show numbers
                // label.innerHTML = this.buttonmap[i][0]
              }

              if(this.buttonmap[i][3]!=undefined){
                notify.className="notifyindicator"
                notify.innerHTML = this.buttonmap[i][3]
              }else{
                notify.className="notifyindicator hidden"
                notify.innerHTML=" "
              }

              label.setAttribute('uid', this.buttonmap[i][0]);

              contactbut.setAttribute('uid', this.buttonmap[i][0]);
              this.buttonSlot.appendChild(contactbut)
              contactbut.appendChild(label)
              contactbut.appendChild(notify)


              //set midilights here
              if(this.buttonmap[i][1]!=undefined){

                var colorcode;
                switch(this.buttonmap[i][1]) {
                    case "red":
                        colorcode="03";
                        break;
                    case "green":
                        colorcode="01";
                        break;
                    case "yellow":
                        colorcode="05";
                        break;
                    case "redflash":
                        colorcode="04";
                        break;
                    case "greenflash":
                        colorcode="02";
                        break;
                    case "yellowflash":
                        colorcode="06";
                        break;
                    default:
                        //off
                        colorcode="00";
                }

                //overide for round red buts
                if(i>72){
                      if(this.buttonmap[i][1]=="redflash"){
                          colorcode="02";
                      }
                }

                if(this.midienabled==true){
                  Tletherlynk.Midi.sendlight("144",this.buttonmap[i][0],colorcode)
                }
              }else{
                if(this.midienabled==true){
                  if(i==1){
                    console.log("1")
                    Tletherlynk.Midi.sendlight("144","56","00")

                  }
                  Tletherlynk.Midi.sendlight("144",this.buttonmap[i][0],"00")
                }
              }

      }

      // this.buttonSlot.addEventListener("mousedown", this._onclickbuttondown.bind(this), true);
      // this.buttonSlot.addEventListener("mouseup", this._onclickbuttonup.bind(this), true);

  }

  _onclickbuttondown(e){
      var userclicked = e.path[0].getAttribute("uid")
      console.info("Clicked > ",userclicked,e)
      this._broadcastevent(144,userclicked,127)
  }
  _onclickbuttonup(e){
      var userclicked = e.path[0].getAttribute("uid")
      console.info("Clicked > ",userclicked)
      this._broadcastevent(128,userclicked,127)
  }


  resetlights(){
      // reset midi lights
      for (var i = 1; i < 82; i++) {
        if(this.midienabled==true){
          Tletherlynk.Midi.sendlight("144",this.buttonmap[i][0],"00");
        }
      }
  }

  loaddefaults(){
      this.buttonmap = this.defaultbuttonmap.slice(0)
      this._updateshaddowdom()
  }


  _broadcastevent(data1,data2,data3){

    var etherlynkuievent = new CustomEvent('etherlynk.ui.event', { 'detail': {'data1':parseInt(data1), 'data2':parseInt(data2), 'data3':parseInt(data3)} });
    document.body.dispatchEvent(etherlynkuievent);


    //test for key held
    if(parseInt(data1)==144){

      var etherlynkeventbuttondown = new CustomEvent('etherlynk.event.buttondown', { 'detail': {'button':parseInt(data2)} });
      document.body.dispatchEvent(etherlynkeventbuttondown);


      this.timeout[parseInt(data2)] = setTimeout(function(){
          // console.log("Button held",parseInt(data2))
          var etherlynkeventheld = new CustomEvent('etherlynk.event.held', { 'detail': {'button':parseInt(data2)} });
          document.body.dispatchEvent(etherlynkeventheld);

      }, this.timeoutval);
    }

    if(parseInt(data1)==128){
        clearTimeout(this.timeout[parseInt(data2)])

        var etherlynkeventbuttonup = new CustomEvent('etherlynk.event.buttonup', { 'detail': {'button':parseInt(data2)} });
        document.body.dispatchEvent(etherlynkeventbuttonup);
    };

  }


});

})();