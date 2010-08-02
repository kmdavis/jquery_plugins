/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * Storage plugin
 *
 * @version 0.5
 * @requires jQuery v1.3 && JSON2
 * @author Kevan Davis
 * @copyright Copyright (c) 2009, Gilt Groupe
 *
 * Distributed under the terms of the GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * Storage is a high-level abstraction of the many different client-side persistent data storage options available:
 *   HTTP Cookies
 *   Flash Cookies (requires Flash Player)
 *   HTML5 Local Dom Storage
 *   HTML5 Session Dom Storage
 *   HTML5 Database
 *   Gears Database (requires Gears or Chrome)
 *   UserData Behavior (IE5+)
 *   window.name (session based only)
 *
 * API:
 *   $.storage.set(nameValueObject, callback[, mode][, opts])
 *   $.storage.get(nameArray, callback[, mode])
 *   $.storage.clear(nameArray, callback[, mode])
 *   $.storage.list(callback[, mode])
 *   $.storage.sql(sql, callback)
 *
 * Modes: 'persistent' (default)
 *        'session' or 'cache'
 *        'database' or 'db'
 *        'header' or 'cookie'
 */
(function($) {
{ // Global
    var factories = {
        main: function(fname) {
            return function(data, callback, mode, opts) {
                if (!opts) {
                    if ("object" == typeof mode) {
                        opts = mode;
                        mode = null;
                    } else {
                        opts = {};
                    }
                }
                if (!callback && "list" == fname) {
                    if ($.isFunction(data)) {
                        callback = data;
                        data = null;
                    }
                }
                var stack = $.storage.settings.readingStack;
                if ("undefined" != typeof mode) {
                    stack = $.storage.utilities.stack(mode);
                } else if("set" == fname) {
                    stack = $.storage.settings.persistentStack;
                }
                var i = -1;
                var max = stack.length;
                var f;
                if ("list" == fname) {
                    f = function(ns) {
                        return function() {
                            ns.list(opts, function() {
                                $.storage.utilities.worker(true);
                            });
                        };
                    };
                } else if ("set" == fname) {
                    f = function(ns, name, value) {
                        return function() {
                            if (!$.storage.utilities.pendingResult[name]) {
                                ns.set(name, value, opts, function() {
                                    $.storage.utilities.worker(true);
                                });
                            } else {
                                $.storage.utilities.worker(true);
                            }
                        };
                    };
                } else {
                    f = function(ns, _, name) {
                        return function() {
                            if (null === $.storage.utilities.pendingResult[name]) {
                                ns[fname](name, opts, function() {
                                    $.storage.utilities.worker(true);
                                });
                            } else {
                                $.storage.utilities.worker(true);
                            }
                        };
                    };
                }
                // Setup
                $.storage.utilities.workQueue.push(function() {
                    $.storage.utilities.pendingResult = {};
                    if ("set" == fname) {
                        for (var index in data) {
                            $.storage.utilities.pendingResult[index] = false;
                        }
                    } else if ("list" != fname) {
                        var j = -1;
                        var len = data.length; // todo...todo what?
                        while (++j < len) {
                            $.storage.utilities.pendingResult[data[j]] = null;
                        }
                    } else {
                        $.storage.utilities.pendingResult = [];
                    }
                    $.storage.utilities.worker(true);
                });
                while (++i < max) {
                    if (stack[i]) {
                        if ("list" == fname) {
                            $.storage.utilities.workQueue.push(f(stack[i]));
                        } else {
                            for (var index in data) {
                                $.storage.utilities.workQueue.push(f(stack[i], index, data[index]));
                            }
                        }
                    }
                }
                // Teardown
                $.storage.utilities.workQueue.push(function() {
                    var result = $.storage.utilities.pendingResult;
                    $.storage.utilities.pendingResult = null;
                    if ("list" == fname) {
                        result.sort();
                    }
                    callback(result);
                    $.storage.utilities.worker(true);
                });
                $.storage.utilities.worker();
            };
        },
        has: function(ns) {
            return function(name, opts, callback) {
                ns.get(name, opts, function(status) {
                    callback(null !== status);
                });
            };
        },
        enabled: function(ns) {
            return function(callback, val) {
                if (null === ns._enabled) {
                    if ($.storage.settings.debug) { console.debug("Storage: Testing if %s is available", ns.name); }
                    ns.available(function(available) {
                        ns._enabled = available;
                        callback(available);
                    });
                } else if ("undefined" != typeof val) {
                    ns._enabled = val;
                    callback(val);
                } else {
                    callback(ns._enabled);
                }
            };
        },
        canStore: function(ns){
            return function(obj) {
                return $.storage.utilities.sizeof(obj) <= ns.capacity.availableSize();
            };
        },
        maxLength: function() { return Number.MAX_VALUE; },
        availableLength: function(ns) {
            return function() {
                return ns.capacity.maxLength() - ns.capacity.length();
            };
        },
        availableSize: function(ns) {
            return function() {
                return ns.capacity.maxSize() - ns.capacity.size();
            };
        }
    };

    $.storage = {
        set: factories.main("set"),
        get: factories.main("get"),
        clear: factories.main("clear"),
        list: factories.main("list")
    };
} // Global

{ // HTTP Cookies
    $.storage.httpCookies = {};
    $.extend($.storage.httpCookies, {
        name: "HTTP Cookies",
        has: factories.has($.storage.httpCookies),
        _enabled: null,
        enabled: factories.enabled($.storage.httpCookies),
        regexCache: {},
        _list_regex: /(\w*)(?==)/g, // includes empty elements from the look ahead assertion
        _ahcm_cache: {},
        _ahcm_regex: /(ahcm\w=[^;$]*)/g,
        _length_regex: /(\w*=)/g,
        defaults: {
            expires: 31536000000, //365*24*60*60*1000 = 1 year
            path: '/',
            domain: null,
            secure: false,
            skipCheck: false
        }
    });
    $.storage.httpCookies.set = function(name, value, opts, callback) {
        $.storage.httpCookies.enabled(function(enabled) {
            if (enabled) {
                opts = $.extend({}, $.storage.httpCookies.defaults, opts);
                if ($.storage.settings.debug) { console.debug("Storage: Setting HTTP Cookie %s = %o", name, value); }
                if ($.storage.settings.aggressiveHttpCookieManagement && !opts.expires) {
                    opts.expires = $.storage.httpCookies.defaults.expires; // AHCM is silly for session cookies
                }
                var cookieOpts = "";
                if (opts.expires) {
                    var ret = false;
                    $.storage.httpCookies.available(function(available) { // guaranteed to be synchronous at this point
                        if (!available) {
                            if (callback) {
                                callback(false); // TODO: refactor to avoid this
                            }
                            ret = true;
                        }
                    }, "persistent");
                    if (ret) {
                        return;
                    }
                    var d = new Date();
                    d.setTime(d.getTime() + opts.expires);
                    cookieOpts += ";expires=" + d.toGMTString();
                }
                if (opts.domain) {
                    cookieOpts += ";domain=" + opts.domain;
                }
                if (opts.path) {
                    cookieOpts += ";path=" + opts.path;
                }
                if (opts.secure) {
                    cookieOpts += ";secure=true";
                }
                if ($.storage.settings.aggressiveHttpCookieManagement) {
                    if ($.storage.settings.debug) { console.debug("Storage: Using Aggressive Cookie Management"); }
                    if ($.storage.httpCookies.capacity.canStore(encodeURIComponent(name + "=" + value))){
                        if (value && '' != value) {
                            $.storage.httpCookies._ahcm_cache[name] = value;
                        } else {
                            $.storage.httpCookies._ahcm_cache[name] = null;
                            delete $.storage.httpCookies._ahcm_cache[name];
                        }
                        if ($.storage.settings.debug) { console.debug("Storage: Writing Cache"); }
                        var temp = encodeURIComponent($.storage.utilities.toJSON($.storage.httpCookies._ahcm_cache));
                        var i = "a".charCodeAt(0);
                        while (temp.length) {
                            var cutLen = Math.min(temp.length, $.storage.httpCookies.capacity.maxQuanta() - 6); // 6 = ahcm#=
                            var temp2 = temp.substr(0, cutLen);
                            temp = temp.substr(3, cutLen);
                            document.cookie = "ahcm" + String.fromCharCode(i++) + "=" + temp2 + cookieOpts;
                        }
                    }
                } else {
                    var cookieString = name + "=" + encodeURIComponent($.storage.utilities.toJSON(value));
                    if ($.storage.httpCookies.capacity.canStore(cookieString)) {
                        document.cookie = cookieString + cookieOpts; // TODO: error checking
                        $.storage.utilities.pendingResult[name] = true;
                    } else {
                        if ($.storage.settings.debug) { console.debug("Storage: Not enough room for this HTTP Cookie"); }
                    }
                }
            }
            if (callback) {
                callback($.storage.utilities.pendingResult[name]);
            }
        });
    };
    $.storage.httpCookies.get = function(name, opts, callback) {
        $.storage.httpCookies.enabled(function(enabled) {
            if (enabled) {
                opts = $.extend({}, $.storage.httpCookies.defaults, opts);
                if ($.storage.settings.debug) { console.debug("Storage: Attempting to retrieve HTTP Cookie %s", name); }
                if ($.storage.settings.aggressiveHttpCookieManagement) {
                    $.storage.utilities.pendingResult[name] = $.storage.httpCookies._ahcm_cache[name];
                } else {
                    var r = $.storage.httpCookies.regexCache;
                    if (!r[name]) {
                        r[name] = new RegExp(";?" + name + "=([^;]*);?");
                    }
                    var c = document.cookie.match(r[name]);
                    if (c) {
                        $.storage.utilities.pendingResult[name] = $.storage.utilities.fromJSON(decodeURIComponent(c[1]));
                    }
                }
            }
            callback($.storage.utilities.pendingResult[name]);
        });
    };
    $.storage.httpCookies.clear = function(name, opts, callback) {
        $.storage.httpCookies.enabled(function(enabled) {
            if (enabled) {
                $.storage.httpCookies.has(name, opts, function(found) {
                    if (found) {
                        opts = $.extend({}, $.storage.httpCookies.defaults, opts);
                        if ($.storage.settings.debug) { console.debug("Storage: Removing HTTP Cookie %s", name); }
                        $.storage.httpCookies.set(name, '', { expires: -$.storage.httpCookies.defaults.expires });
                        $.storage.utilities.pendingResult[name] = true;
                    }
                    callback($.storage.utilities.pendingResult[name]);
                });
            } else {
                callback(false);
            }
        });
    };
    $.storage.httpCookies.list = function(opts, callback) {
        $.storage.httpCookies.enabled(function(enabled) {
            if (enabled && document.cookie.length) {
                if ($.storage.settings.debug) { console.debug("Storage: Listing HTTP Cookies"); }
                var rawList = document.cookie.match($.storage.httpCookies._list_regex);
                var i = -1;
                var max = rawList.length;
                while (++i < max) {
                    if (rawList[i].length) {
                        if (!$.storage.settings.aggressiveHttpCookieManagement || "ahcm" != rawList[i].substr(0, 4)) {
                            $.storage.utilities.pendingResult.push(rawList[i]);
                        }
                    }
                }
                if ($.storage.settings.aggressiveHttpCookieManagement) {
                    for (var k in $.storage.httpCookies._ahcm_cache) {
                        if ($.storage.httpCookies._ahcm_cache.hasOwnProperty(k)) {
                            $.storage.utilities.pendingResult.push(k);
                        }
                    }
                }
            }
            callback($.storage.utilities.pendingResult);
        });
    };
    $.storage.httpCookies.available = function(callback, type) {
        if ($.storage.settings.debug) { console.debug("Storage: Testing Session Cookies"); }
        var d1 = new Date();
        var d2 = new Date();
        d1.setTime(d1.getTime() + 31536000000);
        d2.setTime(d2.getTime() - 31536000000);
        document.cookie = "testCookieSession=true;path=/";
        var resultS = false;
        if (document.cookie.match(/;?testCookieSession=/)) {
            resultS = true;
        }
        document.cookie = "testCookieSession=;path=/;expires=" + d2.toGMTString();
        var resultP = resultS;
        if (resultS) {
            if ($.storage.settings.debug) { console.debug("Storage: Session Cookies are available"); }
            if ($.storage.settings.debug) { console.debug("Storage: Testing Persistent Cookies"); }
            document.cookie = "testCookiePersistent=true;path=/;expires=" + d1.toGMTString();
            if (!document.cookie.match(/;?testCookiePersistent=/)) {
                resultP = false;
            }
            if ($.storage.settings.debug) { console.debug("Storage: Persistent Cookies available: %o", resultP); }
            document.cookie = "testCookiePersistent=;path=/;expires=" + d2.toGMTString();

            if ($.storage.settings.aggressiveHttpCookieManagement) {
                if ($.storage.settings.debug) { console.debug("Storage: Aggressive HTTP Cookie Management is enabled"); }
                if ($.storage.settings.debug) { console.debug("Storage: Caching AHCM Cookies"); }
                var AHCMcookies = document.cookie.match($.storage.httpCookies._ahcm_regex);
                if (AHCMcookies) {
                    var temp = "";
                    var i = -1;
                    var max = AHCMcookies.length;
                    while (++i < max) {
                        temp += decodeURIComponent(AHCMcookies.split("=")[1]);
                    }
                    $.storage.httpCookies._ahcm_cache = $.storage.utilities.fromJSON(temp);
                } else {
                    $.storage.httpCookies._ahcm_cache = {};
                }
            }
        }
        $.storage.httpCookies.available = function (callback, type) {
            if ("persistent" == type) {
                callback(resultP);
            } else {
                callback(resultS);
            }
        };
        if (!resultS) {
            $.storage.utilities.dropFromStacks($.storage.httpCookies);
        }
        $.storage.httpCookies.available(callback, type);
    };
    $.storage.httpCookies.capacity = {
        canStore: function(obj) {
            if ($.storage.settings.aggressiveHttpCookieManagement) {
                return ($.storage.utilities.sizeof(obj) <= $.storage.httpCookies.capacity.availableSize());
            } else {
                return ($.storage.httpCookies.capacity.availableLength() > 1 && // always leave 1 slot open to test cookie availability with
                        $.storage.utilities.sizeof(obj) <= $.storage.httpCookies.capacity.maxQuanta());
            }
        },
        maxLength: function() {
            var result = 20;
            if ($.browser.mozilla) {
                result = 50;
            } else if ($.browser.msie && $.browser.version >= 8) {
                result = 50;
            } else if ($.browser.opera) {
                result = 30;
            } else if ($.browser.safari) { // Safari has no limit, but some servers have a limit to the size of the header
                result = Number.MAX_VALUE;
            }
            $.storage.httpCookies.capacity.maxLength = function() { return result; };
            if ($.storage.settings.debug) { console.debug("Storage: Max %d HTTP Cookies per Domain", result); }
            return result;
        },
        maxQuanta: function() { // includes =
            var result = 4096;
            if ($.browser.mozilla) {
                result = 4097;
            } else if ($.browser.msie) {
                result = 4095;
            }
            $.storage.httpCookies.capacity.maxQuanta = function() { return result; };
            if ($.storage.settings.debug) { console.debug("Storage: %d Max Cookie Size", result); }
            return result;
        },
        maxSize: function() {
            var c = $.storage.httpCookies.capacity;
            if ($.storage.settings.aggressiveHttpCookieManagement) {
                var AHCMcookies = document.cookie.match($.storage.httpCookies._ahcm_regex);
                if (AHCMcookies) {
                    return (AHCMcookies.length * c.maxQuanta()) + // cookies already managed by ahcm, possibly with available space
                           (c.size() - AHCMcookies.join('').length) - // cookies not managed by ahcm
                            c.maxQuanta(); // always leave 1 slot open to test cookie availability with
                }
            }
            return c.size() + c.availableLength() * c.maxQuanta();
        },
        length: function() { return (document.cookie.length ? document.cookie.match($.storage.httpCookies._length_regex).length : 0); },
        size: function() { return document.cookie.length; },
        availableLength: factories.availableLength($.storage.httpCookies),
        availableSize: factories.availableSize($.storage.httpCookies)
    };
} // httpCookies

{ // Flash Cookies, aka Local Shared Object
    $.storage.flashCookies = {};
    $.extend($.storage.flashCookies, {
        name: "Local Stored Object",
        has: factories.has($.storage.flashCookies),
        _enabled: null,
        enabled: factories.enabled($.storage.flashCookies)
    });
    $.storage.flashCookies.set = function(name, value, opts, callback) {
        $.storage.flashCookies.enabled(function(enabled) {
            if (enabled) {
                value = $.storage.utilities.toJSON(value);
                if ($.storage.settings.debug) { console.debug("Storage: Setting %s = %o using Flash Cookies", name, value); }
                try {
                    $("#storageFlashObject")[0].setData(name, value);
                    $.storage.utilities.pendingResult[name] = true;
                } catch(_) {}
            }
            callback($.storage.utilities.pendingResult[name]);
        });
    };
    $.storage.flashCookies.get = function(name, opts, callback) {
        $.storage.flashCookies.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Attempting to retrieve %s from Flash Cookie", name); }
                $.storage.pendingResult[name] = $("#storageFlashObject")[0].getData(name);
            }
            callback($.storage.utilities.pendingResult[name]);
        });
    };
    $.storage.flashCookies.clear = function(name, opts, callback) {
        $.storage.flashCookies.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Removing %s from Flash Cookie", name); }
                $("#storageFlashObject")[0].removeData(name);
                $.storage.utilities.pendingResult[name] = true;
            }
            callback($.storage.utilities.pendingResult[name]);
        });
    };
    $.storage.flashCookies.list = function(opts, callback) {
        $.storage.flashCookies.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Listing Flash Cookies"); }
                $.merge($.storage.utilities.pendingResult, $("#storageFlashObject")[0].listData());
            }
            callback($.storage.utilities.pendingResult);
        });
    };
    $.storage.flashCookies.available = function(callback) {
        var result = false;
        try {
            try {
                if ($.storage.settings.debug) { console.debug("Storage: Testing if Flash Player 6 is present"); }
                var axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6"); // FP 6 crashes IE when GetVariable is called
                try {
                    axo.AllowScriptAccess = "always";
                } catch(_) {}
            } catch(_) {
                if ($.storage.settings.debug) { console.debug("Storage: Testing if Flash Player version is at least 8 in IE"); }
                result = parseInt(new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable("$version").replace(/\D+/g, ".").match(/^\.?(.+)\.?$/)[1]) >= 8;
            }
        } catch(_) {
            try {
                if ($.storage.settings.debug) { console.debug("Storage: Testing if Flash Player version is at least 8 in a real browser"); }
                if (navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin) {
                    result = parseInt((navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ".").match(/^\.?(.+)\.?$/)[1]) >= 8;
                }
            } catch(_) {}
        }
        if (!result) {
            $.storage.flashCookies.available = function(callback) { callback(false); };
            $.storage.utilities.dropFromStacks($.storage.flashCookies);
            callback(false);
        } else {
            if ($.storage.settings.debug) { console.debug("Storage: Pausing Operations while loading SWF"); }
            $("<object/>").attr({
                id: "storageFlashObject",
                type: "application/x-shockwave-flash",
                data: $.storage.settings.swfUrl,
                allowScriptAccess: "always",
                width: 1,
                height: 1
            }).append("<param name='movie' value='" + $.storage.settings.swfUrl + "'/>")
              .append("<param name='allowScriptAccess' value='always'/>")
              .ready(function() {
                var maxAttempts = 50; // a few seconds
                var poll = setInterval(function() {
                  try {
                    $("#storageFlashObject")[0].getData("test"); // Not 100% sure the swf works.  I think it's just a security exception since I'm running locally.
                    clearInterval(poll);
                    if ($.storage.settings.debug) { console.debug("Storage: SWF Loaded, resuming Operations"); }
                    $.storage.flashCookies.available = function(callback) { callback(true); };
                    callback(true);
                  } catch(_) {
                    if (!maxAttempts--) {
                        clearInterval(poll);
                        if ($.storage.settings.debug) { console.debug("Storage: SWF Load timed out, resuming Operations"); }
                        $.storage.flashCookies.available = function(callback) { callback(false); };
                        $.storage.utilities.dropFromStacks($.storage.flashCookies);
                        callback(false);
                    }
                  }
                }, 50);
              })
              .appendTo("body");
        }
    };
    $.storage.flashCookies.capacity = {
        canStore: factories.canStore($.storage.flashCookies),
        maxLength: factories.maxLength,
        maxQuanta: function() { return 102400; },
        maxSize: function() { return 102400; }, // TODO: find a way to detect (and show) the storage increase dialog
        length: function() { return $("#storageFlashObject")[0].getLength(); },
        size: function() { return $("#storageFlashObject")[0].getSize(); },
        availableLength: factories.availableLength($.storage.flashCookies),
        availableSize: factories.availableSize($.storage.flashCookies)
    };
} // flashCookies -- detection is broken on localhost -- might work on web though

