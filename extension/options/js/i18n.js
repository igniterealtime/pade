//
// Copyright (c) 2011 Frank Kohlhepp
// https://github.com/frankkohlhepp/fancy-settings
// License: LGPL v2.1
//
(function () {
    if (this.i18n === undefined) { this.i18n = {}; }

    this.i18n.get = function (str)
    {
        return chrome.i18n.getMessage(str) || str;
    };
}());
