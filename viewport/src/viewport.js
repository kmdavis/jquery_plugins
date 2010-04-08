/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false, window: false*/
"use strict";

/*
 * Viewport - jQuery selectors for finding elements in viewport
 *
 * Copyright (c) 2008-2009 Mika Tuupola
 * Copyright (c) 2009 Kevan Davis, Gilt Groupe
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *   http://www.appelsiini.net/projects/viewport
 *
 * Gilt Groupe Modification:
 *   Added :below(selector), :above(selector), :right-of(selector), :left-of(selector),
 *   :with-in(selector) selectors.  Behave same as existing selectors, but relative to
 *   the first element returned by a selector.  :with-in requires that part of the
 *   matched element be within the selected element.
 */
(function ($) {
  // convenience accessors:
  $.fn.belowthefold = function (settings) {
    return $.below(this, window, settings);
  };
  $.fn.abovethetop = function (settings) {
    return $.above(this, window, settings);
  };
  $.fn.rightofscreen = function (settings) {
    return $.rightof(this, window, settings);
  };
  $.fn.leftofscreen = function (settings) {
    return $.leftof(this, window, settings);
  };
  $.fn.inviewport = function (settings) {
    return $.within(this, window, settings);
  };
  $.fn.below = function (element, settings) {
    return $.below(this, element, settings);
  };
  $.fn.above = function (element, settings) {
    return $.above(this, element, settings);
  };
  $.fn.rightof = function (element, settings) {
    return $.rightof(this, element, settings);
  };
  $.fn.leftof = function (element, settings) {
    return $.leftof(this, element, settings);
  };
  $.fn.within = function (element, settings) {
    return $.within(this, element, settings);
  };
  $.belowthefold = function (element, settings) {
    return $.below(element, window, settings);
  };
  $.abovethetop = function (element, settings) {
    return $.above(element, window, settings);
  };
  $.rightofscreen = function (element, settings) {
    return $.rightof(element, window, settings);
  };
  $.leftofscreen = function (element, settings) {
    return $.leftof(element, window, settings);
  };
  $.inviewport = function (element, settings) {
    return $.within(element, window, settings);
  };

  var defaults = {
    threshold: 0
  };

  //these are the functions that do the actual work:
  $.below = function (element1, element2, settings) {
    var options = $.extend({}, defaults, settings);
    return $(element2).height() + Math.ceil(($(element2).offset() || {top: 0}).top) <= Math.ceil(($(element1).offset() || {top: 0}).top) - options.threshold;
  };
  $.above = function (element1, element2, settings) {
    var options = $.extend({}, defaults, settings);
    return Math.ceil(($(element2).offset() || {top: 0}).top) >= Math.ceil(($(element1).offset() || {top: 0}).top) + $(element1).height() - options.threshold;
  };
  $.rightof = function (element1, element2, settings) {
    var options = $.extend({}, defaults, settings);
    return $(element2).width() + Math.ceil(($(element2).offset() || {left: 0}).left) <= Math.ceil(($(element1).offset() || {left: 0}).left) - options.threshold;
  };
  $.leftof = function (element1, element2, settings) {
    var options = $.extend({}, defaults, settings);
    return Math.ceil(($(element2).offset() || {left: 0}).left) >= Math.ceil(($(element1).offset() || {left: 0}).left) + $(element1).width() - options.threshold;
  };
  $.within = function (element1, element2, settings) {
    return !$.rightof(element1, element2, settings) && !$.leftof(element1, element2, settings) && !$.below(element1, element2, settings) && !$.above(element1, element2, settings);
  };

  //pseudo selectors:
  $.extend($.expr[':'], {
    "below-the-fold": function (a, i, m) {
      return $.below(a, window, {threshold : 0});
    },
    "above-the-top": function (a, i, m) {
      return $.above(a, window, {threshold : 0});
    },
    "right-of-screen": function (a, i, m) {
      return $.rightof(a, window, {threshold : 0});
    },
    "left-of-screen": function (a, i, m) {
      return $.leftof(a, window, {threshold : 0});
    },
    "in-viewport": function (a, i, m) {
      return $.within(a, window, {threshold : 0});
    },
    "below": function (a, i, m) {
      return $.below(a, m[m.length - 1], {threshold : 0});
    },
    "above": function (a, i, m) {
      return $.above(a, m[m.length - 1], {threshold : 0});
    },
    "right-of": function (a, i, m) {
      return $.rightof(a, m[m.length - 1], {threshold : 0});
    },
    "left-of": function (a, i, m) {
      return $.leftof(a, m[m.length - 1], {threshold : 0});
    },
    "with-in": function (a, i, m) {
      return $(a).not(m[m.length - 1]).length > 0 && $.within(a, m[m.length - 1], {threshold : 0});
    }
  });
}(jQuery));