{ // HTML 5 Persistent DOM Storage (aka localStorage or globalStorage)
    $.storage.domPStorage = {};
    $.extend($.storage.domPStorage, {
        name: "Persistent Dom Storage",
        has: factories.has($.storage.domPStorage),
        _enabled: null,
        enabled: factories.enabled($.storage.domPStorage),
        defaults: {
            domain: null
        }
    });
    $.storage.domPStorage.set = function(name, value, opts, callback) {
        $.storage.domPStorage.enabled(function(enabled) {
            if (enabled) {
                value = $.storage.utilities.toJSON(value);
                if ($.storage.domPStorage.capacity.canStore(value)) {
                    if ($.storage.settings.debug) { console.debug("Storage: Setting %s = %o using Persistent Dom Storage", name, value); }
                    opts = $.extend({}, $.storage.domPStorage.defaults, opts);
                    try {
                        if (opts.domain) {
                            window.globalStorage[opts.domain].setItem(name, value);
                        } else {
                            window.localStorage.setItem(name, value);
                        }
                        $.storage.utilities.pendingResult[name] = true;
                    } catch(e) {
                        if ($.storage.settings.debug) { console.debug("Storage: Error Occured"); }
                    }
                }
            }
            callback($.storage.utilities.pendingResult[name]);
        });
    };
    $.storage.domPStorage.get = function(name, opts, callback) {
        $.storage.domPStorage.enabled(function(enabled) {
            if (enabled) {
                opts = $.extend({}, $.storage.domPStorage.defaults, opts);
                if ($.storage.settings.debug) { console.debug("Storage: Attempting to retrieve %s from Persistent Dom Storage", name); }
                if (opts.domain) {
                    $.storage.utilities.pendingResult[name] = $.storage.utilities.fromJSON(window.globalStorage[opts.domain].getItem(name));
                } else {
                    $.storage.utilities.pendingResult[name] = $.storage.utilities.fromJSON(window.localStorage.getItem(name));
                }
            }
            callback($.storage.utilities.pendingResult[name]);
        });
    };
    $.storage.domPStorage.clear = function(name, opts, callback) {
        $.storage.domPStorage.enabled(function(enabled) {
            if (enabled) {
                $.storage.domPStorage.has(name, opts, function(found) {
                    if (found) {
                        opts = $.extend({}, $.storage.domPStorage.defaults, opts);
                        if ($.storage.settings.debug) { console.debug("Storage: Removing %s from Persistent Dom Storage", name); }
                        if (opts.domain) {
                            window.globalStorage[opts.domain].removeItem(name);
                        } else {
                            window.localStorage.removeItem(name);
                        }
                        $.storage.utilities.pendingResult[name] = true;
                    }
                    callback($.storage.utilities.pendingResult[name]);
                });
            } else {
                callback(false);
            }
        });
    };
    $.storage.domPStorage.list = function(opts, callback) {
        $.storage.domPStorage.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Listing Persistent Dom Storage entries"); }
                opts = $.extend({}, $.storage.domPStorage.defaults, opts);
                var i = -1;
                var max = window.localStorage.length;
                while (++i < max) {
                    if (opts.domain) {
                        $.storage.utilities.pendingResult.push(window.globalStorage[opts.domain].key(i));
                    } else {
                        $.storage.utilities.pendingResult.push(window.localStorage.key(i));
                    }
                }
            }
            callback($.storage.utilities.pendingResult);
        });
    };
    $.storage.domPStorage.available = function(callback) {
        var result = false;
        try {
            if ($.storage.settings.debug) { console.debug("Storage: Testing if window.localStorage exists"); }
            if ("undefined" == typeof window.localStorage) {
                if ($.storage.settings.debug) { console.debug("Storage: Testing if window.globalStorage exists"); }
                if ("object" == typeof window.globalStorage) {
                    if ($.storage.settings.debug) { console.debug("Storage: Setting window.localStorage = window.globalStorage[ %s ]", document.location.hostname); }
                    window.localStorage = window.globalStorage[ document.location.hostname ];
                    result = true;
                }
            } else {
                result = true;
            }
        } catch(e) {
            if ($.storage.settings.debug) { console.debug("Storage: Persistent Dom Storage exists but is not enabled."); }
        } // if the browser supports it, but has it disabled, an error can be thrown
        $.storage.domPStorage.available = function (callback) { callback(result); };
        if (!result) {
            $.storage.utilities.dropFromStacks($.storage.domPStorage);
        }
        callback(result);
    };
    $.storage.domPStorage.capacity = {
        canStore: factories.canStore($.storage.domPStorage),
        maxLength: factories.maxLength,
        maxQuanta: function() { return $.storage.domPStorage.capacity.maxSize(); },
        maxSize: function() {
            var result = 0;
            if ($.browser.msie && parseFloat($.browser.version) >= 8) {
                result = 10485760; // 10 MB
            } else if ($.browser.mozilla && parseFloat($.browser.version) >= 1.8) {
                result = 5242880; // 5 MB
            }/* else if ($.browser.opera && $.browser.version >= 10??) { // no opera support YET
                result = 3145728; // 3 MB -- according to rumor
            } */else if ($.browser.safari && parseFloat($.browser.version) >= 4) {
                result = 10485760; // Unknown Quota !!! (might also be different on iphone)
            }
            $.storage.domPStorage.capacity.maxSize = function() { return result; };
            // TODO: since persistent and session quotas should (?) be the same, might go ahead and set the other
            if ($.storage.settings.debug) { console.debug("Storage: Persistent Dom Storage Quota: %d", result); }
            return result;
        },
        length: function() { return window.localStorage.length; },
        size: function() { // Approximation -- can know size of localStorage, but not globalStorage
                           // for IE, might be able to do maxSize - availableSize
            var size = 0;
            var i = window.localStorage.length;
            while (i--) {
                size += $.storage.utilities.sizeof(window.localStorage.getItem(window.localStorage.key(i)).value);
            }
            return size;
        },
        availableLength: factories.availableLength($.storage.domPStorage),
        availableSize: function() {
            if ($.browser.msie) {
                $.storage.domPStorage.capacity.availableSize = function() {
                    return window.localStorage.remainingSpace();
                };
                return window.localStorage.remainingSpace();
            }
            $.storage.domPStorage.capacity.availableSize = function() {
                return $.storage.domPStorage.capacity.maxSize() - $.storage.domPStorage.capacity.size();
            };
            return $.storage.domPStorage.capacity.availableSize();
        }
    };
} // domPStorage

