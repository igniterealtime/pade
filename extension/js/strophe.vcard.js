/**
 * Strophe.vCard plugin.
 */

 Strophe.addConnectionPlugin('vCard',
 {
    _connection: null,

    init: function (conn) {
        this._connection = conn;
        Strophe.addNamespace('vCard', 'vcard-temp');
        console.log("strophe plugin: vCard enabled");
    },

    get: function(jid, callback, errorback)
    {
        var iq = $iq({type: 'get', to: Strophe.getBareJidFromJid(jid)}).c('vCard', {xmlns: 'vcard-temp'});

        this._connection.sendIQ(iq, function(response)
        {
            var response = $(response);
            var username = Strophe.getNodeFromJid(jid);
            var name = response.find('vCard FN').text();
            var photo = response.find('vCard PHOTO');

            var avatar = "";

            if (photo.find('BINVAL').text() != "" && photo.find('TYPE').text() != "")
            avatar = 'data:' + photo.find('TYPE').text() + ';base64,' + photo.find('BINVAL').text();

            var family = response.find('vCard N FAMILY') ? response.find('vCard N FAMILY').text() : "";
                var middle = response.find('vCard N MIDDLE') ? response.find('vCard N MIDDLE').text() : "";
            var given = response.find('vCard N GIVEN') ? response.find('vCard N GIVEN').text() : "";

            var nickname = response.find('vCard NICKNAME') ? response.find('vCard NICKNAME').text() : "";

            var email = response.find('vCard EMAIL USERID') ? response.find('vCard EMAIL USERID').text() : "";
            var url = response.find('vCard URL') ? response.find('vCard URL').text() : "";
            var role = response.find('vCard ROLE') ? response.find('vCard ROLE').text() : "";

            var workPhone = "";
            var homePhone = "";
            var workMobile = "";
            var homeMobile = "";

            response.find('vCard TEL').each(function()
            {
            if ($(this).find('VOICE').size() > 0 && $(this).find('WORK').size() > 0)
                workPhone = $(this).find('NUMBER').text();

            if ($(this).find('VOICE').size() > 0 && $(this).find('HOME').size() > 0)
                homePhone = $(this).find('NUMBER').text();

            if ($(this).find('CELL').size() > 0 && $(this).find('WORK').size() > 0)
                workMobile = $(this).find('NUMBER').text();

            if ($(this).find('CELL').size() > 0 && $(this).find('HOME').size() > 0)
                homeMobile = $(this).find('NUMBER').text();

            });

            var street = "";
            var locality = "";
            var region = "";
            var pcode = "";
            var country = "";

            response.find('vCard ADR').each(function()
            {
            if ($(this).find('WORK').size() > 0)
            {
                street = $(this).find('STREET').text();
                locality = $(this).find('LOCALITY').text();
                region = $(this).find('REGION').text();
                pcode = $(this).find('PCODE').text();
                country = $(this).find('CTRY').text();
            }
            });

            var orgName = response.find('vCard ORG ORGNAME') ? response.find('vCard ORG ORGNAME').text() : "";
            var orgUnit = response.find('vCard ORG ORGUNIT') ? response.find('vCard ORG ORGUNIT').text() : "";

            var title = response.find('vCard TITLE') ? response.find('vCard TITLE').text() : "";

            var callbackResponse = {jid: jid, username: username, name: name, avatar: avatar, family: family, given: given, nickname: nickname, middle: middle, email: email, url: url, homePhone: homePhone, workPhone: workPhone, homeMobile: homeMobile, workMobile: workMobile, street: street, locality: locality, region: region, pcode: pcode, country: country, orgName: orgName, orgUnit: orgUnit, title: title, role: role};

            if (callback) callback(callbackResponse);

        }, function(error) {

        if (errorback) errorback(error);
        });
    },

    set: function(user, callback, errorback)
    {
        var avatar = user.avatar.split(";base64,");

        var iq = $iq({to:  this._connection.domain, type: 'set'}).c('vCard', {xmlns: 'vcard-temp'})

        .c("FN").t(user.name).up()
        .c("NICKNAME").t(user.nickname).up()
        .c("URL").t(user.url).up()
        .c("ROLE").t(user.role).up()
        .c("EMAIL").c("INTERNET").up().c("PREF").up().c("USERID").t(user.email).up().up()
        .c("PHOTO").c("TYPE").t(avatar[0].substring(5)).up().c("BINVAL").t(avatar[1]).up().up()
        .c("TEL").c("VOICE").up().c("WORK").up().c("NUMBER").t(user.workPhone).up().up()
        .c("ADR").c("WORK").up().c("STREET").t(user.street).up().c("LOCALITY").t(user.locality).up().c("REGION").t(user.region).up().c("PCODE").t(user.pcode).up().c("CTRY").t(user.country).up().up()
/*
        // TODO make spark and converse vcard compatible

        .c("TEL").c("PAGER").up().c("WORK").up().c("NUMBER").up().up()
        .c("TEL").c("CELL").up().c("WORK").up().c("NUMBER").t(user.workMobile).up().up()

        .c("TEL").c("FAX").up().c("WORK").up().c("NUMBER").up().up()
        .c("TEL").c("PAGER").up().c("HOME").up().c("NUMBER").up().up()
        .c("TEL").c("CELL").up().c("HOME").up().c("NUMBER").t(user.homeMobile).up().up()
        .c("TEL").c("VOICE").up().c("HOME").up().c("NUMBER").t(user.homePhone).up().up()
        .c("TEL").c("FAX").up().c("HOME").up().c("NUMBER").up().up()
        .c("URL").t(user.url).up()
        .c("ADR").c("HOME").up().c("STREET").up().c("LOCALITY").up().c("REGION").up().c("PCODE").up().c("CTRY").up().up()
        .c("TITLE").t(user.title).up()
*/
        this._connection.sendIQ(iq, callback, errorback);
    },
 });