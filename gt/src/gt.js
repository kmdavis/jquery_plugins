/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * GT Plugin
 *
 * @version 1.0
 * @requires jQuery v1.3
 * @author Kevan Davis
 * @copyright Copyright (c) 2010, Gilt Groupe
 *
 * Distributed under the terms of the GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * @description : translates text strings
 *
 * @usage :
 * load translations using $.gt.load
 *   $.gt.load({
 *     "original string" : "translated string"
 *   });
 *   $.gt.load("url/to/json", callback);
 *
 * use translations
 *   $.gt("original string")
 *   $("#label").gt() // translates the html contents of the element(s)
 *
 * gt also supports string interpolation:
 *   $.gt("{0} you", "hey") === "hey you"
 *   $.gt("hello {name}", {name: "world"}) === "hello world"
 *
 * there are also a few optional logging features that you can turn on (expect a performance hit if you do, however)
 */
(function ($) {
  var data = {}, cacheMisses = false, cacheHits = false, loadedUrls = [];
  $.gt = function (string) {
    if (data.hasOwnProperty(string)) {
      if (!cacheHits.hasOwnProperty(string)) {
        cacheHits[string] = 0;
      }
      cacheHits[string] += 1;
      string = data[string];
    } else if (false !== cacheMisses) {
      if (!cacheMisses.hasOwnProperty(string)) {
        cacheMisses[string] = 0;
      }
      cacheMisses[string] += 1;
    }
    if (1 < arguments.length) {
      var args = $.makeArray(arguments), key;
      if (2 === args.length && args[1] instanceof Object) {
        args = args[1];
      } else {
        args.splice(0, 1);
      }
      for (key in args) {
        if (args.hasOwnProperty(key)) {
          string = string.replace(new RegExp("\\{" + key + "\\}", "g"), args[key]);
        }
      }
    }
    return string;
  };
  $.gt.load = function (translations, callback) {
    if (translations instanceof Object) {
      $.extend(data, translations);
      if (callback) {
        callback();
      }
    } else if ("string" === typeof(translations)) {
      if (-1 !== $.inArray(translations, loadedUrls)) {
        if (callback) {
          callback();
        }
      } else {
        $.getJSON(translations, function (response) {
          $.extend(data, response);
          if (callback) {
            callback();
          }
        });
      }
    }
  };
  $.gt.logMissingTranslations = function () {
    cacheMisses = {};
  };
  $.gt.missingTranslations = function () {
    return cacheMisses;
  };
  $.gt.logUsedTranslations = function () {
    cacheHits = {};
  };
  $.gt.usedTranslations = function () {
    return cacheHits;
  };
  $.gt.unusedTranslations = function () {
    var unusedTranslations = [], i;
    for (i in data) {
      if (data.hasOwnProperty(i) && !cacheHits.hasOwnProperty(i)) {
        unusedTranslations.push(i);
      }
    }
    return unusedTranslations;
  };
  $.fn.gt = function () {
    $.each(this, function () {
      $(this).html($.gt($(this).html()));
    });
    return this;
  };
}(jQuery));
