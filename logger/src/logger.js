/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false, window: false, console: false*/
"use strict";

/**
 * Formatter plugin
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
  var log_queue = [],
    trim_queue = [],
    trim_timer,
    browser_logger = function () {},
    browser_trace = function () {},
    detectBrowserLoggingFunctions = function () {
      if (window.console) {
        browser_logger = console.log || console.debug || console.info || console.warn || console.error;
        if (console.trace) {
          browser_trace = console.trace;
        } else {
          // make our own
          // appendLogEntry(log_queue, ?);
        }
        return true;
      }
      return false;
    },
    pollForConsole = !detectBrowserLoggingFunctions(),
    report = function (log, mode) {
      if (pollForConsole) {
        pollForConsole = !detectBrowserLoggingFunctions();
        if (pollForConsole) {
          return;
        }
      }

      if (mode && $.log.report.hasOwnProperty(mode) && $.isFunction($.log.report[mode])) {
        $.log.report[mode](log, browser_logger);
      } else {
        $.log.report.basic(log, browser_logger);
      }
    },
    trimQueues = function () {
      var maxTS = (new Date()).getTime() - $.log.settings.maxEntryDuration,
        minTS = (new Date()).getTime() - $.log.settings.minEntryDuration,
        i, maxEntries, trimPoint1, trimPoint;
      for (i = 0; i < trim_queue.length; i += 1) {
        maxEntries = (trim_queue[i] === log_queue) ? $.log.settings.maxGlobalEntries : $.log.settings.maxDomEntries;
        for (trimPoint1 = 0; trimPoint1 < trim_queue[i].length && trim_queue[i][trimPoint1].timestamp < maxTS; trimPoint1 += 1) {}
        for (trimPoint = Math.max(trimPoint1 - 1, trim_queue[i].length - maxEntries); trimPoint > 0 && trim_queue[i][trimPoint].timestamp > minTS; trimPoint -= 1) {}
        if (trimPoint > 0) {
          //console.debug("trimming first %d log entries", trimPoint + 1);
          trim_queue[i].splice(0, trimPoint + 1);
        }
        if (!trim_queue[i].length) {
          trim_queue.splice(i, 1);
          i -= 1;
        }
      }

      if (pollForConsole && window.console) {
        pollForConsole = !detectBrowserLoggingFunctions();
        if (!pollForConsole && $.log.settings.logToConsole) {
          report(log_queue);
        }
      }

      if (trim_queue.length) {
        trim_timer = setTimeout(trimQueues, $.log.settings.trimInterval);
      } else {
        trim_timer = null;
      }
    },
    appendLogEntry = function (log, data) {
      log.push({ timestamp: (new Date()).getTime(), data: data });
      if (-1 === $.inArray(log, trim_queue)) {
        trim_queue.push(log);
      }
      if (!trim_timer) {
        trim_timer = setTimeout(trimQueues, $.log.settings.minEntryDuration);
      }
    };

  $.log = function () {
    appendLogEntry(log_queue, arguments);
    if ($.log.settings.logToConsole) {
      try {
        browser_logger.apply(null, arguments);
      } catch (error) {}
    }
    return $.log;
  };

  $.log.log = $.log; // for chained logs $.log().log(), rather than $.log()()

  $.log.report = function (mode) {
    report(log_queue, mode);
  };

  $.log.trace = function () {
    browser_trace();
    return $.log;
  };

  $.log.profile = function () {
    if (window.console) {
      if (!arguments.length || "start" === arguments[0]) {
        try {
          console.profile();
        } catch (error) {}
      } else if ("stop" === arguments[0]) {
        try {
          console.profileEnd();
        } catch (error2) {}
      }
    }
    return $.log;
  };

  $.fn.log = function () {
    var domLog = $(this).data("log_queue");
    if (!domLog) {
      domLog = [];
      $(this).data("log_queue", domLog);
    }
    appendLogEntry(domLog, arguments);
    $.log.apply(null, arguments);
    return this;
  };

  $.fn.logReport = function (mode) {
    report($(this).data("log_queue"), mode);
    return this;
  };

  $.log.report.basic = function (log, logger) {
    for (var i = 0; i < log.length; i += 1) {
      logger.apply(null, $.makeArray(log[i].data));
    }
  };
  $.log.report.details = function (log, logger) {
    for (var i = 0; i < log.length; i += 1) {
      logger.apply(null, [(new Date(log[i].timestamp)).toLocaleString(), ": "].concat($.makeArray(log[i].data)));
    }
  };
  /*$.log.report.hierarchy = function(log, logger) {
    if (log.length) {
      var createNode = function(entry, parent) {
        return { parent: parent, children: [entry], func: entry.data.callee, hasChildNodes: false };
      };
      var getCurNode = function(node, func) {
        var backFunc = func;
        while (backFunc) {
          if (backFunc = node.func) {
            return node;
          }
          backFunc = backFunc.caller;
        }
        if (node.parent) {
          return getCurNode(node.parent, func);
        }
        return node;
      };
      var top, cur;
      top = cur = { parent: null, children: [], func: null, hasChildNodes: false };
      for (var i = 0; i < log.length; ++i) {
        cur = getCurNode(cur, log[i].data.callee);
        if (cur.func == log[i].data.callee) {
          cur.children.push(log[i]);
        } else {
          var newNode = createNode(log[i], cur);
          cur.children.push(newNode);
          cur.hasChildNodes = true;
          cur = newNode;
        }
      }
      var print = function(node) {
        if (node.hasChildNodes) {
          (console.group || logger).call(null, "");
        }
        for (var i = 0; i < node.children.length; ++i) {
          if (node.children[i].children) {
            print(node.children[i]);
          } else {
            logger.apply(null, [].splice.call(node.children[i].data, 0));
          }
        }
        if (node.hasChildNodes) {
          try { console.groupEnd(); } catch(_) {}
        }
      };
      print(top);
    }
  };*/

  $.log.settings = {
    maxGlobalEntries: 1000,
    maxDomEntries: 50,
    maxEntryDuration: 3600000,
    minEntryDuration: 15000,
    trimInterval: 5000,
    logToConsole: false
  };
}(jQuery));
