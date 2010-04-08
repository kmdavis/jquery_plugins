/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * Start/End of Line Selectors
 *
 * @version 0.9
 * @requires jQuery v1.3
 * @author: Kevan Davis (kdavis@gilt.com)
 * @copyright Copyright (c) 2009, Gilt Groupe
 *
 * Distributed under the terms of the GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 **/
(function ($) {
  $.extend($.fn, {
    startOfLine: function (strict) {
      var elements = this,
        targets = [],
        i = 0,
        max = elements.length,
        el, el_top, sibs, j, end, target, candidate, c_bottom, c_top;

      while (i < max) {
        el = $(elements[i]);
        el_top = el.offset().top - parseInt(el.css("margin-top").replace(/px/i, ''), 10);
        sibs = el.prevAll();
        j = 0;
        end = sibs.length;
        target = el;

        while (j < end) {
          candidate = sibs.eq(j);
          c_bottom = candidate.offset().top + candidate.height() + parseInt(candidate.css("margin-bottom").replace(/px/i, ''), 10);
          if (el_top <= c_bottom) {
            if (strict) {
              c_top = candidate.offset().top - parseInt(candidate.css("margin-top").replace(/px/i, ''), 10);
              if (c_top >= el_top) {
                target = candidate;
              }
            } else {
              target = candidate;
            }
          }
          j += 1;
        }
        targets.push(target.get(0));
        i += 1;
      }
      return $(targets);
    },
    endOfLine: function (strict) {
      var elements = this,
        targets = [],
        i = 0,
        max = elements.length,
        el, el_bottom, sibs, j, target, candidate, c_top, c_bottom;

      while (i < max) {
        el = $(elements[i]);
        el_bottom = el.offset().top + el.height() + parseInt(el.css("margin-bottom").replace(/px/i, ''), 10);
        sibs = el.nextAll();
        j = 0;
        target = el;

        while (j) {
          candidate = sibs.eq(j);
          c_top = candidate.offset().top - parseInt(candidate.css("margin-top").replace(/px/i, ''), 10);
          if (c_top <= el_bottom) {
            if (strict) {
              c_bottom = candidate.offset().top + candidate.height() + parseInt(candidate.css("margin-bottom").replace(/px/i, ''), 10);
              if (c_bottom <= el_bottom) {
                target = candidate;
              }
            } else {
              target = candidate;
            }
          }
          j += 1;
        }
        targets.push(target.get(0));
        i += 1;
      }
      return $(targets);
    }
  });
  $.extend($.expr[":"], {
    "start-of-line": function (a) {
      return $(a).startOfLine();
    },
    "end-of-line": function (a) {
      return $(a).endOfLine(); 
    }
  })
}(jQuery));