{ // HTML 5 Session DOM Storage
    $.storage.domSStorage = {};
    $.extend($.storage.domSStorage, {
        name: "Session Dom Storage",
        has: factories.has($.storage.domSStorage),
        _enabled: null,
        enabled: factories.enabled($.storage.domSStorage)
    });
    $.storage.domSStorage.set = function(name, value, opts, callback) {
        $.storage.domSStorage.enabled(function(enabled) {
            if (enabled) {
                value = $.storage.utilities.toJSON(value);
                if ($.storage.domSStorage.capacity.canStore(value)) {
                    if ($.storage.settings.debug) { console.debug("Storage: Setting %s = %o using Session Dom Storage", name, value); }
                    try {
                        window.sessionStorage.setItem(name, value);
                        $.storage.utilities.pendingResult[name] = true;
                    } catch(e) {
                        if ($.storage.settings.debug) { console.debug("Storage: Error Occured"); }
                    }
                }
            }
            callback($.storage.utilities.pendingResult[name]);
        });
    };
    $.storage.domSStorage.get = function(name, opts, callback) {
        $.storage.domSStorage.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Attempting to retrieve %s from Session Dom Storage", name); }
                $.storage.utilities.pendingResult[name] = $.storage.utilities.fromJSON(window.sessionStorage.getItem(name));
            }
            callback($.storage.utilities.pendingResult[name]);
        });
    };
    $.storage.domSStorage.clear = function(name, opts, callback) {
        $.storage.domSStorage.enabled(function(enabled) {
            if (enabled) {
                $.storage.domSStorage.has(name, opts, function(found) {
                    if (found) {
                        if ($.storage.settings.debug) { console.debug("Storage: Removing %s from Session Dom Storage", name); }
                        window.sessionStorage.removeItem(name);
                        $.storage.utilities.pendingResult[name] = true;
                    }
                    callback($.storage.utilities.pendingResult[name]);
                });
            } else {
                callback(false);
            }
        });
    };
    $.storage.domSStorage.list = function(opts, callback) {
        $.storage.domSStorage.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Listing Session Dom Storage entries"); }
                var i = -1;
                var max = window.sessionStorage.length;
                while (++i < max) {
                    $.storage.utilities.pendingResult.push(window.sessionStorage.key(i));
                }
            }
            callback($.storage.utilities.pendingResult);
        });
    };
    $.storage.domSStorage.available = function(callback) {
        var result = false;
        try {
            if ($.storage.settings.debug) { console.debug("Storage: Testing if window.sessionStorage exists"); }
            if ("undefined" != typeof window.sessionStorage && null !== window.sessionStorage) {
                result = true;
            }
        } catch(e) {
            if ($.storage.settings.debug) { console.debug("Storage: Session Dom Storage exists but is not enabled."); }
        } // if the browser supports it, but has it disabled, an error can be thrown
        $.storage.domSStorage.available = function (callback) { callback(result); };
        if (!result) {
            $.storage.utilities.dropFromStacks($.storage.domSStorage);
        }
        callback(result);
    };
    $.storage.domSStorage.capacity = {
        canStore: factories.canStore($.storage.domSStorage),
        maxLength: factories.maxLength,
        maxQuanta: function() { return $.storage.domSStorage.capacity.maxSize(); },
        maxSize: function() {
            var result = 0;
            if ($.browser.msie && parseFloat($.browser.version) >= 8) {
                result = 10485760; // 10 MB
            } else if ($.browser.mozilla && parseFloat($.browser.version) >= 1.8) {
                result = 5242880; // 5 MB
            }/* else if ($.browser.opera && $.browser.version >= 10??) { // no opera support YET
                result = 3145728; // 3 MB -- according to rumor
            } */else if ($.browser.safari && parseFloat($.browser.version) >= 4) {
                result = 10485760; // Unknown Quota !!!
            }
            $.storage.domSStorage.capacity.maxSize = function() { return result; };
            // TODO: since persistent and session quotas should (?) be the same, might go ahead and set the other
            if ($.storage.settings.debug) { console.debug("Storage: Session Dom Storage Quota: %d", result); }
            return result;
        },
        length: function() { return window.sessionStorage.length; },
        size: function() { // Approximation -- can know size of localStorage, but not globalStorage
                           // for IE, might be able to do maxSize - availableSize
            var size = 0;
            var i = window.sessionStorage.length;
            while (i--) {
                size += $.storage.utilities.sizeof(window.sessionStorage.getItem(window.sessionStorage.key(i)).value);
            }
            return size;
        },
        availableLength: factories.availableLength($.storage.domSStorage),
        availableSize: function() {
            if ($.browser.msie) {
                $.storage.domSStorage.capacity.availableSize = function() {
                    return window.sessionStorage.remainingSpace();
                };
                return window.sessionStorage.remainingSpace();
            }
            $.storage.domSStorage.capacity.availableSize = function() {
                return $.storage.domSStorage.capacity.maxSize() - $.storage.domSStorage.capacity.size();
            };
            return $.storage.domSStorage.capacity.availableSize();
        }
    };
} // domSStorage

