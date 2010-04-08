/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * isEqual plugin
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
  var ret = function (val, reason, explain) {
    return explain && !val ? reason : val;
  };

  $.isEqual = function (a, b, explain) {
    var i;
    if ("number"  === typeof(a) && b instanceof Number  || "number"  === typeof(b) && a instanceof Number  ||
        "string"  === typeof(a) && b instanceof String  || "string"  === typeof(b) && a instanceof String  ||
        "boolean" === typeof(a) && b instanceof Boolean || "boolean" === typeof(b) && a instanceof Boolean) {
      return ret(a.toString() === b.toString(), "are of equivalent type but are not equal", explain);
    }
    if (typeof(a) !== typeof(b)) {
      return ret(false, "are not of the same type", explain);
    }
    if ("object" === typeof(a) && null !== a) {
      if (a instanceof Array && b instanceof Array) {
        if (a.length !== b.length) {
          return ret(false, "are different length arrays", explain);
        }
        for (i = 0; i < a.length; i += 1) {
          if (!$.isEqual(a[i], b[i])) {
            return ret(false, "element " + i + " of these arrays is different", explain);
          }
        }
        return ret(true, "are identical arrays", explain);
      }
      if (a instanceof Array || b instanceof Array) {
        return ret(false, "one is an array, the other is not", explain);
      }
      for (i in a) {
        if (a.hasOwnProperty(i)) {
          if (!b.hasOwnProperty(i)) {
            return ret(false, "A has a property " + i + " that B does not", explain);
          }
          if (!$.isEqual(a[i], b[i])) {
            return ret(false, "property " + i + " of these arrays is different", explain);
          }
        }
      }
      for (i in b) {
        if (b.hasOwnProperty(i)) {
          if (!a.hasOwnProperty(i)) {
            return ret(false, "B has a property " + i + " that A does not", explain);
          }
        }
      }
      if (a.toString instanceof Function) {
        if (b.toString instanceof Function) {
          return ret(a.toString() === b.toString(), "they are functions that have different string representations", explain);
        }
        return ret(false, "A is a function, but B is not", explain);
      }
      return ret(true, "they are identical objects", explain);
    }
    return ret(a === b, "they are of the same type, but are not equal", explain);
  };

  // TODO: any use for $.fn.isEqual ?

  // TODO: any use for :equals ?
}(jQuery));