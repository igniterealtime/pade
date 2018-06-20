var of = {}

window.addEventListener("load", function()
{
    if (config.fastpath && config.fastpath.form)
    {
    }

    window.localStorage["webmeet_record"]       =  config.webmeet_record;
    window.localStorage["webmeet_record_audio"] =  config.webmeet_record_audio;
    window.localStorage["webmeet_record_video"] =  config.webmeet_record_video;
    window.localStorage["webmeet_transcription"] = config.webmeet_transcription;
    window.localStorage["webmeet_captions"]     =  config.webmeet_captions;

    of.server = config.bosh_service_url.split("/")[2];
    of.avatar = null;

    if (config.uport)
    {
        var clientId = "2p1psGHt9J5NBdPDQejSVhpsECXLxLaVQSo";
        var permission = "Wa1l7M9NoGwcxxdX";

        var url = "https://" + of.server + "/rest/api/restapi/v1/ask/uport/pade/" + clientId;
        var options = {method: "GET", headers: {"authorization": permission}};

        fetch(url, options).then(function(response){ return response.text()}).then(function(signer)
        {
            //console.log("Signer", signer);

            window.uport = new uportconnect.Connect("Pade", {clientId: clientId, signer: uportconnect.SimpleSigner(signer)});

            window.uport.requestCredentials({notifications: true, verified: ['registration'], requested: ['name', 'email', 'phone', 'country', 'avatar']}).then((credentials) =>
            {
                //console.log("Credentials", credentials);

                document.getElementById("loader").style.display = "inline";

                config.uport_data = {name: credentials.name, email: credentials.email, phone: credentials.phone, country: credentials.country, avatar: credentials.avatar ? credentials.avatar.uri : null};

                if (config.auto_join_rooms && config.auto_join_rooms[0])
                {
                    config.auto_join_rooms[0] = {jid: config.auto_join_rooms[0], nick: credentials.name};
                }

                window.localStorage["uport.address"] =  credentials.address;
                window.localStorage["uport.email"] =    credentials.email;
                window.localStorage["uport.phone"] =    credentials.phone;
                window.localStorage["uport.country"] =  credentials.country;
                window.localStorage["uport.name"]    =  credentials.name;

                if (credentials.avatar && credentials.avatar.uri)
                {
                    of.avatar = credentials.avatar.uri;
                    window.localStorage["uport.avatar"] = of.avatar;
                }

                if (credentials.registration && credentials.registration.xmpp)
                {
                    if (credentials.registration.xmpp.indexOf("@" + config.locked_domain) > -1)
                    {
                        //console.log("login existing user", credentials.registration);

                        config.authentication = "login";
                        config.jid = credentials.registration.xmpp;
                        config.password = credentials.registration.access;

                        // for jitsi meet

                        localStorage.setItem("xmpp_username_override", credentials.registration.xmpp);
                        localStorage.setItem("xmpp_password_override", credentials.registration.access);

                        document.getElementById("loader").style.display = "none";
                        converseInitialize(config);

                    } else {
                        console.error("uPort credentials are not for server " + of.server + ", found " + credentials.registration.xmpp);
                        document.getElementById("loader").style.display = "none";
                        converseInitialize(config);
                    }


                } else {

                    var web3 = window.uport.getWeb3();
                    var account = null;

                    web3.eth.getAccounts((error, result) =>
                    {
                        //console.log("account", result, error);

                        if (error) {
                            console.error('Account error', error);
                            document.getElementById("loader").style.display = "none";
                            converseInitialize(config);

                        } else {
                            account = result[0];

                            window.localStorage["uport.account"] =  account;

                            //console.log('Account:' + account);

                            var url = "https://" + of.server + "/rest/api/restapi/v1/ask/uport/register";
                            var options = {method: "POST", headers: {"authorization": permission}, body: JSON.stringify({name: credentials.name, email: credentials.email, phone: credentials.phone, country: credentials.country, address: credentials.address, publicKey: credentials.publicKey, avatar: credentials.avatar, password: "", account: account})};

                            //console.log("register new user", credentials);

                            fetch(url, options).then(function(response){ return response.text()}).then(function(userpass)
                            {
                                try {
                                    userpass = JSON.parse(userpass);

                                    //console.log('uport register ok', userpass);

                                    window.uport.attestCredentials({
                                        sub: credentials.address,
                                        claim: {registration: {username: userpass.username, access: userpass.password, xmpp: userpass.username + "@" + config.locked_domain}},
                                        exp: new Date().getTime() + 30 * 24 * 60 * 60 * 1000

                                    }).then((result) => {
                                        //console.log('attestCredentials result', result);

                                        config.authentication = "login";
                                        config.jid = userpass.username + "@" + config.locked_domain;
                                        config.password = userpass.password;

                                        // for jitsi meet

                                        localStorage.setItem("xmpp_username_override", userpass.username + "@" + config.locked_domain);
                                        localStorage.setItem("xmpp_password_override", userpass.password);

                                        document.getElementById("loader").style.display = "none";
                                        converseInitialize(config);

                                    }).catch(function (err) {
                                        console.error('attestCredentials error', err);
                                        document.getElementById("loader").style.display = "none";
                                        converseInitialize(config);
                                    });

                                } catch (e) {
                                    console.error('Credentials error', e);
                                    document.getElementById("loader").style.display = "none";
                                    converseInitialize(config);
                                }

                            }).catch(function (err) {
                                console.error('Credentials error', err);
                                document.getElementById("loader").style.display = "none";
                                converseInitialize(config);
                            });
                        }
                    });
                }

            }, function(err) {
                console.error("Credentials", err);
                document.getElementById("loader").style.display = "none";
                converseInitialize(config);
            });

        }).catch(function (err) {
            console.error('uPort permission error', err);
            document.getElementById("loader").style.display = "none";
            converseInitialize(config);
        });

    } else {
        document.getElementById("loader").style.display = "none";
        converseInitialize(config);
    }
});