{ // IE5+ userData Behavior
    $.storage.userData = {};
    $.extend($.storage.userData, {
        name: "IE UserData",
        has: factories.has($.storage.userData),
        _enabled: null,
        enabled: factories.enabled($.storage.userData)
    });
    $.storage.userData.set = function(name, value, opts, callback) {
        $.storage.userData.enabled(function(enabled) {
            if (enabled) {
                value = $.storage.utilities.toJSON(value);
                if ($.storage.userData.capacity.canStore(value)) {
                    if ($.storage.settings.debug) { console.debug("Storage: Setting %s = %o to User Data", name, value); }
                    $("#storageUserDataObject").attr(name, value)[0].save("storage");
                    $.storage.utilities.pendingResult[name] = true;
                }
            }
            callback($.storage.utilities.pendingResult[name]);
        });
    };
    $.storage.userData.get = function(name, opts, callback) {
        $.storage.userData.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Attempting to retrieve %s from User Data", name); }
                $.storage.utilities.pendingResult[name] = $.storage.utilities.fromJSON($("#storageUserDataObject").attr(name));
            }
            callback($.storage.utilities.pendingResult[name]);
        });
    };
    $.storage.userData.clear = function(name, opts, callback) {
        $.storage.userData.enabled(function(enabled) {
            if (enabled) {
                $.storage.userData.has(name, opts, function(found) {
                    if (found) {
                        if ($.storage.settings.debug) { console.debug("Storage: Removing %s from User Data", name); }
                        $("#storageUserDataObject").removeAttr(name)[0].save("storage");
                        $.storage.utilities.pendingResult[name] = true;
                    }
                    callback($.storage.utilities.pendingResult[name]);
                });
            } else {
                callback(false);
            }
        });
    };
    $.storage.userData.list = function(opts, callback) {
        $.storage.userData.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Listing User Data entries"); }
                var sudo = $("#storageUserDataObject")[0];
                sudo.load("storage");
                var i = sudo.attributes.length;
                while (i--) {
                    $.storage.utilities.pendingResult.push(sudo.attributes[i].name);
                }
            }
            callback($.storage.utilities.pendingResult);
        });
    };
    $.storage.userData.available = function(callback) {
        var result = false;
        if ($.storage.settings.debug) { console.debug("Storage: Testing if userData behavior is available"); }
        if ($.browser.msie && parseFloat($.browser.version) >= 5) {
          result = true;
          if ($.storage.settings.debug) { console.debug("Storage: Appending div with userData behavior to body"); }
          $("<storage:obj id='storageUserDataObject'></storage:obj>").css({ behavior: "url(#default#userData)"}).appendTo("body");
          // Note, shows up in Firebug Lite as "div.." instead of "div@storageUserDataObject"
          // BUG, IE (7 at least) adds 79 attributes and event handlers :(
        } else {
          $.storage.utilities.dropFromStacks($.storage.userData);
        }
        $.storage.userData.available = function(callback) { callback(result); };
        callback(result);
    };
    $.storage.userData.capacity = {
        canStore: factories.canStore($.storage.userData),
        maxLength: factories.maxLength,
        maxQuanta: factories.maxLength,
        maxSize: function() { return 131072; }, // TODO: it's complicated, ranges from 64k to 512k depending on security zone
        length: function() { return $("#storageUserDataObject")[0].attributes.length; },
        size: function() { return $.storage.utilities.sizeof($("#storageUserDataObject")[0].attributes); },
        availableLength: factories.availableLength($.storage.userData),
        availableSize: factories.availableSize($.storage.userData)
    };
} // userData

