/*jslint white: true, browser: true, devel: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global $:false, Gilt:false, window:false */
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
(function(d){d.isEqual=function(a,c){var b;if(typeof a!==typeof c)return false;if("object"===typeof a&&null!==a){if(a instanceof Array&&c instanceof Array){if(a.length!==c.length)return false;for(b=0;b<a.length;b+=1)if(!d.isEqual(a[b],c[b]))return false;return true}if(a instanceof Array||c instanceof Array)return false;for(b in a)if(a.hasOwnProperty(b)){if(!c.hasOwnProperty(b))return false;if(!d.isEqual(a[b],c[b]))return false}for(b in c)if(c.hasOwnProperty(b))if(!a.hasOwnProperty(b))return false;if(a.toString instanceof Function){if(c.toString instanceof Function)return a.toString()===c.toString();return false}return true}return a===c}})(jQuery);

Array.prototype.last = function () { return this[this.length - 1]; };

// Async Spec Framework:
(function () {
  var isEqual = $.isEqual,
    descriptions = [],
    currentIt = "",
    expectations = 0,
    failures = [],
    pendingExpects = 0,
    pendingSpecs = [],
    startTime = null,
    pendingTests = 0,

    noop = function () {},

    log = function () {
      if (window.console && window.__spec_debug) {
        if ($.browser.msie) {
          for (var i = 0, tmp = "", j = 0; i < arguments.length; i += 1) {
            tmp += arguments[i] + " ";
          }
          console.log(tmp);
        } else {
          console.log.apply(this, arguments);
        }
      }
    },
    error = function (desc, msg, error) {
      if (error) {
        log(desc + msg + error.toString());
        if (window.console && window.__spec_debug) {
          console.error(error);
        }
        failures.push(desc + msg + error.toString());
        $("<span class='noremove' style='color: red;' data-context='" + desc + "' data-error='" + error.toString() + "'>.</span>").appendTo("body");
      } else {
        log(msg);
        failures.push(desc + msg);
        $("<span class='noremove' style='color: red;' data-context='" + desc + "' data-error='" + msg + "'>.</span>").appendTo("body");
      }
    },
    dot = function (color, desc) {
      $("<span class='noremove' style='color: " + color + ";' data-context='" + desc + "'>.</span>").appendTo("body");
    },

    callOrEnqueue = function (func, args) {
      if (0 === pendingExpects) {
        log("calling", args);
        func.apply(this, args || []);
      } else {
        pendingSpecs.push(function () {
          log("enqueueing", args);
          func.apply(this, args || []);
        });
      }
    },
    dequeue = function () {
      if (0 === pendingExpects &&  pendingSpecs.length) {
        log("dequeueing");
        pendingSpecs.shift()();
      }
    },

    complete = function () {
      $("body :not(.noremove)").filter(function () {
        return $(this).closest(".noremove").length === 0;
      }).remove();
      $('<br/><br/><div id="result"><span id="total"></span> test(s), <span id="failed"></span> failure(s), <span id="pending"></span> pending<br/><span id="elapsed"></span> seconds elapsed</div><div id="list" style="color: gray;"></div>').appendTo("body");
      $("#passed").text(expectations - failures.length);
      $("#failed").text(failures.length);
      $("#pending").text(pendingTests);
      $("#total").text(expectations);
      $("#elapsed").text( ((new Date).getTime() - startTime.getTime()) / 1000 )
      if (0 === failures.length) {
        $("#result").css({color: "green"});
      } else {
        $("#result").css({color: "red"});
      }
      for (var i = 0; i < failures.length; i += 1) {
        $("#list").append("<span>" + failures[i] + "</span><br/>");
      }
    },
    describe = function (text, func) {
      var afters, i;
      descriptions.push({
        description: text,
        beforeEach: [],
        afterEach: [],
        after: []
      });
      if (null === startTime) {
        startTime = new Date();
      }
      func();
      if (1 === descriptions.length) {
        descriptions.last().after.push(complete);
      }
      callOrEnqueue(function () {
        afters = descriptions.pop().after;
        for (i = 0; i < afters.length; i += 1) {
          afters[i]();
        }
        dequeue();
      });
    },

    before = function (func) {
      func();
    },
    beforeEach = function (func) {
      descriptions.last().beforeEach.push(func);
    },
    afterEach = function (func) {
      descriptions.last().afterEach.push(func);
    },
    after = function (func) {
      descriptions.last().after.push(func);
    },

    descString = function () {
      return $.map(descriptions, function (a) {
        return a.description;
      }).join(" ") + " " + currentIt;
    },

    it = function (text, func) {
      var befores = $.map($.map(descriptions, function (a) {
        return a.beforeEach;
      }), function (a) {
        return a;
      }), afters = $.map($.map(descriptions, function (a) {
        return a.afterEach;
      }), function (a) {
        return a;
      }), i, desc, timeout;
      currentIt = text;
      desc = descString();
      pendingExpects = func ? (func.toString().replace(/\n|\r/g, "").match(/[\{\};]\s*expect\(/g) || []).length : 0;
      if (0 === pendingExpects) {
        dot("yellow", desc);
        currentIt = "";
        pendingTests += 1;
        dequeue();
      } else {
        for (i = 0; i < befores.length; i += 1) {
          befores[i]();
        }

        log("starting " + desc + ", expecting " + pendingExpects + " tests");

        try {
          func();
        } catch (err) {
          error(desc, " error: ", err);
        }
        if (0 !== pendingExpects) {
          timeout = setTimeout(function () {
            expectations += pendingExpects;
            error(desc, " timed out");
            pendingExpects = 0;
            dequeue();
          }, window.__spec_timeout || 5000);
        }
        callOrEnqueue(function () {
          clearTimeout(timeout);
          currentIt = "";
          for (i = 0; i < afters.length; i += 1) {
            afters[i]();
          }
          dequeue();
        });
      }
    },

    equal = "equal",
    not_equal = "not_equal",
    contain = "contain",
    not_contain = "not_contain",
    be_a = "be_a",
    not_be_a = "not_be_a",

    expect = function (actual) {
      expectations += 1;
      var desc = descString();
      if (0 < pendingExpects) { // attempt at a means of cancelling a timed out expectation
        pendingExpects -= 1;
        log("expecting " + desc + ", expecting " + pendingExpects + " more tests");
        return {
          to: function (op, expected) {
            if (op === equal && !isEqual(actual, expected)) {
              error(desc, " (returned (" + JSON.stringify(actual) + ") but expected (" + JSON.stringify(expected) + "))");
            } else if (op === not_equal && isEqual(actual, expected)) {
              error(desc, " (returned (" + JSON.stringify(actual) + ") but expected anything but (" + JSON.stringify(expected) + "))");
            } else if (op === contain && ((actual instanceof Array && -1 === $.inArray(expected, actual)) || (actual instanceof Object && !actual.hasOwnProperty(expected)) || ("string" === typeof actual && -1 === actual.indexOf(expected)) || false)) {
              error(desc, " (expected (" + JSON.stringify(actual) + ") to contain (" + JSON.stringify(expected) + "))");
            } else if (op === not_contain && ((actual instanceof Array && -1 !== $.inArray(expected, actual)) || (actual instanceof Object && actual.hasOwnProperty(expected)) || ("string" === typeof actual && -1 !== actual.indexOf(expected)))) {
              error(desc, " (expected (" + JSON.stringify(actual) + ") to not contain (" + JSON.stringify(expected) + "))");
            } else if (op === be_a && !(("string" === typeof(expected) && expected === typeof(actual)) || ("function" === typeof(expected) && actual instanceof expected))) {
              error(desc, " (expected (" + JSON.stringify(actual) + ") to be a " + ("function" === typeof(expected) ? expected.name : expected.toString()) + ")");
            } else if (op === not_be_a && (("string" === typeof(expected) && expected === typeof(actual)) || ("function" === typeof(expected) && actual instanceof expected))) {
              error(desc, " (expected (" + JSON.stringify(actual) + ") to not be a " + ("function" === typeof(expected) ? expected.name : expected.toString()) + ")");
            } else {
              dot("green", desc);
            }
            dequeue();
          }
        };
      } else {
        return {
          to: function (op, expected) {
            error(desc, " saw timed out expect");
            dequeue();
          }
        };
      }
    },
    xexpect = function () {
      return {
        to: noop
      };
    };

  window.describe = function () {
    callOrEnqueue(describe, arguments);
  };
  window.before = before;
  window.beforeEach = beforeEach;
  window.it = function () {
    callOrEnqueue(it, arguments);
  };
  window.expect = expect;
  window.afterEach = afterEach;
  window.after = after;

  window.equal = equal;
  window.not_equal = not_equal;
  window.contain = contain;
  window.not_contain = not_contain;
  window.be_a = be_a;
  window.not_be_a = not_be_a;

  window.xdescribe = noop;
  window.xbefore = noop;
  window.xbeforeEach = noop;
  window.xit = noop;
  window.xexpect = xexpect;
  window.xafterEach = noop;
  window.xafter = noop;
}());