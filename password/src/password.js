/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * Password Meter
 *
 * @version 1.0
 * @requires jQuery v1.3
 * @author Kevan Davis
 * @copyright Copyright (c) 2010, Gilt Groupe
 */
(function ($) {
  var proxyCallback = function (rating, callback, perfect, settings) {
    var expectedRatings = settings.rules.length, multiplier = 1;
    return function (score) {
      expectedRatings -= 1;
      multiplier *= score.multiplier;
      rating.scores.push(score);
      rating.score += score.value;
      if (0 === expectedRatings) {
        rating.score *= multiplier;
        rating.percent = rating.score === 0 ? 0 : rating.score / perfect;
        callback(rating);
      }
    }
  };

  $.ratePassword = function (password, callback, options) {
    var settings = $.extend({}, $.ratePassword.defaults, options), i,
      rating = { scores: [], score: 0, percent: 0},
      proxiedCallback = proxyCallback(rating, callback, settings.perfect(password.length), settings);
    if (password.length >= settings.minlength) {
      for (i = 0; i < settings.rules.length; i += 1) {
        settings.rules[i](password, proxiedCallback);
      }
    }
    return this;
  };

  $.fn.ratePassword = function (callback, options) {
    var settings = $.extend({}, $.ratePassword.defaults, options);
    return $.ratePassword($(this).val(), callback, options);
  };

  $.fn.ratePasswordAsYouType = function (options) {
    var settings = $.extend({}, $.ratePassword.defaults, options);
    if ($.fn.hasOwnProperty("caret")) {
      this.each(function () {

        $(this).keyup(function (ev) {
          var caret = $(this).caret(), len = $(this).val().length, rating, val = $(this).val(), display = "", i;
          if (settings.obscurePasswordWithJS) {
            if (!$(this).data(settings.dataValueKey)) {
              val = $(this).val();
            } else {
              val = $(this).data(settings.dataValueKey);

              if (len > 0) {
                if (33 <= ev.keyCode && 126 >= ev.keyCode) {
                  if ($(this).val()[caret - 1] !== settings.fillCharacter) {
                    val = (val.substr(0, caret - 1) || "") + ($(this).val()[caret - 1] || "") + (val.substr(caret - 1) || "");
                  }
                }
                if (val.length > len) {
                  if (8 !== ev.keyCode && 46 !== ev.keyCode) {
                    return; // can get delayed keyup events if you type fast
                  } else {
                    if (8 === ev.keyCode) { // backspace
                      val = val.substr(0, caret) + val.substr(caret + 1); // TODO: verify this in IE
                    } else if (46 === ev.keyCode) { // delete
                      val = val.substr(0, caret) + val.substr(caret + 2); // TODO: verify this in IE
                    }
                  }
                }
              } else {
                val = "";
              }
            }

            $(this).data(settings.dataValueKey, val);

            if (len > 0) {
              for (i = 1; i < caret; i += 1) {
                display += settings.fillCharacter;
              }
              display += (val[caret - 1] || "");
              for (; i < len; i += 1) {
                display += settings.fillCharacter;
              }
            }
            $(this).val(display || "");

            if (caret < len) {
              $(this).caret(caret);
            }
          }

          $.ratePassword(val, function (rating) {
            if (settings.update) {
              settings.update.call(this, rating);
            }
            $(this).trigger(settings.updateEvent, rating);

          }, options);
        });
        if (settings.obscurePasswordWithJS) {
          $(this)
            .blur(function () {
              var len = $(this).val().length, i, display = "";
              for (i = 0; i < len; i += 1) {
                display += settings.fillCharacter;
              }
              $(this).val(display);
            });
        }
      });
    }
    return this;
  };

  $.ratePassword.defaults = {
    minlength: 8,
    dataValueKey: "rate-password-value",
    fillCharacter: "*",
    obscurePasswordWithJS: true,
    updateEvent: "rate-password-event",
    perfect: function(len) {
      return len < 8 ? 0 : len < 11 ? len * 16 - 36 : (len - 1) * 14;
    },
    rules: [
      function (a, callback) {
        callback({ key: "Number of characters", value: a.length * 4, multiplier: 1 });
      },
      function (a, callback) {
        var n = (a.match(/[A-Z]/g) || []).length;
        callback({ key: "Number of uppercase characters", value: n === 0 || n === a.length ? 0 : (a.length - n) * 2, multiplier: 1 });
      },
      function (a, callback) {
        var n = (a.match(/[a-z]/g) || []).length;
        callback({ key: "Number of lowercase characters", value: n === 0 || n === a.length ? 0 : (a.length - n) * 2, multiplier: 1 });
      },
      function (a, callback) {
        var n = (a.match(/\d/g) || []).length;
        callback({ key: "Number of numbers", value: n === 0 || n === a.length ? 0 : n * 4, multiplier: 1 });
      },
      function (a, callback) {
        callback({ key: "Number of symbols", value: (a.match(/[\W_]/g) || []).length * 6, multiplier: 1 });
      },
      function (a, callback) {
        callback({ key: "Middle numbers or symbols", value: (a.slice(1, a.length - 1).match(/[\d\W_]/g) || []).length * 2, multiplier: 1 });
      },
      function (a, callback) {
        var n = (a.match(/[a-z]/) || []).length + (a.match(/[A-Z]/) || []).length + (a.match(/\d/) || []).length + (a.match(/[\W_]/) || []).length; 
        callback({ key: "Requirements", value: n * 2, multiplier: n < 3 ? 0 : 1 });
      },
      function (a, callback) {
        callback({ key: "Letters only", value: -(a.match(/^[a-z]+$/i) || [""])[0].length, multiplier: 1 });
      },
      function (a, callback) {
        callback({ key: "Numbers only", value: -(a.match(/^\d+$/i) || [""])[0].length, multiplier: 1 });
      },
      function (a, callback) {
        var n = (a.match(/([a-z])(?=[^\1]*\1)/gi) || []).length;
        callback({ key: "Repeat characters (case insensitive)", value: -(n * (n - 1)), multiplier: 1 });
      },
      function (a, callback) {
        var n = a.match(/[A-Z][A-Z]+/g) || ["A"];
        n = n.join("").length - n.length;
        callback({ key: "Consecutive uppercase letters", value: n * -2, multiplier: 1 });
      },
      function (a, callback) {
        var n = a.match(/[a-z][a-z]+/g) || ["a"];
        n = n.join("").length - n.length;
        callback({ key: "Consecutive lowercase letters", value: n * -2, multiplier: 1 });
      },
      function (a, callback) {
        var n = a.match(/\d\d+/g) || ["1"];
        n = n.join("").length - n.length;
        callback({ key: "Consecutive numbers", value: n * -2, multiplier: 1 });
      },
      function (a, callback) {
        var n = a.match(/[\W_][\W_]+/g) || ["1"];
        n = n.join("").length - n.length;
        callback({ key: "Consecutive symbols", value: n * -2, multiplier: 1 });
      },
      function (a, callback) {
        var potentials = a.match(/[a-z][a-z][a-z]+|[A-Z][A-Z][A-Z]+/g), val = 0, i, j, last, v;
        if (potentials) {
          for (i = 0; i < potentials.length; i += 1) {
            for (j = 2, last = 1; j < potentials[i].length; j += 1) {
              v = potentials[i].charCodeAt(j);
              if ((v === potentials[i].charCodeAt(j - 1) + 1 && v === potentials[i].charCodeAt(j - 2) + 2) ||
                  (v === potentials[i].charCodeAt(j - 1) - 1 && v === potentials[i].charCodeAt(j - 2) - 2)) {
                val += j - last;
                last = j;
              }
            }
          }
        }
        callback({ key: "Sequential letters (3+)", value: val * -3, multiplier: 1 });
      },
      function (a, callback) {
        var potentials = a.match(/\d\d\d+/g), val = 0, i, j, last, v;
        if (potentials) {
          for (i = 0; i < potentials.length; i += 1) {
            for (j = 2, last = 1; j < potentials[i].length; j += 1) {
              v = parseInt(potentials[i][j], 10);
              if ((v === parseInt(potentials[i][j - 1], 10) + 1 && v === parseInt(potentials[i][j - 2], 10) + 2) ||
                  (v === parseInt(potentials[i][j - 1], 10) - 1 && v === parseInt(potentials[i][j - 2], 10) - 2)) {
                val += j - last;
                last = j;
              }
            }
          }
        }
        callback({ key: "Sequential numbers (3+)", value: val * -3, multiplier: 1 });
      }
    ]
  };
}(jQuery));