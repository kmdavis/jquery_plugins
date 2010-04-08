/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * Rollover plugin
 *
 * @version 1.0
 * @requires jQuery v1.3
 * @author Kevan Davis
 * @copyright Copyright (c) 2009, Gilt Groupe
 *
 * Distributed under the terms of the GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 */
(function ($) {
  $.extend($.fn, {
    rollover: function (options) {
      var opts = $.extend({}, $.fn.rollover.defaults, options),
        elements = this,
        i = elements.length,
        fOver = function () {
          var j = opts.states.length;
          while (j) {
            j -= 1;
            opts.states[j].element.attr("src", opts.states[j].rollover.attr("src"));
          }
        },
        fOut = function () {
          var j = opts.states.length;
          while (j) {
            j -= 1;
            opts.states[j].element.attr("src", opts.states[j].rollout);
          }
        },
        el, e, srcs, targets, j, t;

      while (i) {
        i -= 1;
        el = $(elements[i]);
        if (el.attr(opts.rollover_source)) {
          e = el.attr(opts.rollover_target);
          if (e) {
            e = $(e);
          } else {
            e = el;
          }
          opts.states.push({ rollover: $("<img/>").attr("src", el.attr(opts.rollover_source)), rollout: e.attr("src"), element: e });
        }
        if (el.attr(opts.otherrollover_sources) && el.attr(opts.otherrollover_targets)) {
          srcs = el.attr(opts.otherrollover_sources).split(/[, ]/g);
          targets = el.attr(opts.otherrollover_targets).split(/[, ]/g);
          j = srcs.length;
          while (j) {
            j -= 1;
            t = $(targets[j]);
            if (!t.length) {
              t = $("#" + targets[j]);
            }
            opts.states.push({ rollover: $("<img/>").attr("src", srcs[j]), rollout: t.attr("src"), element: t });
          }
        }
        el.hover(fOver, fOut);
      }

      return $(elements);
    }
  });

  $.fn.rollover.defaults = {
    rollover_source: "rollSrc",
    rollover_target: "rollTarget",
    otherrollover_sources: "rolloverSources",
    otherrollover_targets: "rolloverTargets",
    states: []
  };
}(jQuery));
