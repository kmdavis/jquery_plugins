/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * Capitalize
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
  $.capitalize = function (str, options) {
    var settings = $.extend({}, $.capitalize.defaults, options),
      final_string = "",
      words = str.toLowerCase().split(" "),
      i = 0,
      max = words.length;
    while (i < max) {
      final_string += " ";
      if (/^(\w\.)+$/.test(words[i])) {
        if (settings.capitalizeAbbreviations) {
          final_string += words[i].toUpperCase();
        } else {
          final_string += words[i];
        }
      } else if (-1 !== $.inArray(words[i], settings.wordsToAllCap)) {
        final_string += words[i].toUpperCase();
      } else if ((settings.capitalizeFirstWord && 0 === i) ||
                 (settings.capitalizeLastWord && max - 1 === i) ||
                 -1 === $.inArray(words[i], settings.wordsNotToCapitalize)) {
        final_string += words[i].charAt(0).toUpperCase() + words[i].substr(1);
      } else {
        final_string += words[i];
      }
      i += 1;
    }
    return final_string.substring(1);
  };

  $.capitalize.defaults = {
    capitalizeFirstWord: true,
    capitalizeLastWord: true,
    capitalizeAbbreviations: true,
    wordsNotToCapitalize: [
      "at", "by", "down", "for", "from", "in", "into", "like", "near", "of", "off", "on", "onto", "over", "past", "to", "upon", "with", // prepositions
      "and", "but", "or", "yet", "for", "nor", "so", "as", "if", "once", "than", "that", "till", "when", // conjunctions
      "a", "an", "the" // articles
    ], // NOTE: this is not a complete list.
    wordsToAllCap: []
  };

  $.fn.capitalize = function (options) {
    this.each(function () {
      var val, $this = $(this);
      if ("" !== $this.val()) {
        val = $.capitalize($this.val(), options);
        if ($this.val() !== val) {
          $this.val(val);
        }
      } else if ("" !== $this.html()) {
        val = $.capitalize($this.html(), options);
        if ($this.html() !== val) {
          $this.html(val);
        }
      }
    });
    return this;
  };
}(jQuery));
