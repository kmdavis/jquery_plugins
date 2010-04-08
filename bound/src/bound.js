/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * Bound Event(s) Plugin
 *
 * @version 1.0
 * @requires jQuery v1.3
 * @author Kevan Davis
 * @copyright Copyright (c) 2009, Gilt Groupe
 *
 * Distributed under the terms of the GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * @description :
 *
 * Returns an array of events bound to an element
 * If a type is passed in, returns only that type.
 *
 * CSS Pseudo Selector :bound(eventType) returns elements that have events of a certain type (or types)
 *
 * Also supports namespaced events, and live events
 *
 * @usage :
 * $('#blah').bound('click') -- returns all functions bound to the click event on #blah
 * $('#blah').bound() -- returns all functions bound to any event on #blah
 * $('.blah').bound('.test') -- returns all functions bound to the test namespace on the first element with class blah
 * $('.blah:bound(click.test)') -- returns all elements with class blah that have a click handler in namespace test
 */
(function ($) {
  $.fn.bound = function (type) {
    var namespace = null, p, events, live_events, old, group, eventsArray, i;
    if (type) {
      if (type && 0 === type.indexOf(".")) {
        namespace = type.substr(1);
        type = null;
      } else if (-1 !== type.indexOf(".")) {
        p = type.split(".");
        namespace = p[1];
        type = p[0];
      }
    }
    events = $(this).data("events");
    live_events = $(document).data("events");
    if (live_events) {
      live_events = live_events.live;
    }
    if (!events && !live_events) {
      return [];
    }
    if (type) {
      if (events) {
        events = events[type] || [];
      } else {
        events = [];
      }
      if (live_events) {
        live_events = $(document).data("events")[type];
        if (live_events) {
          for (i = 0; i < live_events.length; i += 1) {
            if (live_events[i].hasOwnProperty("selector")) {
              if ($(live_events[i].selector).filter(this).length) {
                events.push(live_events[i]);
              }
            }
          }
        }
      }
    } else {
      old = events;
      events = [];
      for (group in old) {
        if (old.hasOwnProperty(group)) {
          for (i = 0; i < old[group].length; i += 1) {
            events.push(old[group][i]);
          }
        }
      }
      if (live_events) {
        live_events = $(document).data("events");
        for (group in live_events) {
          if ("live" !== group && live_events.hasOwnProperty(group)) {
            for (i = 0; i < live_events[group].length; i += 1) {
              if (live_events[group][i].hasOwnProperty("selector")) {
                if ($(live_events[group][i].selector).filter(this).length) {
                  events.push(live_events[group][i]);
                }
              }
            }
          }
        }
      }
    }
    eventsArray = [];
    for (i = 0; i < events.length; i += 1) {
      if (!namespace || events[i].namespace === namespace) {
        eventsArray.push(events[i]);
      }
    }
    return eventsArray;
  };
  $.extend($.expr[":"], {
    "bound": function (a, i, m) {
      var found = false, events, j;
      if (m && m[3]) {
        events = m[3].split(",");
        j = events.length;
        while (j) {
          j -= 1;
          if ($(a).bound(events[j].trim()).length) {
            found = true;
            break;
          }
        }
      } else {
        if ($(a).bound().length) {
          found = true;
        }
      }
      return found;
    }
  });
}(jQuery));