{ // window.name
    $.storage.windowName = {};
    $.extend($.storage.windowName, {
        name: "window.name",
        has: factories.has($.storage.windowName),
        _enabled: null,
        enabled: factories.enabled($.storage.windowName),
        _cache: {}
    });
    $.storage.windowName.set = function(name, value, opts, callback) {
        $.storage.windowName.enabled(function(enabled) {
            if (enabled) {
                value = $.storage.utilities.toJSON(value);
                if ($.storage.windowName.capacity.canStore(value)) {
                    if ($.storage.settings.debug) { console.debug("Storage: Adding %s = %o to window.name Cache", name, value); }
                    $.storage.windowName._cache[name] = value;
                    if ($.storage.settings.debug) { console.debug("Storage: Writing Cache to window.name"); }
                    window.name = $.storage.utilities.toJSON($.storage.windowName._cache); // might need a try catch
                    $.storage.utilities.pendingResult[name] = true;
                }
            }
            callback($.storage.utilities.pendingResult[name]);
        });
    };
    $.storage.windowName.get = function(name, opts, callback) {
        $.storage.windowName.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Attempting to retrieve %s from window.name", name); }
                if ($.storage.windowName._cache.hasOwnProperty(name)) {
                    $.storage.utilities.pendingResult[name] = $.storage.windowName._cache[name];
                }
            }
            callback($.storage.utilities.pendingResult[name]);
        });
    };
    $.storage.windowName.clear = function(name, opts, callback) {
        $.storage.windowName.enabled(function(enabled) {
            if (enabled) {
                $.storage.windowName.has(name, opts, function(found) {
                    if (found) {
                        if ($.storage.settings.debug) { console.debug("Storage: Removing %s from window.name", name); }
                        delete $.storage.windowName._cache[name];
                        window.name = $.storage.utilities.toJSON($.storage.windowName._cache);
                        $.storage.utilities.pendingResult[name] = true;
                    }
                    callback($.storage.utilities.pendingResult[name]);
                });
            } else {
                callback(false);
            }
        });
    };
    $.storage.windowName.list = function(opts, callback) {
        $.storage.windowName.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Listing window.name entries"); }
                for (var k in $.storage.windowName._cache) {
                    if ($.storage.windowName._cache.hasOwnProperty(k)) {
                        $.storage.utilities.pendingResult.push(k);
                    }
                }
            }
            callback($.storage.utilities.pendingResult);
        });
    };
    $.storage.windowName.available = function(callback) {
        if (window.name.length) {
            if ($.storage.settings.debug) { console.debug("Storage: Of course window.name exists!"); }
            var o = $.storage.utilities.fromJSON(window.name);
            if ("object" != typeof o) {
                o = { original_window_name: o };
            }
            if ($.storage.settings.debug) { console.debug("Storage: Caching window.name"); }
            $.storage.windowName._cache = o;
        }
        $.storage.windowName.available = function(callback) { callback(true); };
        callback(true); // always on, if javascript is on -- TODO: verify
    };
    $.storage.windowName.capacity = {
        canStore: factories.canStore($.storage.windowName),
        maxLength: factories.maxLength,
        maxQuanta: factories.maxLength,
        maxSize: function() {
            var result = 10485760;
            if ($.browser.opera) {
                result = 2097152;
            }
            $.storage.windowName.capacity.maxSize = function() { return result; };
            if ($.storage.settings.debug) { console.debug("Storage: window.name max length: %d", result); }
            return result;
        },
        length: function() { return $.storage.windowName._cache.length; }, // ?
        size: function() { return window.name.length; },
        availableLength: factories.availableLength($.storage.windowName),
        availableSize: factories.availableSize($.storage.windowName)
    };
} // windowName

