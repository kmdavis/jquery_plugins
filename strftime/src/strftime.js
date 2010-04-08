/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * strftime
 *
 * @version 1.0
 * @requires jQuery v1.3
 * @author Anthony Manfredi, Kevan Davis
 * @copyright Copyright (c) 2010, Gilt Groupe
 *
 * Distributed under the terms of the GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 */
(function ($) {
  $.strftime = function (value, options) {
    var tzregex = /(\: *\d{2} *)([a-z]+)([\-\+]\d+)? *\(?([a-z ]+)?/i,
      tzreplace = /[a-z() ]/g,
      settings = $.extend({}, $.fn.strftime.defaults, options),
      dateformat = settings.format,
      localdate = new Date(), dateParts = {}, tzname, e, j1dow, j1dowly,
      fill = function (v, f, n) {
        v = v.toString();
        while (v.length < n) {
          v = f + v;
        }
        return v;
      }, formats = {
        c: "", // based on locale
        D: "%m/%d/%y",
        F: "%Y-%m-%d",
        r: "%I:%M:%S %p",
        R: "%H:%M",
        T: "%H:%M:%S",
        x: "", // based on locale
        X: "" // based on locale
      };

    localdate.setTime(Date.parse(value));
    tzname = localdate.toString();

    // Opera doesn't give us the local time zone name, but we don't really care.
    tzname = tzregex.exec(tzname) || [];
    if (!tzname[3]) {
      tzname[4] = tzname[2];
    }
    if (tzname[4]) {
      tzname = tzname[4];
    } else {
      tzname = tzname[2] + tzname[3];
    }

    dateParts.z = settings.utc ? "UTC" : tzname.replace(tzreplace, "");
    dateParts.Z = dateParts.z; // alternate (value) to z

    dateParts.w = settings.utc ? localdate.getUTCDay() : localdate.getDay();
    dateParts.u = dateParts.w + 1;
    dateParts.j = fill(Math.ceil((localdate.getTime() - (new Date(localdate.getFullYear(), 0, 1)).getTime())  / 86400000), "0", 3);
    dateParts.a = settings.locale.daysShort[dateParts.w];
    dateParts.A = settings.locale.daysLong[dateParts.w];
    dateParts.d = settings.utc ? localdate.getUTCDate() : localdate.getDate();
    dateParts.e = fill(dateParts.d, " ", 2);
    dateParts.d = fill(dateParts.d, "0", 2);

    dateParts.m = localdate.getMonth();
    dateParts.b = settings.locale.monthsShort[dateParts.m];
    dateParts.h = dateParts.b;
    dateParts.B = settings.locale.monthsLong[dateParts.m];
    dateParts.L = fill(dateParts.m + 1, " ", 2);
    dateParts.m = fill(dateParts.m + 1, "0", 2);

    dateParts.y = localdate.getYear() % 100;
    dateParts.Y = settings.utc ? localdate.getUTCFullYear() : localdate.getFullYear();
    dateParts.C = fill(Math.floor(dateParts.Y / 100), "0", 2); // 2 digit century

    j1dow = (Math.floor(1.25 * (dateParts.Y - 1)) - Math.floor((dateParts.Y - 1) / 100) + Math.floor((dateParts.Y - 1) / 400) + 1) % 7;
    j1dowly = (Math.floor(1.25 * (dateParts.Y - 2)) - Math.floor((dateParts.Y - 2) / 100) + Math.floor((dateParts.Y - 2) / 400) + 1) % 7;

    dateParts.U = Math.ceil((localdate.getTime() - new Date(dateParts.Y, 0, 1 + (7 - j1dow)).getTime()) / 604800000);
    if (0 === dateParts.U) {
      dateParts.U = Math.ceil((localdate.getTime() - new Date(dateParts.Y - 1, 0, 1 + (7 - j1dowly)).getTime()) / 604800000);
    }
    dateParts.W = Math.ceil((localdate.getTime() - new Date(dateParts.Y, 0, 1 + (7 - (j1dow + 1) % 7)).getTime()) / 604800000);
    if (0 === dateParts.W) {
      dateParts.W = Math.ceil((localdate.getTime() - new Date(dateParts.Y - 1, 0, 1 + (7 - (j1dowly + 1) % 7)).getTime()) / 604800000);
    }
    dateParts.V = dateParts.W; // TODO: in ISO-8601, week 0 can be in december -- we're not checking this right now

    dateParts.g = fill("01" === dateParts.m && dateParts.V > 51 ? (dateParts.Y - 1) % 100 : dateParts.y, "0", 2); // 2 digit year, by ISO-8601 standards
    dateParts.G = "01" === dateParts.m && dateParts.V > 51 ? dateParts.Y - 1 : dateParts.Y; // 4 digit year, by ISO-8601 standards

    dateParts.H = settings.utc ? localdate.getUTCHours() : localdate.getHours();
    dateParts.I = 12 < dateParts.H ? dateParts.H - 12 : dateParts.H;
    dateParts.H = fill(dateParts.H, "0", 2);
    dateParts.l = fill(dateParts.I, " ", 2);
    dateParts.i = dateParts.I;
    dateParts.I = fill(dateParts.I, "0", 2);
    dateParts.M = fill(settings.utc ? localdate.getUTCMinutes() : localdate.getMinutes(), "0", 2);
    dateParts.S = fill(settings.utc ? localdate.getUTCSeconds() : localdate.getSeconds(), "0", 2);

    dateParts.p = 12 > parseInt(dateParts.H, 0) ? settings.locale.am : settings.locale.pm;
    dateParts.P = dateParts.p.toLowerCase();

    dateParts.s = localdate.getTime();

    dateParts.n = "<br/>"; // newline
    dateParts.t = "&nbsp;&nbsp;"; // tab
    dateParts["%"] = "%";

    dateParts.N = "";
    if ("00" === dateParts.H) {
      dateParts.N = settings.locale.midnight;
    } else if ("12" === dateParts.H.toString()) {
      dateParts.N = settings.locale.noon;
    }

    //used: aAbBcCdDe   gGhH Ij   l mMn  pP  rRsStTuU VwWxXyYzZ
    //                      i      L   N
    //               EfF       JkK      oO  qQ        v

    for (e in formats) {
      if (formats.hasOwnProperty(e)) {
        dateformat = dateformat.replace(new RegExp("%" + e, "g"), formats[e]);
      }
    }

    for (e in dateParts) {
      if (dateParts.hasOwnProperty(e)) {
        if ("N" !== e) {
          dateformat = dateformat.replace(new RegExp("%" + e, "g"), dateParts[e]);
        }
      }
    }

    if (/\%N/.test(dateformat)) {
      dateformat = dateformat.replace(/\b0{1,2}\s?am\s?\%N|12\s?pm\s?\%N|\%N/ig, dateParts.N);
      dateformat = dateformat.replace(/\%N/g, dateParts.N);
    }

    return dateformat;
  };

  $.fn.strftime = function (options) {
    this.each(function () {
      var thisOptions = $.extend({}, options); // clone
      if ($(this).attr("data-date-format")) {
        $.extend(thisOptions, {format: $(this).attr("data-date-format")});
      }
      if ("" !== $(this).val()) {
        $(this).val($.strftime($(this).val(), thisOptions));
      } else if ("" !== $(this).html()) {
        $(this).html($.strftime($(this).html(), thisOptions));
      }
    });

    return this;
  };

  $.fn.strftime.defaults = {
    format: "%L/%e %I%p%N %z",
    utc: false,
    locale: {
      midnight: "MIDNIGHT",
      noon: "NOON",
      am: "AM",
      pm: "PM",
      daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      daysLong: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      monthsShort : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      monthsLong : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    }
  };
}(jQuery));
