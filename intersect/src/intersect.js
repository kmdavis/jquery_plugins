/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * Intersection plugin
 *
 * @version 1.0
 * @requires jQuery v1.3
 * @requires jquery.gilt.isequal.js
 * @author Kevan Davis
 * @copyright Copyright (c) 2010, Gilt Groupe
 *
 * Distributed under the terms of the GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 */
(function ($) {
  $.intersect = function () {
    var intersect = null, i = 1, j, k;
    if ("undefined" !== typeof(arguments[0])) {
      intersect = [];
      for (j = 0; j < arguments[0].length; j += 1) {
        for (k = 0; k < intersect.length && !$.isEqual(intersect[k], arguments[0][j]); k += 1) {}
        if (k === intersect.length) {
          intersect[k] = arguments[0][j];
        }
      }
      while (i < arguments.length) {
        if (0 === arguments[i].length) {
          return [];
        }
        for (j = 0; j < intersect.length; j += 1) {
          for (k = 0; k < arguments[i].length && !$.isEqual(intersect[j], arguments[i][k]); k += 1) {}
          if (k === arguments[i].length) {
            intersect.splice(j, 1);
            j -= 1;
          }
        }
        i += 1;
      }
    }
    return intersect;
  };
}(jQuery));