{ // HTML 5 Database -- NOTE, there is also a openDatabaseSync method
    $.storage.openDatabase = {};
    $.extend($.storage.openDatabase, {
        name: "OpenDatabase",
        has: factories.has($.storage.openDatabase),
        _enabled: null,
        enabled: factories.enabled($.storage.openDatabase),
        _db: null
    });
    $.storage.openDatabase.set = function(name, value, opts, callback) {
        $.storage.openDatabase.enabled(function(enabled) {
            if (enabled) {
                value = $.storage.utilities.toJSON(value);
                $.storage.openDatabase.capacity.canStore(value, function(canstore) {
                    if (canstore) {
                        if ($.storage.settings.debug) { console.debug("Storage: Setting %s = %o using HTML5 Database", name, value); }
                        $.storage.openDatabase.has(name, opts, function(found) {
                            if (found) {
                                $.storage.openDatabase.exec("UPDATE nameValuePairs SET value=? WHERE name=?;", [ value, name ]);
                            } else {
                                $.storage.openDatabase.exec("INSERT INTO nameValuePairs (name, value) VALUES (?, ?);", [ name, value ]);
                            }
                            $.storage.utilities.pendingResult[name] = true;
                            callback($.storage.utilities.pendingResult[name]); // might need to go in exec callback
                        });
                    } else {
                        callback(false);
                    }
                });
            } else {
                callback(false);
            }
        });
    };
    $.storage.openDatabase.get = function(name, opts, callback) {
        $.storage.openDatabase.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Attempting to retrieve %s using HTML5 Database", name); }
                $.storage.openDatabase.exec("SELECT value FROM nameValuePairs WHERE name=?;", [ name ], function(tx, results) {
                    if (results.rows.length) {
                        $.storage.utilities.pendingResult[name] = results.rows.item(0).value;
                    }
                    callback($.storage.utilities.pendingResult[name]);
                });
            } else {
                callback(false);
            }
        });
    };
    $.storage.openDatabase.clear = function(name, opts, callback) {
        $.storage.openDatabase.enabled(function(enabled) {
            if (enabled) {
                $.storage.openDatabase.has(name, opts, function(found) {
                    if (found) {
                        if ($.storage.settings.debug) { console.debug("Storage: Removing %s from HTML5 Database", name); }
                        $.storage.openDatabase.exec("DELETE FROM nameValuePairs WHERE name=?;", [ name ]);
                        $.storage.utilities.pendingResult[name] = true;
                    }
                    callback($.storage.utilities.pendingResult[name]);
                });
            } else {
                callback(false);
            }
        });
    };
    $.storage.openDatabase.list = function(opts, callback) {
        $.storage.openDatabase.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Listing HTML5 Database Entries"); }
                $.storage.openDatabase.exec("SELECT name FROM nameValuePairs;", [], function(tx, results) {
                    if (results.rows.length) {
                        var i = -1;
                        var max = results.rows.length;
                        while (++i < max) {
                            $.storage.utilities.pendingResult.push(results.rows.item(i).name);
                        }
                    }
                    callback($.storage.utilities.pendingResult);
                });
            } else {
                callback($.storage.utilities.pendingResult);
            }
        });
    };
    $.storage.openDatabase.exec = function(sql, params, callback) {
        $.storage.openDatabase.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Executing '%s' on HTML5 Database with params %o", sql, params); }
                $.storage.openDatabase._db.transaction(function(tx) {
                    tx.executeSql(sql, params, callback);
                });
            } else {
                if (callback) {
                    callback();
                }
            }
        });
    };
    $.storage.openDatabase.available = function(callback) {
        var result = false;
        if ($.storage.settings.debug) { console.debug("Storage: Testing if window.openDatabase exists"); }
        try {
            if ("undefined" != typeof window.openDatabase) {
                $.storage.openDatabase._db = window.openDatabase("Storage", "1.0", "jQuery Storage Database", $.storage.openDatabase.capacity.maxSize()); // last param might be required.  supposed to be the "anticipated size"
                if ($.storage.openDatabase._db) {
                    result = true;
                    $.storage.openDatabase._db.transaction(function(tx) { // Create our table, if it doesn't already exist
                        tx.executeSql("CREATE TABLE IF NOT EXISTS nameValuePairs (name TEXT, phrase TEXT)");
                    });
                }
            }
        } catch(e) {}
        $.storage.openDatabase.available = function (callback) { callback(result); };
        if (!result) {
            $.storage.utilities.dropFromStacks($.storage.openDatabase);
        }
        callback(result);
    };
    $.storage.openDatabase.capacity = {
        canStore: function(obj, callback) {
            $.storage.openDatabase.capacity.availableSize(function(avs) {
                callback($.storage.utilities.sizeof(obj) <= avs);
            });
        },
        maxLength: factories.maxLength,
        maxQuanta: factories.maxLength,
        maxSize: function() { return 10485760; }, // arbitrary ?
        length: function(callback) {
            $.storage.openDatabase.exec("SELECT COUNT(name) AS 'count' FROM nameValuePairs", [], function(tx, results) { // Not 100% sure about this
                callback(results.rows.item(0).count); // not 100% sure about this
            });
        },
        size: function(callback) { callback(0); }, // Not sure how to get this
        availableLength: function(callback) {
            $.storage.openDatabase.capacity.length(function(len) {
                callback($.storage.openDatabase.capacity.maxLength() - len);
            });
        },
        availableSize: function(callback) {
            $.storage.openDatabase.capacity.size(function(size) {
                callback($.storage.openDatabase.capacity.maxSize() - size);
            });
        }
    };
} // openDatabase -- needs testing

