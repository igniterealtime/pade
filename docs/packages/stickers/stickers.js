(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["converse"], factory);
    } else {
        factory(converse);
    }
}(this, function (converse) {
    var _converse = null;

    converse.plugins.add("stickers", {
        'dependencies': [],

        'initialize': function () {
            _converse = this._converse;

           const emoji_categories = _converse.api.settings.get("emoji_categories");
           emoji_categories.custom = ":cuppy:";
           _converse.api.settings.set("emoji_categories", emoji_categories);

           setCustomEmojis();
           console.debug("stickers plugin is ready");
        }
    });

	function unique(arr) {
	  return [...new Set(arr)];
	}
	
    function setCustomEmojis()
    {
        if (!converse.emojis.json)
        {
            setTimeout(setCustomEmojis, 500);
            return;
        }

        converse.emojis.json.custom =  {
            /*
                author      = Minseung Song
                license     = CreativeCommon
                url         = https://dribbble.com/shots/5690379-Cuppy-A-WhatsApp-Sticker
            */
            ":cuppy:": {
                "sn": ":cuppy:",
                "url": "./packages/stickers/cuppy/01_cuppy_smile.png",
                "c": "custom"
            },
            ":cuppy_lol:": {
                "sn": ":cuppy_lol:",
                "url": "./packages/stickers/cuppy/02_cuppy_lol.png",
                "c": "custom"
            },
            ":cuppy_rofl:": {
                "sn": ":cuppy_rofl:",
                "url": "./packages/stickers/cuppy/03_cuppy_rofl.png",
                "c": "custom"
            },
            ":cuppy_sad:": {
                "sn": ":cuppy_sad:",
                "url": "./packages/stickers/cuppy/04_cuppy_sad.png",
                "c": "custom"
            },
            ":cuppy_cry:": {
                "sn": ":cuppy_cry:",
                "url": "./packages/stickers/cuppy/05_cuppy_cry.png",
                "c": "custom"
            },
            ":cuppy_love:": {
                "sn": ":cuppy_love:",
                "url": "./packages/stickers/cuppy/06_cuppy_love.png",
                "c": "custom"
            },
            ":cuppy_hate:": {
                "sn": ":cuppy_hate:",
                "url": "./packages/stickers/cuppy/07_cuppy_hate.png",
                "c": "custom"
            },
            ":cuppy_lovewithmug:": {
                "sn": ":cuppy_lovewithmug:",
                "url": "./packages/stickers/cuppy/08_cuppy_lovewithmug.png",
                "c": "custom"
            },
            ":cuppy_lovewithcookie:": {
                "sn": ":cuppy_lovewithcookie:",
                "url": "./packages/stickers/cuppy/09_cuppy_lovewithcookie.png",
                "c": "custom"
            },
            ":cuppy_hmm:": {
                "sn": ":cuppy_hmm:",
                "url": "./packages/stickers/cuppy/10_cuppy_hmm.png",
                "c": "custom"
            },
            ":cuppy_upset:": {
                "sn": ":cuppy_upset:",
                "url": "./packages/stickers/cuppy/11_cuppy_upset.png",
                "c": "custom"
            },
            ":cuppy_angry:": {
                "sn": ":cuppy_angry:",
                "url": "./packages/stickers/cuppy/12_cuppy_angry.png",
                "c": "custom"
            },
            ":cuppy_rofl:": {
                "sn": ":cuppy_rofl:",
                "url": "./packages/stickers/cuppy/13_cuppy_curious.png",
                "c": "custom"
            },
            ":cuppy_weird:": {
                "sn": ":cuppy_weird:",
                "url": "./packages/stickers/cuppy/14_cuppy_weird.png",
                "c": "custom"
            },
            ":cuppy_bluescreen:": {
                "sn": ":cuppy_bluescreen:",
                "url": "./packages/stickers/cuppy/15_cuppy_bluescreen.png",
                "c": "custom"
            },
            ":cuppy_angry:": {
                "sn": ":cuppy_angry:",
                "url": "./packages/stickers/cuppy/16_cuppy_angry.png",
                "c": "custom"
            },
            ":cuppy_tired:": {
                "sn": ":cuppy_tired:",
                "url": "./packages/stickers/cuppy/17_cuppy_tired.png",
                "c": "custom"
            },
            ":cuppy_workhard:": {
                "sn": ":cuppy_workhard:",
                "url": "./packages/stickers/cuppy/18_cuppy_workhard.png",
                "c": "custom"
            },
            ":cuppy_shine:": {
                "sn": ":cuppy_shine:",
                "url": "./packages/stickers/cuppy/19_cuppy_shine.png",
                "c": "custom"
            },
            ":cuppy_disgusting:": {
                "sn": ":cuppy_disgusting:",
                "url": "./packages/stickers/cuppy/20_cuppy_disgusting.png",
                "c": "custom"
            },
            ":cuppy_hi:": {
                "sn": ":cuppy_hi:",
                "url": "./packages/stickers/cuppy/21_cuppy_hi.png",
                "c": "custom"
            },
            ":cuppy_bye:": {
                "sn": ":cuppy_bye:",
                "url": "./packages/stickers/cuppy/22_cuppy_bye.png",
                "c": "custom"
            },
            ":cuppy_greentea:": {
                "sn": ":cuppy_greentea:",
                "url": "./packages/stickers/cuppy/23_cuppy_greentea.png",
                "c": "custom"
            },
            ":cuppy_phone:": {
                "sn": ":cuppy_phone:",
                "url": "./packages/stickers/cuppy/24_cuppy_phone.png",
                "c": "custom"
            },
            ":cuppy_battery:": {
                "sn": ":cuppy_battery:",
                "url": "./packages/stickers/cuppy/25_cuppy_battery.png",
                "c": "custom"
            },
            /*
                author      = Hey-Xander
                license     = CreativeCommon BY SA
                url
            */
            ":miho:": {
                "sn": ":miho:",
                "url": "./packages/stickers/miho/icon.png",
                "c": "custom"
            },
            ":6bbee3f5bcaeecbaa9fac68ba1aa4656e10a158d:": {
                "sn": ":6bbee3f5bcaeecbaa9fac68ba1aa4656e10a158d:",
                "url": "./packages/stickers/miho/6bbee3f5bcaeecbaa9fac68ba1aa4656e10a158d.png",
                "c": "custom"
            },
            ":34a406c2212522d7e6b60e888665267b16fc37ba:": {
                "sn": ":34a406c2212522d7e6b60e888665267b16fc37ba:",
                "url": "./packages/stickers/miho/34a406c2212522d7e6b60e888665267b16fc37ba.png",
                "c": "custom"
            },
            ":100bdb0e14c557b87ad4d253018b71eb65b80725:": {
                "sn": ":100bdb0e14c557b87ad4d253018b71eb65b80725:",
                "url": "./packages/stickers/miho/100bdb0e14c557b87ad4d253018b71eb65b80725.png",
                "c": "custom"
            },
            ":777e80a69ccc9c9938457844f9723f4debac0653:": {
                "sn": ":777e80a69ccc9c9938457844f9723f4debac0653:",
                "url": "./packages/stickers/miho/777e80a69ccc9c9938457844f9723f4debac0653.png",
                "c": "custom"
            },
            ":3142d1222d82d9f2dbe48d284c8f189660f418c3:": {
                "sn": ":3142d1222d82d9f2dbe48d284c8f189660f418c3:",
                "url": "./packages/stickers/miho/3142d1222d82d9f2dbe48d284c8f189660f418c3.png",
                "c": "custom"
            },
            ":04214b0b967163915432d5406adec8c4017e093b:": {
                "sn": ":04214b0b967163915432d5406adec8c4017e093b:",
                "url": "./packages/stickers/miho/04214b0b967163915432d5406adec8c4017e093b.png",
                "c": "custom"
            },
            ":580999b6110e859e336229913a73ec0ae640ef06:": {
                "sn": ":580999b6110e859e336229913a73ec0ae640ef06:",
                "url": "./packages/stickers/miho/580999b6110e859e336229913a73ec0ae640ef06.png",
                "c": "custom"
            },
            ":a3366676e1aea97dd9425fe7cc45a6ed86288f2e:": {
                "sn": ":a3366676e1aea97dd9425fe7cc45a6ed86288f2e:",
                "url": "./packages/stickers/miho/a3366676e1aea97dd9425fe7cc45a6ed86288f2e.png",
                "c": "custom"
            },
            ":ae0ba6cdae25fbe512dc53c7e0413d706a9410f8:": {
                "sn": ":ae0ba6cdae25fbe512dc53c7e0413d706a9410f8:",
                "url": "./packages/stickers/miho/ae0ba6cdae25fbe512dc53c7e0413d706a9410f8.png",
                "c": "custom"
            },
            ":c42fc57e5234c4d19a2455178eff2b30bced20ef:": {
                "sn": ":c42fc57e5234c4d19a2455178eff2b30bced20ef:",
                "url": "./packages/stickers/miho/c42fc57e5234c4d19a2455178eff2b30bced20ef.png",
                "c": "custom"
            },
            ":c069c6deff735fab3e4416ca354594a64a79ae40:": {
                "sn": ":c069c6deff735fab3e4416ca354594a64a79ae40:",
                "url": "./packages/stickers/miho/c069c6deff735fab3e4416ca354594a64a79ae40.png",
                "c": "custom"
            },
            ":e599dca3de182a821ef2e92234fb2bfca04a325e:": {
                "sn": ":e599dca3de182a821ef2e92234fb2bfca04a325e:",
                "url": "./packages/stickers/miho/e599dca3de182a821ef2e92234fb2bfca04a325e.png",
                "c": "custom"
            },
            ":eb7d0dd12b283017edee25243c3edacd62033ed0:": {
                "sn": ":eb7d0dd12b283017edee25243c3edacd62033ed0:",
                "url": "./packages/stickers/miho/eb7d0dd12b283017edee25243c3edacd62033ed0.png",
                "c": "custom"
            },
            ":f038ef01f098cae73a727618c0fbf9adf3e96ef6:": {
                "sn": ":f038ef01f098cae73a727618c0fbf9adf3e96ef6:",
                "url": "./packages/stickers/miho/f038ef01f098cae73a727618c0fbf9adf3e96ef6.png",
                "c": "custom"
            },
            ":fc0f48df75138fa0f3aec605629226b8ac57c639:": {
                "sn": ":fc0f48df75138fa0f3aec605629226b8ac57c639:",
                "url": "./packages/stickers/miho/fc0f48df75138fa0f3aec605629226b8ac57c639.png",
                "c": "custom"
            },
            ":fd759226e3ec153956f3e941b81ed820614792a6:": {
                "sn": ":fd759226e3ec153956f3e941b81ed820614792a6:",
                "url": "./packages/stickers/miho/fd759226e3ec153956f3e941b81ed820614792a6.png",
                "c": "custom"
            },
            /*
                author      = https://lottiefiles.com/
                license     = CreativeCommon BY SA
            */
            ":stickers:": {
                "sn": ":stickers:",
                "url": "./packages/stickers/animations/15179-confirm-popup.gif",
                "c": "custom"
            },
            ":cute-doggie:": {
                "sn": ":cute-doggie:",
                "url": "./packages/stickers/animations/15224-cute-doggie.gif",
                "c": "custom"
            },
            ":pushups:": {
                "sn": ":pushups:",
                "url": "./packages/stickers/animations/15260-pushups.gif",
                "c": "custom"
            },
            ":karaoke:": {
                "sn": ":karaoke:",
                "url": "./packages/stickers/animations/15307-karaoke.gif",
                "c": "custom"
            },
            ":gears:": {
                "sn": ":gears:",
                "url": "./packages/stickers/animations/47-gears.gif",
                "c": "custom"
            },
            ":around-the-world:": {
                "sn": ":around-the-world:",
                "url": "./packages/stickers/animations/128-around-the-world.gif",
                "c": "custom"
            },
            ":present:": {
                "sn": ":present:",
                "url": "./packages/stickers/animations/427-present.gif",
                "c": "custom"
            },
            ":check-animation:": {
                "sn": ":check-animation:",
                "url": "./packages/stickers/animations/1798-check-animation.gif",
                "c": "custom"
            },
            ":waiting-for-ideas:": {
                "sn": ":waiting-for-ideas:",
                "url": "./packages/stickers/animations/16546-waiting-for-ideas.gif",
                "c": "custom"
            },
            ":thumbs-up:": {
                "sn": ":thumbs-up:",
                "url": "./packages/stickers/animations/16429-thumbs-up.gif",
                "c": "custom"
            },
            ":post-it:": {
                "sn": ":post-it:",
                "url": "./packages/stickers/animations/16625-first-test-lottie.gif",
                "c": "custom"
            },
            ":light-bulb:": {
                "sn": ":light-bulb:",
                "url": "./packages/stickers/animations/16678-light-bulb.gif",
                "c": "custom"
            },
            ":closed:": {
                "sn": ":closed:",
                "url": "./packages/stickers/animations/16683-closed.gif",
                "c": "custom"
            },
            ":phone-call:": {
                "sn": ":phone-call:",
                "url": "./packages/stickers/animations/16689-phone-call.gif",
                "c": "custom"
            },
            ":loading-moov-boing:": {
                "sn": ":loading-moov-boing:",
                "url": "./packages/stickers/animations/16703-loading-moov-boing.gif",
                "c": "custom"
            },
            ":sparrow:": {
                "sn": ":sparrow:",
                "url": "./packages/stickers/animations/16731-sparrow.gif",
                "c": "custom"
            },
            ":bell-animated:": {
                "sn": ":bell-animated:",
                "url": "./packages/stickers/animations/16737-bell.gif",
                "c": "custom"
            },
            ":handshake:": {
                "sn": ":handshake:",
                "url": "./packages/stickers/animations/16750-handshake.gif",
                "c": "custom"
            },
            ":animated-mail-illustration:": {
                "sn": ":animated-mail-illustration:",
                "url": "./packages/stickers/animations/16763-animated-mail-illustration.gif",
                "c": "custom"
            },
            ":happy-birthday:": {
                "sn": ":happy-birthday:",
                "url": "./packages/stickers/animations/16765-happy-birthday.gif",
                "c": "custom"
            },
            ":forget-password:": {
                "sn": ":forget-password:",
                "url": "./packages/stickers/animations/16766-forget-password-animation.gif",
                "c": "custom"
            },
            ":stirring-into-the-sunset:": {
                "sn": ":stirring-into-the-sunset:",
                "url": "./packages/stickers/animations/16768-stirring-into-the-sunset.gif",
                "c": "custom"
            },
            ":launch-qualibrate:": {
                "sn": ":launch-qualibrate:",
                "url": "./packages/stickers/animations/16701-launch-qualibrate.gif",
                "c": "custom"
            },
            ":creative-time:": {
                "sn": ":creative-time:",
                "url": "./packages/stickers/animations/16507-creative-time.gif",
                "c": "custom"
            },
            ":liquid-loading:": {
                "sn": ":liquid-loading:",
                "url": "./packages/stickers/animations/16522-liquid-loading.gif",
                "c": "custom"
            },
            ":circle-count:": {
                "sn": ":circle-count:",
                "url": "./packages/stickers/animations/16734-circle-count.gif",
                "c": "custom"
            },
            ":wave-animated:": {
                "sn": ":wave-animated:",
                "url": "./packages/stickers/animations/16738-wave-animated.gif",
                "c": "custom"
            },
            ":super-hero-charging:": {
                "sn": ":super-hero-charging:",
                "url": "./packages/stickers/animations/16732-super-hero-charging.gif",
                "c": "custom"
            },
            /*
                author      = Corine Tea
                license     = CreativeCommon BY SA
                url
            */
            ":racoon:": {
                "sn": ":racoon:",
                "url": "./packages/stickers/racoon/icon.png",
                "c": "custom"
            },
            ":1f1b758ca110b016c962f260d2315fd3f7e81727:": {
                "sn": ":1f1b758ca110b016c962f260d2315fd3f7e81727:",
                "url": "./packages/stickers/racoon/1f1b758ca110b016c962f260d2315fd3f7e81727.png",
                "c": "custom"
            },
            ":3cd2c71f542ea65b7394c32211981c4f1b36d4d5:": {
                "sn": ":3cd2c71f542ea65b7394c32211981c4f1b36d4d5:",
                "url": "./packages/stickers/racoon/3cd2c71f542ea65b7394c32211981c4f1b36d4d5.png",
                "c": "custom"
            },
            ":3f287132e542e55492e5a909b2eedf83b3e6c475:": {
                "sn": ":3f287132e542e55492e5a909b2eedf83b3e6c475:",
                "url": "./packages/stickers/racoon/3f287132e542e55492e5a909b2eedf83b3e6c475.png",
                "c": "custom"
            },
            ":5cef0fdb9de8c7b4f4d4a61a836704b8ce8b91b8:": {
                "sn": ":5cef0fdb9de8c7b4f4d4a61a836704b8ce8b91b8:",
                "url": "./packages/stickers/racoon/5cef0fdb9de8c7b4f4d4a61a836704b8ce8b91b8.png",
                "c": "custom"
            },
            ":5d570350f5ff8f7e5f4c45b952895bdc65e490ed:": {
                "sn": ":5d570350f5ff8f7e5f4c45b952895bdc65e490ed:",
                "url": "./packages/stickers/racoon/5d570350f5ff8f7e5f4c45b952895bdc65e490ed.png",
                "c": "custom"
            },
            ":40ac00d6d3b3ad3c8711d9ad3d4913cda90a1e17:": {
                "sn": ":40ac00d6d3b3ad3c8711d9ad3d4913cda90a1e17:",
                "url": "./packages/stickers/racoon/40ac00d6d3b3ad3c8711d9ad3d4913cda90a1e17.png",
                "c": "custom"
            },
            ":42abeda5e5586d099c5e259887c0324c88cfe9f0:": {
                "sn": ":42abeda5e5586d099c5e259887c0324c88cfe9f0:",
                "url": "./packages/stickers/racoon/42abeda5e5586d099c5e259887c0324c88cfe9f0.png",
                "c": "custom"
            },
            ":066b6f96ac3b9c847bac3a73ef2bb353e245b398:": {
                "sn": ":066b6f96ac3b9c847bac3a73ef2bb353e245b398:",
                "url": "./packages/stickers/racoon/066b6f96ac3b9c847bac3a73ef2bb353e245b398.png",
                "c": "custom"
            },
            ":75bae75930e4d18004c3ae52dfbd126f8ffaf757:": {
                "sn": ":75bae75930e4d18004c3ae52dfbd126f8ffaf757:",
                "url": "./packages/stickers/racoon/75bae75930e4d18004c3ae52dfbd126f8ffaf757.png",
                "c": "custom"
            },
            ":131d0c376dc98b545d82a5f70b7df95ad079ffc7:": {
                "sn": ":131d0c376dc98b545d82a5f70b7df95ad079ffc7:",
                "url": "./packages/stickers/racoon/131d0c376dc98b545d82a5f70b7df95ad079ffc7.png",
                "c": "custom"
            },
            ":350d3713bf286f13c1ff247cd0322b3760e4f707:": {
                "sn": ":350d3713bf286f13c1ff247cd0322b3760e4f707:",
                "url": "./packages/stickers/racoon/350d3713bf286f13c1ff247cd0322b3760e4f707.png",
                "c": "custom"
            },
            ":898ece6768016790bdad3f5a81c96d24c5a4dad5:": {
                "sn": ":898ece6768016790bdad3f5a81c96d24c5a4dad5:",
                "url": "./packages/stickers/racoon/898ece6768016790bdad3f5a81c96d24c5a4dad5.png",
                "c": "custom"
            },
            ":25360adec7e13fe321fae5fecf307fafdccb1cc7:": {
                "sn": ":25360adec7e13fe321fae5fecf307fafdccb1cc7:",
                "url": "./packages/stickers/racoon/25360adec7e13fe321fae5fecf307fafdccb1cc7.png",
                "c": "custom"
            },
            ":c6f5b7e8e40cff8ede87a23d9d52c6cf05fc259d:": {
                "sn": ":c6f5b7e8e40cff8ede87a23d9d52c6cf05fc259d:",
                "url": "./packages/stickers/racoon/c6f5b7e8e40cff8ede87a23d9d52c6cf05fc259d.png",
                "c": "custom"
            },
            ":de2fabc34217d03ad8efa50afeedb22d3d3e9c40:": {
                "sn": ":de2fabc34217d03ad8efa50afeedb22d3d3e9c40:",
                "url": "./packages/stickers/racoon/de2fabc34217d03ad8efa50afeedb22d3d3e9c40.png",
                "c": "custom"
            },
            ":f7aa4efde0d916b2f18393cb60dc86f3c4e2e4bd:": {
                "sn": ":f7aa4efde0d916b2f18393cb60dc86f3c4e2e4bd:",
                "url": "./packages/stickers/racoon/f7aa4efde0d916b2f18393cb60dc86f3c4e2e4bd.png",
                "c": "custom"
            },
            /*
                author      = Timothée Jaussoin
                license     = CreativeCommon BY SA
                url         = https://edhelas.movim.eu/

            */
            ":mochi:": {
                "sn": ":mochi:",
                "url": "./packages/stickers/mochi/icon.png",
                "c": "custom"
            },
            ":3e80ebb78199b9b8b979884087e4cfd9af12aafd:": {
                "sn": ":3e80ebb78199b9b8b979884087e4cfd9af12aafd:",
                "url": "./packages/stickers/mochi/3e80ebb78199b9b8b979884087e4cfd9af12aafd.png",
                "c": "custom"
            },
            ":29f4cfaca739286f6f19477a629b89818b3cf6c9:": {
                "sn": ":29f4cfaca739286f6f19477a629b89818b3cf6c9:",
                "url": "./packages/stickers/mochi/29f4cfaca739286f6f19477a629b89818b3cf6c9.png",
                "c": "custom"
            },
            ":751c9c8e314735b5c0b0b64148ae08a5983c96c8:": {
                "sn": ":751c9c8e314735b5c0b0b64148ae08a5983c96c8:",
                "url": "./packages/stickers/mochi/751c9c8e314735b5c0b0b64148ae08a5983c96c8.png",
                "c": "custom"
            },
            ":9919c834182a683c6dc28ba3059f19376ff152ee:": {
                "sn": ":9919c834182a683c6dc28ba3059f19376ff152ee:",
                "url": "./packages/stickers/mochi/9919c834182a683c6dc28ba3059f19376ff152ee.png",
                "c": "custom"
            },
            ":a37967e78e43acdad23d41394a2dd6a345740672:": {
                "sn": ":a37967e78e43acdad23d41394a2dd6a345740672:",
                "url": "./packages/stickers/mochi/a37967e78e43acdad23d41394a2dd6a345740672.png",
                "c": "custom"
            },
            ":b93fca2188d23dd40247b83dcff7dea4fa1ba981:": {
                "sn": ":b93fca2188d23dd40247b83dcff7dea4fa1ba981:",
                "url": "./packages/stickers/mochi/b93fca2188d23dd40247b83dcff7dea4fa1ba981.png",
                "c": "custom"
            },
            ":d670caaa0e7c6104e7eddf53861593e300dd1512:": {
                "sn": ":d670caaa0e7c6104e7eddf53861593e300dd1512:",
                "url": "./packages/stickers/mochi/d670caaa0e7c6104e7eddf53861593e300dd1512.png",
                "c": "custom"
            },
            /*
                author      = Aryeom Han
                license     = CreativeCommon BY SA
                url         = http://film.zemarmot.net/
            */
            ":zemarmot:": {
                "sn": ":zemarmot:",
                "url": "./packages/stickers/zemarmot/icon.png",
                "c": "custom"
            },
            ":0e5559b02badb81113b49e73541476bf0ac85c99:": {
                "sn": ":0e5559b02badb81113b49e73541476bf0ac85c99:",
                "url": "./packages/stickers/zemarmot/0e5559b02badb81113b49e73541476bf0ac85c99.png",
                "c": "custom"
            },
            ":1ad6126ad0d904ff7948bb07cda2d10f286de904:": {
                "sn": ":1ad6126ad0d904ff7948bb07cda2d10f286de904:",
                "url": "./packages/stickers/zemarmot/1ad6126ad0d904ff7948bb07cda2d10f286de904.png",
                "c": "custom"
            },
            ":17dc10c2e8aab65b9379ea8052166e23c7c839d3:": {
                "sn": ":17dc10c2e8aab65b9379ea8052166e23c7c839d3:",
                "url": "./packages/stickers/zemarmot/17dc10c2e8aab65b9379ea8052166e23c7c839d3.png",
                "c": "custom"
            },
            ":5634554edf68a6806a7e5cd87aca8554e77ca4e2:": {
                "sn": ":5634554edf68a6806a7e5cd87aca8554e77ca4e2:",
                "url": "./packages/stickers/zemarmot/5634554edf68a6806a7e5cd87aca8554e77ca4e2.png",
                "c": "custom"
            },
            ":a0e791a78ce2275a368db103c7f9c335219902f4:": {
                "sn": ":a0e791a78ce2275a368db103c7f9c335219902f4:",
                "url": "./packages/stickers/zemarmot/a0e791a78ce2275a368db103c7f9c335219902f4.png",
                "c": "custom"
            },
            ":a1fe6c2544314eac8ab3d7660897cd98019a0f9b:": {
                "sn": ":a1fe6c2544314eac8ab3d7660897cd98019a0f9b:",
                "url": "./packages/stickers/zemarmot/a1fe6c2544314eac8ab3d7660897cd98019a0f9b.png",
                "c": "custom"
            },
            ":b9ff7bdb71a2fedad72c7c76bd536d331c7b5975:": {
                "sn": ":b9ff7bdb71a2fedad72c7c76bd536d331c7b5975:",
                "url": "./packages/stickers/zemarmot/b9ff7bdb71a2fedad72c7c76bd536d331c7b5975.png",
                "c": "custom"
            },
            ":b29fcbd8cb0c175f59854b227b9a581204e834a7:": {
                "sn": ":b29fcbd8cb0c175f59854b227b9a581204e834a7:",
                "url": "./packages/stickers/zemarmot/b29fcbd8cb0c175f59854b227b9a581204e834a7.png",
                "c": "custom"
            },
            ":c28a2a3dd5190501b33e95568ca569ce7745922c:": {
                "sn": ":c28a2a3dd5190501b33e95568ca569ce7745922c:",
                "url": "./packages/stickers/zemarmot/c28a2a3dd5190501b33e95568ca569ce7745922c.png",
                "c": "custom"
            },
            ":da6862408e387c164f0606769f909d253a3c20e3:": {
                "sn": ":da6862408e387c164f0606769f909d253a3c20e3:",
                "url": "./packages/stickers/zemarmot/da6862408e387c164f0606769f909d253a3c20e3.png",
                "c": "custom"
            },
            /*
                author      = Telegram
                license     = IANAL
                url         = https://tlgrm.eu/stickers/animals
            */
            ":animals:": {
                "sn": ":animals:",
                "url": "./packages/stickers/animals/icon.webp",
                "c": "custom"
            },
            ":CAADAgAD_AAD9HsZAAGAROatrwevYwI:": {
                "sn": ":CAADAgAD_AAD9HsZAAGAROatrwevYwI:",
                "url": "./packages/stickers/animals/CAADAgAD_AAD9HsZAAGAROatrwevYwI.webp",
                "c": "custom"
            },
            ":CAADAgAD_gAD9HsZAAGgFn-7pmHi2QI:": {
                "sn": ":CAADAgAD_gAD9HsZAAGgFn-7pmHi2QI:",
                "url": "./packages/stickers/animals/CAADAgAD_gAD9HsZAAGgFn-7pmHi2QI.webp",
                "c": "custom"
            },
            ":CAADAgAD3gAD9HsZAAG9he9u98XOPQI:": {
                "sn": ":CAADAgAD3gAD9HsZAAG9he9u98XOPQI:",
                "url": "./packages/stickers/animals/CAADAgAD3gAD9HsZAAG9he9u98XOPQI.webp",
                "c": "custom"
            },
            ":CAADAgAD4AAD9HsZAAEs6yhXXpXjMAI:": {
                "sn": ":CAADAgAD4AAD9HsZAAEs6yhXXpXjMAI:",
                "url": "./packages/stickers/animals/CAADAgAD4AAD9HsZAAEs6yhXXpXjMAI.webp",
                "c": "custom"
            },
            ":CAADAgAD4gAD9HsZAAE9rzigueyUFwI:": {
                "sn": ":CAADAgAD4gAD9HsZAAE9rzigueyUFwI:",
                "url": "./packages/stickers/animals/CAADAgAD4gAD9HsZAAE9rzigueyUFwI.webp",
                "c": "custom"
            },
            ":CAADAgAD5AAD9HsZAAFaKa3EnzffbgI:": {
                "sn": ":CAADAgAD5AAD9HsZAAFaKa3EnzffbgI:",
                "url": "./packages/stickers/animals/CAADAgAD5AAD9HsZAAFaKa3EnzffbgI.webp",
                "c": "custom"
            },
            ":CAADAgAD5gAD9HsZAAEpY_LdZMK5mwI:": {
                "sn": ":CAADAgAD5gAD9HsZAAEpY_LdZMK5mwI:",
                "url": "./packages/stickers/animals/CAADAgAD5gAD9HsZAAEpY_LdZMK5mwI.webp",
                "c": "custom"
            },
            ":CAADAgAD6AAD9HsZAAHJzCUQLTfb0wI:": {
                "sn": ":CAADAgAD6AAD9HsZAAHJzCUQLTfb0wI:",
                "url": "./packages/stickers/animals/CAADAgAD6AAD9HsZAAHJzCUQLTfb0wI.webp",
                "c": "custom"
            },
            ":CAADAgAD6gAD9HsZAAFjsXea7HRT1wI:": {
                "sn": ":CAADAgAD6gAD9HsZAAFjsXea7HRT1wI:",
                "url": "./packages/stickers/animals/CAADAgAD6gAD9HsZAAFjsXea7HRT1wI.webp",
                "c": "custom"
            },
            ":CAADAgAD7AAD9HsZAAGRcHC9ECtEJQI:": {
                "sn": ":CAADAgAD7AAD9HsZAAGRcHC9ECtEJQI:",
                "url": "./packages/stickers/animals/CAADAgAD7AAD9HsZAAGRcHC9ECtEJQI.webp",
                "c": "custom"
            },
            ":CAADAgAD7gAD9HsZAAGIBy8PT-glrAI:": {
                "sn": ":CAADAgAD7gAD9HsZAAGIBy8PT-glrAI:",
                "url": "./packages/stickers/animals/CAADAgAD7gAD9HsZAAGIBy8PT-glrAI.webp",
                "c": "custom"
            },
            ":CAADAgAD8AAD9HsZAAEuvf-jtAjUeQI:": {
                "sn": ":CAADAgAD8AAD9HsZAAEuvf-jtAjUeQI:",
                "url": "./packages/stickers/animals/CAADAgAD8AAD9HsZAAEuvf-jtAjUeQI.webp",
                "c": "custom"
            },
            ":CAADAgAD8gAD9HsZAAE7OFplJCHoYAI:": {
                "sn": ":CAADAgAD8gAD9HsZAAE7OFplJCHoYAI:",
                "url": "./packages/stickers/animals/CAADAgAD8gAD9HsZAAE7OFplJCHoYAI.webp",
                "c": "custom"
            },
            ":CAADAgAD9AAD9HsZAAGn8n8DlAtW1wI:": {
                "sn": ":CAADAgAD9AAD9HsZAAGn8n8DlAtW1wI:",
                "url": "./packages/stickers/animals/CAADAgAD9AAD9HsZAAGn8n8DlAtW1wI.webp",
                "c": "custom"
            },
            ":CAADAgAD9gAD9HsZAAFeYY-ltPYnrAI:": {
                "sn": ":CAADAgAD9gAD9HsZAAFeYY-ltPYnrAI:",
                "url": "./packages/stickers/animals/CAADAgAD9gAD9HsZAAFeYY-ltPYnrAI.webp",
                "c": "custom"
            },
            ":CAADAgAD-AAD9HsZAAELURd6t1046QI:": {
                "sn": ":CAADAgAD-AAD9HsZAAELURd6t1046QI:",
                "url": "./packages/stickers/animals/CAADAgAD-AAD9HsZAAELURd6t1046QI.webp",
                "c": "custom"
            },
            ":CAADAgADaAEAAvR7GQAB8LLElrB2gvwC:": {
                "sn": ":CAADAgADaAEAAvR7GQAB8LLElrB2gvwC:",
                "url": "./packages/stickers/animals/CAADAgADaAEAAvR7GQAB8LLElrB2gvwC.webp",
                "c": "custom"
            },
            ":CAADAgADAgEAAvR7GQABFQXs6L_5I4AC:": {
                "sn": ":CAADAgADAgEAAvR7GQABFQXs6L_5I4AC:",
                "url": "./packages/stickers/animals/CAADAgADAgEAAvR7GQABFQXs6L_5I4AC.webp",
                "c": "custom"
            },
            ":CAADAgADawEAAvR7GQABpPx74Khr8fAC:": {
                "sn": ":CAADAgADawEAAvR7GQABpPx74Khr8fAC:",
                "url": "./packages/stickers/animals/CAADAgADawEAAvR7GQABpPx74Khr8fAC.webp",
                "c": "custom"
            },
            ":CAADAgADBAEAAvR7GQABgBHkQCvGnPsC:": {
                "sn": ":CAADAgADBAEAAvR7GQABgBHkQCvGnPsC:",
                "url": "./packages/stickers/animals/CAADAgADBAEAAvR7GQABgBHkQCvGnPsC.webp",
                "c": "custom"
            },
            ":CAADAgADCwEAAvR7GQABuArOzKHFjusC:": {
                "sn": ":CAADAgADCwEAAvR7GQABuArOzKHFjusC:",
                "url": "./packages/stickers/animals/CAADAgADCwEAAvR7GQABuArOzKHFjusC.webp",
                "c": "custom"
            },
            ":CAADAgADDQEAAvR7GQABJ6-MCHZ-F9AC:": {
                "sn": ":CAADAgADDQEAAvR7GQABJ6-MCHZ-F9AC:",
                "url": "./packages/stickers/animals/CAADAgADDQEAAvR7GQABJ6-MCHZ-F9AC.webp",
                "c": "custom"
            },
            ":CAADAgADDwEAAvR7GQABZvQ5FANUzPQC:": {
                "sn": ":CAADAgADDwEAAvR7GQABZvQ5FANUzPQC:",
                "url": "./packages/stickers/animals/CAADAgADDwEAAvR7GQABZvQ5FANUzPQC.webp",
                "c": "custom"
            },
            ":CAADAgADEQEAAvR7GQAB9Z8_9pjIWdAC:": {
                "sn": ":CAADAgADEQEAAvR7GQAB9Z8_9pjIWdAC:",
                "url": "./packages/stickers/animals/CAADAgADEQEAAvR7GQAB9Z8_9pjIWdAC.webp",
                "c": "custom"
            },
            ":CAADAgADEwEAAvR7GQABJAAB42sVdmNCAg:": {
                "sn": ":CAADAgADEwEAAvR7GQABJAAB42sVdmNCAg:",
                "url": "./packages/stickers/animals/CAADAgADEwEAAvR7GQABJAAB42sVdmNCAg.webp",
                "c": "custom"
            },
            ":CAADAgAD-gAD9HsZAAFIcnEWg1x0yAI:": {
                "sn": ":CAADAgAD-gAD9HsZAAFIcnEWg1x0yAI:",
                "url": "./packages/stickers/animals/CAADAgAD-gAD9HsZAAFIcnEWg1x0yAI.webp",
                "c": "custom"
            },
            ":CAADAgADPQEAAvR7GQABTAIrXSxZ6IAC:": {
                "sn": ":CAADAgADPQEAAvR7GQABTAIrXSxZ6IAC:",
                "url": "./packages/stickers/animals/CAADAgADPQEAAvR7GQABTAIrXSxZ6IAC.webp",
                "c": "custom"
            },
            ":CAADAgADPwEAAvR7GQABViioNKnM2JoC:": {
                "sn": ":CAADAgADPwEAAvR7GQABViioNKnM2JoC:",
                "url": "./packages/stickers/animals/CAADAgADPwEAAvR7GQABViioNKnM2JoC.webp",
                "c": "custom"
            },
            ":CAADAgADQQEAAvR7GQABUVl1xePX3vcC:": {
                "sn": ":CAADAgADQQEAAvR7GQABUVl1xePX3vcC:",
                "url": "./packages/stickers/animals/CAADAgADQQEAAvR7GQABUVl1xePX3vcC.webp",
                "c": "custom"
            },
            ":CAADAgADQwEAAvR7GQABHefwRWSx0_IC:": {
                "sn": ":CAADAgADQwEAAvR7GQABHefwRWSx0_IC:",
                "url": "./packages/stickers/animals/CAADAgADQwEAAvR7GQABHefwRWSx0_IC.webp",
                "c": "custom"
            },
            ":CAADAgADSQEAAvR7GQABDrDY6YiA_i8C:": {
                "sn": ":CAADAgADSQEAAvR7GQABDrDY6YiA_i8C:",
                "url": "./packages/stickers/animals/CAADAgADSQEAAvR7GQABDrDY6YiA_i8C.webp",
                "c": "custom"
            },
            ":CAADAgADZAEAAvR7GQABZ-mj7zufay8C:": {
                "sn": ":CAADAgADZAEAAvR7GQABZ-mj7zufay8C:",
                "url": "./packages/stickers/animals/CAADAgADZAEAAvR7GQABZ-mj7zufay8C.webp",
                "c": "custom"
            },
            ":CAADAgADZgEAAvR7GQAB3WSSiurRjc0C:": {
                "sn": ":CAADAgADZgEAAvR7GQAB3WSSiurRjc0C:",
                "url": "./packages/stickers/animals/CAADAgADZgEAAvR7GQAB3WSSiurRjc0C.webp",
                "c": "custom"
            },
            ":CAADAgAEAQAC9HsZAAH0ZLAK5J-OegI:": {
                "sn": ":CAADAgAEAQAC9HsZAAH0ZLAK5J-OegI:",
                "url": "./packages/stickers/animals/CAADAgAEAQAC9HsZAAH0ZLAK5J-OegI.webp",
                "c": "custom"
            }
        }

        converse.emojis.by_sn = Object.keys(converse.emojis.json).reduce((result, cat) => Object.assign(result, converse.emojis.json[cat]), {});
        converse.emojis.list = Object.values(converse.emojis.by_sn);
        converse.emojis.list.sort((a, b) => a.sn < b.sn ? -1 : a.sn > b.sn ? 1 : 0);
        converse.emojis.shortnames = converse.emojis.list.map(m => m.sn);
        const getShortNames = () => converse.emojis.shortnames.map(s => s.replace(/[+]/g, "\\$&")).join('|');
        converse.emojis.shortnames_regex = new RegExp(getShortNames(), "gi");
		converse.emojis.toned = unique(Object.values(converse.emojis.json.people).filter(person => person.sn.includes('_tone')).map(person => person.sn.replace(/_tone[1-5]/, '')));
		converse.emojis.initialized_promise.resolve();				
    }
}));
