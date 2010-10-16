/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: false, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
/**
 * @requires /javascripts/vendor/jquery_production.js
 *
 * @copyright 2007-2010 Gilt Groupe, Inc.  All Rights Reserved.
 *
 * Excerpt from http://www.giltman.com/company/termsOfUse :
 *  "All information and content including any software programs
 *   available on or through the Site ("Content") is protected
 *   by copyright. Users are prohibited from modifying, copying,
 *   distributing, transmitting, displaying, publishing, selling,
 *   licensing, creating derivative works or using any Content
 *   available on or through the Site for commercial or public
 *   purposes."
 */

$(function ($) { // Currently optimized for apple keyboard, might need some hacks to work with all keyboards
  var specialKeys = {
    8:"backspace",
    9: "tab",
    13: "return",
    19: "pause",
    20: "capslock",
    27: "esc",
    32: "space",
    33: "pageup",
    34: "pagedown",
    35: "end",
    36: "home",
    37: "left",
    38: "up",
    39: "right",
    40: "down",
    45: "ins",
    46: "del",

    59: ";", // windows
    61: "=", // windows

    // Numpad:
    96: "0",
    97: "1",
    98: "2",
    99: "3",
    100: "4",
    101: "5",
    102: "6",
    103: "7",
    104: "8",
    105: "9",
    106: "*",
    107: "+",
    109:  "-",
    110: ".",
    111: "/",

    112: "f1",
    113: "f2",
    114: "f3",
    115: "f4",
    116: "f5",
    117: "f6",
    118: "f7",
    119: "f8",
    120: "f9",
    121: "f10",
    122: "f11",
    123: "f12",

    144: "numlock",
    145: "scroll",

    186: ";", // mac
    187: "=", // mac

    188: ",",
    189: "-",
    190: ".",
    191: "/",
    192: "`",
    219: "[",
    220: "\\",
    221: "]",
    222: "'"
  }, shiftNums = {
    "`": "~",
    "1": "!",
    "2": "@",
    "3": "#",
    "4": "$",
    "5": "%",
    "6": "^",
    "7": "&",
    "8": "*",
    "9": "(",
    "0": ")",
    "-": "_",
    "=": "+",
    ";": ":",
    "'": "\"",
    ",": "<",
    ".": ">",
    "/": "?",
    "\\":"|",
    "[": "{",
    "]": "}"
  }, specialKeyAliases = {
    "back_space": "backspace",
    "enter": "return",
    "break": "pause",
    "caps": "capslock",
    "caps_lock": "capslock",
    "escape": "esc",
    "page_up": "pageup",
    "page_down": "pagedown",
    "insert": "ins",
    "delete": "del",
    "num_lock": "numlock"
  };

  $.fn.extend({
    hotkey: function (keys, fn) {
      var $this = $(this), type = "", groups, i;
      if (keys instanceof Array) {
        for (i = 0; i < keys.length; i += 1) {
          $this.hotkey(keys[i].trim(), fn);
        }
      } else {
        groups = keys.split(" ");
        for (i = 0; i < groups.length; i += 1) {
          if (/ctrl\+/.test(groups[i])) {
            type += "ctrl+";
          }
          if (/meta\+/.test(groups[i]) || /command\+/.test(groups[i]) || /apple\+/.test(groups[i]) || /windows\+/.test(groups[i])) {
            type += "meta+";
          }
          if (/alt\+/.test(groups[i])) {
            type += "alt+";
          }
          if (/shift\+/.test(groups[i])) {
            type += "shift+";
          }
          if (specialKeyAliases[groups[i].replace(/(ctrl|meta|command|apple|windows|alt|shift)\+/g, "")]) {
            groups[i] = type + specialKeyAliases[groups[i].replace(/(ctrl|meta|command|apple|windows|alt|shift)\+/g, "")];
          } else {
            groups[i] = type + groups[i].replace(/(ctrl|meta|command|apple|windows|alt|shift)\+/g, "");
          }
        }
        keys = groups.join(" ");
        if (!$this.data("keyevents")) {
          $this.bind("keydown", handler).data("keyevents", {}).data("keyhistory", "");
        }
        if (!$this.data("keyevents")[keys.toLowerCase()]) {
          $this.data("keyevents")[keys.toLowerCase()] = [];
        }
        $this.data("keyevents")[keys.toLowerCase()].push(fn);
      }
      return this;
    }
  });

  var handler = function (event) {
    if (1 === $(this).filter("input, textarea").length || 0 === $(event.target).filter("input, textarea").length) {
      var $this = $(this), key = "", keyType = "", withHistory = $this.data("keyhistory"), i;
      if (event.ctrlKey) {
        keyType += "ctrl+";
      }
      if (event.originalEvent.metaKey) {
        keyType += "meta+";
      }
      if (event.altKey) {
        keyType += "alt+";
      }
      if (event.shiftKey) {
        keyType += "shift+";
      }
      if ((15 < event.which && 19 > event.which) || 91 === event.which) {

      } else {
        if (specialKeys[event.which]) {
          key = specialKeys[event.which];
        } else {
          key = String.fromCharCode(event.which).toLowerCase();
        }
        if (event.shiftKey && shiftNums[key]) {
          key = shiftNums[key];
          keyType = keyType.replace("shift+", "");
          event.shiftKey = false;
        }
      }
      keyType += key;
      withHistory += keyType;

      if ($this.data("keyevents")[keyType]) {
        for (i = 0; i < $this.data("keyevents")[keyType].length; i += 1) {
          $this.data("keyevents")[keyType][i](keyType);
        }
        event.preventDefault();
      }

      if (keyType !== withHistory) {
        if ($this.data("keyevents")[withHistory]) {
          for (i = 0; i < $this.data("keyevents")[withHistory].length; i += 1) {
            $this.data("keyevents")[withHistory][i](withHistory);
          }
        }
        event.preventDefault();
      }

      withHistory += " ";
      for (key in $this.data("keyevents")) {
        if (0 === key.indexOf(withHistory)) {
          $this.data("keyhistory", withHistory);
          return;
        }
      }
      $this.data("keyhistory", "");
    }
  };
}(jQuery));