{ // Gears Plugin / Chrome
    $.storage.gears = {};
    $.extend($.storage.gears, {
        name: "Gears",
        has: factories.has($.storage.gears),
        _enabled: null,
        enabled: factories.enabled($.storage.gears),
        _db: null
    });
    $.storage.gears.set = function(name, value, opts, callback) {
        $.storage.gears.enabled(function(enabled) {
            if (enabled) {
                value = $.storage.utilities.toJSON(value);
                if ($.storage.gears.capacity.canStore(value)) {
                    if ($.storage.settings.debug) { console.debug("Storage: Setting %s = %o using HTML5 Database", name, value); }
                    $.storage.gears.has(name, opts, function(found) {
                        if (found) {
                            $.storage.gears._db.execute("UPDATE nameValuePairs SET value=? WHERE name=?;", [ value, name ]);
                        } else {
                            $.storage.gears._db.execute("INSERT INTO nameValuePairs (name, value) VALUES (?, ?);", [ name, value ]);
                        }
                        $.storage.utilities.pendingResult[name] = true;
                        callback($.storage.utilities.pendingResult[name]); // might need to go in exec callback
                    });
                }
            } else {
                callback(false);
            }
        });
    };
    $.storage.gears.get = function(name, opts, callback) {
        $.storage.gears.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Attempting to retrieve %s using Gears Database", name); }
                var rs = $.storage.gears._db.execute("SELECT value FROM nameValuePairs WHERE name=?;", [ name ]);
                if (rs.isValidRow()) {
                    $.storage.utilities.pendingResult[name] = rs.field(0);
                }
                callback($.storage.utilities.pendingResult[name]);
            } else {
                callback(false);
            }
        });
    };
    $.storage.gears.remove = function(name, opts, callback) {
        $.storage.gears.enabled(function(enabled) {
            if (enabled) {
                $.storage.gears.has(name, opts, function(found) {
                    if (found) {
                        if ($.storage.settings.debug) { console.debug("Storage: Removing %s from Gears Database", name); }
                        $.storage.gears._db.execute("DELETE FROM nameValuePairs WHERE name=?;", [ name ]);
                        $.storage.utilities.pendingResult[name] = true;
                    }
                    callback($.storage.utilities.pendingResult[name]);
                });
            } else {
                callback(false);
            }
        });
    };
    $.storage.gears.list = function(opts, callback) {
        $.storage.gears.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Listing Gears Database Entries"); }
                var rs = $.storage.gears._db.execute("SELECT name FROM nameValuePairs;", []);
                while (rs.isValidRow()) {
                    $.storage.utilities.pendingResult.push(rs.field(0));
                    rs.next();
                }
            }
            callback($.storage.utilities.pendingResult);
        });
    };
    $.storage.gears.exec = function(sql, params, callback) {
        $.storage.gears.enabled(function(enabled) {
            if (enabled) {
                if ($.storage.settings.debug) { console.debug("Storage: Executing '%s' on Gears Database with params %o", sql, params); }
                var rs = $.storage.gears._db.execute(sql, params);
                callback(rs);
            } else {
                callback();
            }
        });
    };
    $.storage.gears.available = function(callback) {
        var result = false;
        // Copied (with minor mods) from gears_init.js
        var factory = null;
        // Firefox
        if (typeof GearsFactory != 'undefined') {
            factory = new GearsFactory();
        } else {
            // IE
            try {
                factory = new ActiveXObject('Gears.Factory');
                // privateSetGlobalObject is only required and supported on IE Mobile on WinCE.
                if (factory.getBuildInfo().indexOf('ie_mobile') != -1) {
                    factory.privateSetGlobalObject(this);
                }
            } catch (e) {
                // Safari
                if ((typeof navigator.mimeTypes != 'undefined')
                     && navigator.mimeTypes["application/x-googlegears"]) {
                    factory = document.createElement("object");
                    factory.style.display = "none";
                    factory.width = 0;
                    factory.height = 0;
                    factory.type = "application/x-googlegears";
                    document.documentElement.appendChild(factory);
                }
            }
        }

        // *Do not* define any objects if Gears is not installed. This mimics the
        // behavior of Gears defining the objects in the future.
        if (factory) {
            if (!window.google) {
                google = {};
            }
            if (!google.gears) {
                google.gears = {factory: factory};
            }
            // End Copy
            result = true;
            $.storage.gears._db = google.gears.factory.create("beta.database");
            $.storage.gears._db.open("jQuery_Storage_Database");
            $.storage.gears._db.execute("CREATE TABLE IF NOT EXISTS nameValuePairs (name TEXT, value TEXT)");
        }
        $.storage.gears.available = function(callback) { callback(result); };
        callback(result);
    };
    $.storage.gears.capacity = {
        canStore: factories.canStore($.storage.gears),
        maxLength: factories.maxLength,
        maxQuanta: factories.maxLength,
        maxSize: factories.maxLength,
        length: function() { return 0; }, // TODO
        size: function() { return 0; }, // TODO
        availableLength: factories.availableLength($.storage.gears),
        availableSize: factories.availableSize($.storage.gears)
    };
} // gears