function converseInitialize(config)
{
    if (config.fastpath && config.fastpath.workgroup)
    {
        function fetch_text (url) {
            return fetch(url).then((response) => (response.text()));
        }

        fetch_text("forms/" + config.fastpath.form + ".html").then((html) => {
            document.getElementById("cf-webmeet").innerHTML = html;

        }).catch((error) => {
            console.error(error);
            converse.initialize(config);
        });

        var closeFastpath = document.getElementById("closeFastpath");

        if (closeFastpath)
        {
            closeFastpath.addEventListener('click', function()
            {
                if (window.parent && window.parent.ofmeet) window.parent.ofmeet.doExit();
                of.cForm.remove();
                window.location.reload();

            }, false);
        }

        of.connection = new Strophe.Connection("wss://" + of.server + '/ws/');
        //of.connection.rawInput = function (data) { console.log('RECV: ' + data); };
        //of.connection.rawOutput = function (data) { console.log('SEND: ' + data); };

        of.connection.connect(of.server, null, function (status)
        {
            if (status == Strophe.Status.CONNECTED)
            {
                //console.log('connected');
                of.connection.send($pres());
                of.connection.addHandler(onMessage, 'http://jabber.org/protocol/workgroup', 'message');

                // override with uPort

                if (config.uport)
                {
                    var name = document.getElementById("name");
                    var email = document.getElementById("email");

                    if (window.localStorage["uport.name"] && name) name.value = window.localStorage["uport.name"];
                    if (window.localStorage["uport.email"] && email) email.value = window.localStorage["uport.email"];
                }

                document.getElementById("conversejs").style.visibility = "visible";

                of.cForm = new cf.ConversationalForm(
                {
                    formEl: document.getElementById("cf-form2"),
                    context: document.getElementById("cf-webmeet"),
                    loadExternalStyleSheet: true,
                    robotImage: config.fastpath.robotImage,
                    userImage: of.avatar ? of.avatar : config.fastpath.userImage,

                    submitCallback: function(data)
                    {
                        //console.log("submitted", of.cForm.getFormData(true));
                        of.cForm.addRobotChatResponse("Please wait for an agent....");
                        joinWorkgroup(config.fastpath.workgroup, of.cForm.getFormData(true));
                    }
                });

            } else {
                //console.log('status', status);
            }
        });

    } else {
        document.getElementById("conversejs").style.visibility = "visible";
        converse.initialize(config);
    }
}

