/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * Unique Selector
 *
 * @version 1.0
 * @requires jQuery v1.3
 * @author Kevan Davis
 * @copyright Copyright (c) 2009, Gilt Groupe
 *
 * Distributed under the terms of the GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * Calculates a unique css selector for an element
 *
 * Attempts have been made to optimize the selector, but it's far from perfect
 */
(function ($) {
  var helper = function (el, first) {
    var path = "", simple_candidates = [], classes, i, j, sortByLength,
      tagName = el[0].nodeName.toLowerCase();
    if (el.attr("id")) {
      return "#" + el.attr("id"); // If it has an id, no need for anything above this point, since ids are required to be unique
    } else if (1 === $(tagName).length) {
      return tagName;
    } else {
      sortByLength = function (a, b) {
        return a.length - b.length;
      };
      if (el.attr("class")) {
        classes = $.trim(el.attr("class")).split(" ");
        for (i = 0; i < classes.length; i += 1) {
          if (1 === $(tagName + "." + classes[i]).length) {
            simple_candidates.push(tagName + "." + classes[i]);
          } else {
            for (j = i; j < classes.length; j += 1) {
              if (1 === $(tagName + "." + classes[i] + "." + classes[j]).length) {
                simple_candidates.push(tagName + "." + classes[i] + "." + classes[j]);
              }
            }
          }
        }
        if (0 !== simple_candidates.length) {
          simple_candidates.sort(sortByLength);
          return simple_candidates[0];
        }
      }

      path = tagName; // get the nodename, e.g. "div"
      if (el.prevAll(tagName).length || el.nextAll(tagName).length) { // if there are multiple such elements at this level, append an index, e.g. "div.mydiv:eq(7)"
        path += ":eq(" + el.prevAll(tagName).length + ")";
      }
    }
    if (el.parent().length) { // in an (x)html document, should always return true, since we never reach the Document itself.  in XML, it will return false for the root element
      if (el.parent()[0] === $("body")[0]) {
        return "body>" + path;
      } else if (el.parent()[0] === $("head")[0]) {
        return "head>" + path;
      } else if (el.parent()[0] === $("html")[0]) {
        return "html>" + path;
      } else if (!first) { // ok, we're not at the top, and we're not at the bottom
        if (!el.siblings().length) { // if we're an only child, no need to be included
          return helper(el.parent(), false) + "!"; // appending a "!", we look for this afterwords, and remove it and any ">" that follows
        }
      }
      return helper(el.parent(), false) + ">" + path;
    }
    return path;
  };
  $.fn.getUniqueSelector = function (aggresive) {
    return helper(this, true).replace(/!+>?/g, " ");
  };
}(jQuery));