{}    // TODO: Silverlight "Isolated" Storage -- if possible

{}    // TODO: Remote Storage -- last resort

    $.storage.utilities = {
        sizeof: function(obj) { // Rough estimate -- todo: convert to json string and get string length
            return $.storage.utilities.toJSON(obj).length;

            // TODO: might need to do something different for userData
/*            var result = 0;
            if ("array" == typeof obj || "undefined" != typeof obj.getNamedItem) { // todo, does this have the same name in all browsers?
                var i = obj.length;
                while (i--) {
                    result += $.storage.utilities.sizeof(obj[i]);
                }
            } else if("undefined" != typeof obj.nodeValue) {
                result = ((null !== obj.nodeValue) ? obj.nodeValue.length : 0 );
                if (undefined === result) {
                    result = 0;
                }
                result += obj.nodeName.length;
            } else if ("object" == typeof obj) {
                for (var k in obj) {
                    if (obj.hasOwnProperty(k)) {
                        result += $.storage.utilities.sizeof(obj[k]);
                    }
                }
            } else  {
                result = String(obj).length;
            }
            return result;*/
        },
        stack: function(mode) {
            if ("session" == mode || "cache" == mode) {
                return $.storage.settings.sessionStack;
            } else if ("database" == mode || "db" == mode) {
                return $.storage.settings.databaseStack;
            } else if ("header" == mode || "cookie" == mode) {
                return [ $.storage.httpCookies ];
            }
            return $.storage.settings.persistentStack;
        },
        dropFromStacks: function(ns) {
            if ($.storage.settings.debug) { console.debug("Storage: Dropping %o From Stacks", ns.name); }
            var f = function(stack) {
                var i = stack.length;
                while (i--) {
                    if (stack[i] == ns) {
                        stack.splice(i,1);
                        return;
                    }
                }
            };
            f($.storage.settings.readingStack);
            f($.storage.settings.persistentStack);
            f($.storage.settings.sessionStack);
            f($.storage.settings.databaseStack);
        },
        toJSON: function(value) {
            if ("string" != typeof value) {
                if ("undefined" != typeof JSON) {
                    value = JSON.stringify(value);
                } else {
                    try {
                         if ($.isFunction(value.toSource)) {
                             value = value.toSource(); // can be a little verbose
                         }
                    } catch(_) {}
                }
            }
            return value;
        },
        fromJSON: function(value) {
            var obj;
            try {
                obj = eval("(" + value + ")");
            } catch(_) {
                obj = value;
            }
            return obj||null;
        },
        pendingResult: null,
        workQueue: [],
        working: false,
        worker: function(next) {
            if (!next && $.storage.utilities.working) {
                return;
            }
            //console.debug("Work Queue Length: %d, Next Item: %s", $.storage.utilities.workQueue.length, $.storage.utilities.workQueue[0].toString());
            if ($.storage.utilities.workQueue.length) {
                $.storage.utilities.working = true;
                ($.storage.utilities.workQueue.shift())();
            } else {
                $.storage.utilities.working = false;
            }
        },
        setStacks: function(convention) {
            convention = $.storage.settings._conventions[convention];
            var i = -1;
            var max = convention[0].length;
            $.storage.settings.readingStack = [];
            while (++i < max) {
                $.storage.settings.readingStack.push($.storage.settings._rawStack[convention[0][i]]);
            }
            i = -1;
            max = convention[1].length;
            $.storage.settings.persistentStack = [];
            while (++i < max) {
                $.storage.settings.persistentStack.push($.storage.settings._rawStack[convention[1][i]]);
            }
            i = -1;
            max = convention[2].length;
            $.storage.settings.sessionStack = [];
            while (++i < max) {
                $.storage.settings.sessionStack.push($.storage.settings._rawStack[convention[2][i]]);
            }
            i = -1;
            max = convention[3].length;
            $.storage.settings.databaseStack = [];
            while (++i < max) {
                $.storage.settings.databaseStack.push($.storage.settings._rawStack[convention[3][i]]);
            }
        }
    };

    $.storage.settings = {
        _rawStack: [
            $.storage.domPStorage,
            $.storage.domSStorage,
            $.storage.userData,
            $.storage.flashCookies,
            $.storage.httpCookies,
            $.storage.windowName,
            $.storage.openDatabase,
            $.storage.gears
        ],
        _conventions: {
            original: [[0,1,2,3,4,5,6,7], [0,2,3,4,6,7], [1,5,4], [6,7]],
            highPerformance: [[0,1,2,3,4,5,6,7], [0,2,3,4,6,7], [1,5,4], [6,7]], // no metrics yet
            standardsCompliant: [[0,1,6], [0], [1], [6]],
            oldFashioned: [[4,5], [4], [4,5], []],
            pluginsOnly: [[3,7], [3], [3], [7]],
            ie: [[2,3,4,5,7], [2,3,4,7], [5,4], [7]],
            ie8: [[0,1,2,3,4,5,7], [0,2,3,4,7], [1,5,4], [7]],
            ff: [[0,1,3,4,5,7], [0,3,4,7], [1,5,4], [7]],
            safari: [[3,4,5,6], [3,4,6], [5,4], [6]],
            safari4: [[0,1,3,4,5,6], [0,3,4,6], [1,5,4], [6]],
            opera: [[3,4,5,7], [3,4,7], [5,4], [7]]
        },
        debug: true,
        swfUrl: "/storage.swf",
        aggressiveHttpCookieManagement: false, // will combine available cookie 'slots' into 1 big name/value object
        readingStack: [],
        persistentStack: [],
        sessionStack: [],
        databaseStack: []
    };

    $.storage.utilities.setStacks("original");
})(jQuery);
