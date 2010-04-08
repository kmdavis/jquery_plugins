/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * Formatter plugin
 *
 * @version 1.0
 * @requires jQuery v1.3
 * @author Kevan Davis
 * @copyright Copyright (c) 2010, Gilt Groupe
 *
 * Distributed under the terms of the GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 */
(function ($) {
  $.formatter = {
    defaults: {
      creditcard: {
        stripRegex: /\D/g,
        fillEmptyDigits: false,
        types: [
          {
            name: "Test",
            digits: 13,
            prefix: /^(4222222222222)$/,
            groupRegex: /([\d_\*])([\d_\*]{3})([\d_\*]{3})([\d_\*]{3})([\d_\*]{3})/,
            groupReplace: "$1 $2 $3 $4 $5"
          },
          {
            name: "Visa",
            digits: 16,
            prefix: /^(4)/,
            groupRegex: /([\d_\*]{4})([\d_\*]{4})([\d_\*]{4})([\d_\*]{4})/,
            groupReplace: "$1 $2 $3 $4"
          },
          {
            name: "Master Card",
            digits: 16,
            prefix: /^(5[1-5])/,
            groupRegex: /([\d_\*]{4})([\d_\*]{4})([\d_\*]{4})([\d_\*]{4})/,
            groupReplace: "$1 $2 $3 $4"
          },
          {
            name: "Discover",
            digits: 16,
            prefix: /^(6011|65)/,
            groupRegex: /([\d_\*]{4})([\d_\*]{4})([\d_\*]{4})([\d_\*]{4})/,
            groupReplace: "$1 $2 $3 $4"
          },
          {
            name: "American Express",
            digits: 15,
            prefix: /^(34|37)/,
            groupRegex: /([\d_\*]{4})([\d_\*]{6})([\d_\*]{5})/,
            groupReplace: "$1 $2 $3"
          },
          {
            name: "Diner's Club",
            digits: 14,
            prefix: /^(30[0-5]|36|38)/,
            groupRegex: /([\d_\*]{4})([\d_\*]{5})([\d_\*]{5})/, // ? TODO -- this is a guesstimate
            groupReplace: "$1 $2 $3"
          },
          {
            name: "JCB",
            digits: 16,
            prefix: /^(3)/,
            groupRegex: /([\d_\*]{4})([\d_\*]{4})([\d_\*]{4})([\d_\*]{4})/,
            groupReplace: "$1 $2 $3 $4"
          },
          {
            name: "JCB",
            digits: 15,
            prefix: /^(2131|1800)/,
            groupRegex: /([\d_\*]{4})([\d_\*]{6})([\d_\*]{5})/,
            groupReplace: "$1 $2 $3"
          },
          {
            name: "Enroute",
            digits: 15,
            prefix: /^(2014|2149)/,
            groupRegex: /([\d_\*]{4})([\d_\*]{6})([\d_\*]{5})/,
            groupReplace: "$1 $2 $3"
          },
          { // default, must be last
            name: "Unknown",
            digits: 16,
            prefix: /^/,
            groupRegex: /([\d_\*]{4})([\d_\*]{4})([\d_\*]{4})([\d_\*]{4})/,
            groupReplace: "$1 $2 $3 $4"
          }
        ]
      },
      phone: {
        fillEmptyDigits: false,
        types: [
          {
            name: "Japan",
            digits: 10,
            prefix: /^(\+81)/,
            preStripRegex: /[A-Za-z\s\(\)\-\*]/g,
            groupRegex: /(\+81)([\d_\*]{0,2})([\d_\*]{0,4})([\d_\*]{0,4})([\d_\*]*)/,
            groupReplace: "$1-$2-$3-$4-$5",
            postStripRegex: /( ?\-|\)|\()$/g,
            trimRegex: /^ /
          },
          {
            name: "North America",
            digits: 10,
            prefix: /^(\+?1)|^\d|^\(/,
            preStripRegex: /[A-Za-z\s\(\)\-\*]/g,
            groupRegex: /(\+?1?)([\d_\*]{0,3})([\d_\*]{0,3})([\d_\*]{0,4})([\d_\*]*)/,
            groupReplace: "$1 ($2) $3-$4 x$5",
            postStripRegex: /( x| ?\-|\)|\()$/g,
            fix: [
              {
                regex: /\(([\d_\*][\d_\*][\d_\*])$/,
                replace: "($1)"
              },
              {
                regex: /\ ([\d_\*][\d_\*][\d_\*])$/,
                replace: " $1-"
              }
            ],
            trimRegex: /^ /
          }
        ]
      },
      commas: {
        stripRegex: /,/g,
        groupsOf: 3,
        groupRegex: function(n) { return new RegExp("(?!^)(\\d{" + n + "})(?=(\\d{" + n + "})*$)", "g"); },
        groupReplace: "$1",
        groupDelimiter: ",",
        decimalDelimiter: ".",
        insertCommasOnLeftSide: true,
        insertCommasOnRightSide: false
      },
      currency: {
        types: [ // default is the first currency type
          {
            name: "USD",
            symbol: "$",
            symbolAtBeginning: true,
            show0cents: false,
            commasEvery: 3,
            comma: ",",
            maxDecimal: 2,
            decimal: ".",
            negativeIndicators: ["-", "", "", ""]
          }
        ]
      }
    }
  };

  $.formatter.creditcard = function (string, options) {
    var settings = $.extend({}, $.formatter.defaults.creditcard, options), type, i;
    string = string.replace(settings.stripRegex, "");
    if (0 !== string.length) {
      for (i = 0, type = null; i < settings.types.length && null === type; i += 1) {
        if (settings.types[i].prefix.test(string)) {
          type = settings.types[i];
        }
      }
      for (i = string.length; i < type.digits; i += 1) {
        string += settings.fillEmptyDigits ? "*" : "_";
      }
      return string.replace(type.groupRegex, type.groupReplace).replace(/_/g, "").replace(/\s+$/, "");
    }
    return "";
  };

  $.formatter.phone = function (string, options) {
    var settings = $.extend({}, $.formatter.defaults.phone, options), type, i, fill_length;
    if (0 !== string.length) {
      for (i = 0, type = null; i < settings.types.length && null === type; i += 1) {
        if (settings.types[i].prefix.test(string)) {
          type = settings.types[i];
        }
      }
      string = string.replace(type.preStripRegex, "");

      fill_length = (string.match(type.prefix)[1] || "").length + type.digits;

      for (i = string.length; i < fill_length; i += 1) {
        string += settings.fillEmptyDigits ? "*" : "_";
      }

      string = string.replace(type.groupRegex, type.groupReplace)
                     .replace(type.postStripRegex, "");

      if (type.hasOwnProperty("fix")) {
        for (i = 0; i < type.fix.length; i += 1) {
          string = string.replace(type.fix[i].regex, type.fix[i].replace);
        }
      }

      string = string.replace(type.trimRegex, "")
                     .replace(/_/g, "");

      return string;
    }
    return "";
  };

  $.formatter.commas = function (string, options) {
    var settings = $.extend({}, $.formatter.defaults.commas, options),
      sides = string.replace(settings.stripRegex, "").split(settings.decimalDelimiter);
    if (settings.insertCommasOnLeftSide) {
      sides[0] = sides[0].replace(settings.groupRegex(settings.groupsOf), settings.groupDelimiter + settings.groupReplace);
    }
    if (settings.insertCommasOnRightSide && 2 === sides.length) {
      sides[1] = sides[1]
        .split("").reverse().join("")
        .replace(settings.groupRegex(settings.groupsOf), settings.groupDelimiter + settings.groupReplace)
        .split("").reverse().join("");
    }
    if (1 === sides.length) {
      return sides[0];
    } else {
      return sides[0] + settings.decimalDelimiter + sides[1];
    }
  };

  $.formatter.currency = function (string, options) {
    var settings = $.extend({}, $.formatter.defaults.currency, options), i, type = null, isNegative = false, cents;
    string = string.toString();
    if (0 !== string.length) {
      for (i = 0, type = null; i < settings.types.length && null === type; i += 1) {
        if (-1 !== string.indexOf(settings.types[i].symbol) || -1 !== string.indexOf(settings.types[i].name)) {
          type = settings.types[i];
        }
      }
      if (null === type) {
        type = settings.types[0]; // US Dollars
      }
      string = string.replace(type.symbol, "").replace(type.comma, "");

      for (i = 0; i < type.negativeIndicators.length; i += 1) {
        if ("" !== type.negativeIndicators[i] && -1 !== string.indexOf(type.negativeIndicators[i])) {
          isNegative = true;
        }
      }

      if (isNaN(string)) {
        string = "0";
      }

      string = Math.abs(parseInt(string));

      if (0 > string) {
        isNegative = true;
      }

      cents = Math.floor((string * 100 + 0.5) % 100).toString();
      string = Math.floor((string * 100 + 0.5) / 100).toString();

      while (cents.length < type.maxDecimal) {
        cents = "0" + cents;
      }

      if (type.show0cents || 0 !== parseInt(cents, 10)) {
        string = string + type.decimal + cents;
      }

      string = $.formatter.commas(string, {
        groupsOf: type.commasEvery,
        groupDelimiter: type.comma,
        decimalDelimiter: type.decimal
      });

      if (isNegative) {
        string = type.negativeIndicators[0] + (type.symbolAtBeginning ? type.symbol : "") + type.negativeIndicators[1] + string + type.negativeIndicators[2] + (type.symbolAtBeginning ? "" : type.symbol) + type.negativeIndicators[3];
      } else {
        string = (type.symbolAtBeginning ? type.symbol : "") + string + (type.symbolAtBeginning ? "" : type.symbol);
      }

      return string;
    }
    return "";
  };

  $.fn.format = function (formatter, options) { // might have a namespace collision with $.format (validation plugin)
    if (!$.isFunction(formatter)) {
      options = formatter;
      formatter = null;
    }
    this.each(function () {
      var $this = $(this), f = formatter, newVal;
      if (!$.isFunction(f)) {
        for (f in $.formatter) {
          if ("defaults" !== f && $.formatter.hasOwnProperty(f) && $.isFunction($.formatter[f])) {
            if ($this.hasClass(f) || $this.attr("data-formatter") === f) {
              f = $.formatter[f];
              break;
            }
          }
        }
      }
      if ("" !== $this.val()) {
        newVal = f($this.val(), options);
        if (newVal !== $this.val()) {
          $this.val(newVal);
        }
      } else if ("" !== $this.html()) {
        newVal = f($this.html(), options);
        if (newVal !== $this.html()) {
          $this.html(newVal);
        }
      }
    });
    return this;
  };

  $.fn.formatAsYouType = function (formatter, options) {
    if ($.fn.hasOwnProperty("caret")) {
      this.each(function () {
        $(this).keyup(function (ev) {
          if (48 <= ev.keyCode && 57 >= ev.keyCode) { // only triggers on numbers
            var caret = $(this).caret(), len = $(this).val().length;

            $(this).format(formatter, options);

            if (caret < len) {
              $(this).caret(caret);
            }
          }
        });
      });
    }
    return this;
  };
}(jQuery));