function joinWorkgroup(workgroup, form)
{
    //console.log('joinWorkgroup', form);
    of.form = form;

    if (of.connection != null && of.connection.connected)
    {
        var iq = $iq({to: workgroup, type: 'set'}).c('join-queue', {xmlns: 'http://jabber.org/protocol/workgroup'});
        iq.c('queue-notifications').up();
        iq.c('x', {xmlns: 'jabber:x:data', type: 'submit'});

        var items = Object.getOwnPropertyNames(form)

        for (var i=0; i< items.length; i++)
        {
            iq.c('field', {var: items[i]}).c('value').t(form[items[i]]).up().up();
        }

        iq.up();

        of.connection.sendIQ(iq,
            function (res) {
                //console.log('join workgroup ok', res);
            },

            function (err) {
                console.error('join workgroup error', err);
                of.cForm.addRobotChatResponse("Ask error: No Agent available");

                setTimeout(function()
                {
                    converse.initialize(config);

                }, 2000)
            }
        );
    }
}

function onMessage(message)
{
    //console.log('onMessage', message);

    $(message).find('x').each(function()
    {
        var xmlns = $(this).attr("xmlns");

        if (xmlns == "jabber:x:conference")
        {
            var roomJid = $(this).attr("jid");
            var room = Strophe.getNodeFromJid(roomJid);
            //console.log("fastpath invite", room);

            of.cForm.remove();
            config.auto_join_rooms = [{jid: roomJid, nick: of.form.name || "Visitor"}];
            converse.initialize(config);
        }
    });

    return true;
}

function stopRecorder()
{
    //console.log("stopRecorder");

    if (of.audioRecorder) of.audioRecorder.stop();
    if (of.videoRecorder) of.videoRecorder.stop();
}

function startRecorder(recordAudio, recordVideo, localAudioStream, localVideoStream, room, nickname, username, password)
{
    //console.log("startRecorder", nickname, room, username, localAudioStream, localVideoStream);

    if (recordAudio || recordVideo)
    {
        of.audioRecorder = new MediaRecorder(localAudioStream);
        of.audioChunks = [];

        of.audioRecorder.ondataavailable = function(e)
        {
            if (e.data.size > 0)
            {
                //console.log("startRecorder push audio ", e.data);
                of.audioChunks.push(e.data);
            }
        }

        of.audioRecorder.onstop = function(e)
        {
            //console.log("audioRecorder.onstop ", e.data);
            var audioReader = new FileReader();

            audioReader.onload = function()
            {
                var file = dataUrlToFile(audioReader.result, room + "." + nickname + ".audio.webm");
                //console.log("audioReader.onload", file);
                uploadFile(file, room, username, password);
            };

            audioReader.readAsDataURL(new Blob(of.audioChunks, {type: 'video/webm'}));
        }

        of.audioRecorder.start();
    }

    if (recordVideo)
    {
        of.videoRecorder = new MediaRecorder(localVideoStream);
        of.videoChunks = [];

        of.videoRecorder.ondataavailable = function(e)
        {
            if (e.data.size > 0)
            {
                //console.log("startRecorder push video ", e.data);
                of.videoChunks.push(e.data);
            }
        }

        of.videoRecorder.onstop = function(e)
        {
            //console.log("videoRecorder.onstop ", e.data);
            var videoReader = new FileReader();

            videoReader.onload = function()
            {
                var file = dataUrlToFile(videoReader.result, room + "." + nickname + ".video.webm");
                //console.log("videoReader.onload", file);
                uploadFile(file, room, username, password);
            };

            videoReader.readAsDataURL(new Blob(of.videoChunks, {type: 'video/webm'}));
        }

        of.videoRecorder.start();
    }
}

function uploadFile(file, room, username, password)
{
    //console.log("uploadFile", file, room);

    var putUrl = "https://" + of.server + "/dashboard/upload?name=" + file.name + "&username=" + username;

    var req = new XMLHttpRequest();

    req.onreadystatechange = function()
    {
      if (this.readyState == 4 && this.status >= 200 && this.status < 400)
      {
        //console.log("uploadFile", this.statusText);
      }
      else

      if (this.readyState == 4 && this.status >= 400)
      {
        console.error("uploadFile", this.statusText);
      }

    };
    req.open("PUT", putUrl, true);
    req.setRequestHeader("Authorization", 'Basic ' + btoa(username + ':' + password));
    req.send(file);
}

function dataUrlToFile(dataUrl, name)
{
    //console.log("dataUrlToFile", dataUrl, name);

    var binary = atob(dataUrl.split(',')[1]),
    data = [];

    for (var i = 0; i < binary.length; i++)
    {
        data.push(binary.charCodeAt(i));
    }

    return new File([new Uint8Array(data)], name, {type: 'video/webm'});
}


