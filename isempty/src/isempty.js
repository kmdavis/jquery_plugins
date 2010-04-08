/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * isEmpty plugin
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
  $.isEmpty = function (str) {
    if ("string" === typeof(str) || str instanceof Array) {
      return 0 === str.length;
    } else if (str instanceof Object) {
      if ("number" === typeof(str.length) || str.length instanceof Number) {
        return 0 === str.length;
      }
      if (str.size instanceof Function) {
        return 0 === str.size();
      }
      for (var key in str) {
        if (str.hasOwnProperty(key)) {
          return false;
        }
      }
      return true;
    }
    return ("undefined" === typeof(str));
  };

  // TODO: any use for $.fn.isEmpty ?

  // TODO: any use for :empty ?
}(jQuery));