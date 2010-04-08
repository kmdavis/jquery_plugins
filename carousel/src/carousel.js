/*jslint white: true, browser: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/**
 * Carousel
 *
 * @version 1.0
 * @requires jQuery v1.3
 * @requires jQueryUI v1.7 (broken in 1.8)
 * @author Kevan Davis
 * @copyright Copyright (c) 2009, Gilt Groupe
 *
 * Distributed under the terms of the GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 */
(function ($) {
  $.widget("ui.carousel", {
    _init: function () {
      var This = this, footer, i, transition, numeral, clickFactory, footerWidth = 0;
      this.element
        .addClass(this.widgetBaseClass)
        .append(this.options.templates.leftArrow)
        .append(this.options.templates.rightArrow);
      if (this.options.showFooter) {
        footer = $(this.options.templates.footer);
        footer
          .addClass(this.widgetBaseClass + "-footer")
          .find("span")
            .addClass(this.widgetBaseClass + "-footer-group")
            .append(this.options.templates.leftArrowSmall)
            .append(this.options.templates.rightArrowSmall)
          .end()
          .appendTo(this.element);
      }
      this.options.maxIndex = this.element.children("ul:first").children("li").length;
      for (i = 0; i < this.element.children("ul").length; i += 1) {
        if (!this.options.transitions[i]) {
          this.options.transitions[i] = $.extend({}, this.options.defaultTransition);
        } else if (!this.options.transitions[i].left) {
          transition = this.options.transitions[i];
          this.options.transitions[i] = {
            left: transition,
            right: transition
          };
        }
      }
      clickFactory = function (i) {
        return function () {
          This.frame(i);
          if (This.options.autoRotate) {
            This.autorotate("stop");
          }
        };
      };
      for (i = 0; i < this.options.maxIndex; i += 1) {
        this.element.children("ul").find("> li:eq(" + i + ")").addClass(this.widgetBaseClass + "-state-" + i);
        if (this.options.showFooter) {
          numeral = $(this.options.templates.number);
          numeral
            .addClass("ui-icon-numeral-" + (i + 1) + (i === this.options.state ? " ui-state-active" : ""))
            .click(clickFactory(i))
            .html($.isFunction(this.options.customFooterTemplate) ? this.options.customFooterTemplate(i) : (i + 1))
            .insertBefore(footer.children("span").children(":last"));
        }
      }
      if (this.options.showFooter) {
        this.element.find("." + this.widgetBaseClass + "-footer-group").each(function () {
          footerWidth += parseInt($(this).css("margin-left"), 10) +
                         parseInt($(this).css("padding-left"), 10) +
                         $(this).width() +
                         parseInt($(this).css("padding-right"), 10) +
                         parseInt($(this).css("margin-right"), 10);
        });
        if (footerWidth > this.element.find("." + this.widgetBaseClass + "-footer").width()) {
          footerWidth = this.element.find("." + this.widgetBaseClass + "-footer").width();
        }
        this.element.find("." + this.widgetBaseClass + "-footer-group").css({
          width: footerWidth,
          left: (this.element.find("." + this.widgetBaseClass + "-footer").width() - footerWidth) / 2
        });
      }
      this.element
        .children("ul")
          .children("li")
            .hide()
            .filter("." + this.widgetBaseClass + "-state-" + this.options.state)
              .show()
            .end()
          .end()
        .end()
        .hover(
        function () {
          $(this).addClass("ui-state-hover");
          if (This.options.keyHandler) {
            $(document).bind("keydown", This, This._keyHandler);
          }
        },
        function () {
          $(this).removeClass("ui-state-hover");
          if (This.options.keyHandler) {
            $(document).unbind("keydown", This._keyHandler);
          }
        }
      ).find(".ui-icon").hover(
        function () {
          This.element.removeClass("ui-state-hover");
          if ($(this).attr("class").match(/\b[\w\-]*arrow[\w\-]*\b/)) {
          $(this).addClass($(this).attr("class").match(/\b[\w\-]*arrow[\w\-]*\b/)[0] + "-hover");
          }
        },
        function () {
          This.element.addClass("ui-state-hover");
          if ($(this).attr("class").match(/\b[\w\-]*-hover\b/)) {
          $(this).removeClass($(this).attr("class").match(/\b[\w\-]*-hover\b/)[0]);
        }
        }
      ).filter(".ui-icon-arrow-1-w, .ui-icon-arrowthick-1-w")
        .click(function () {
          This.rotate("left");
          if (This.options.autoRotate) {
            This.autorotate("start", "left");
          }
        })
        .end()
        .filter(".ui-icon-arrow-1-e, .ui-icon-arrowthick-1-e")
          .click(function () {
            This.rotate("right");
            if (This.options.autoRotate) {
              This.autorotate("start", "right");
            }
          });
      if (this.options.autoRotate) {
        this.autorotate("start");
      }
    },
    frame: function (index, dir) {
      var old_index = this.options.state,
        This = this,
        dir2 = ("right" === dir ? "left" : "right");
      if (index !== old_index) {
        this.options.state = index;
        if (!dir) {
          dir = old_index - index;
          dir = dir / Math.abs(dir);
          dir = (1 === dir ? "left" : "right");
        } 
        this.element.find(":animated").stop(true, true);
        this.element.children("ul").each(function (i) {
          var transition = This.options.transitions[i];
          $.fn.show.apply($(this).children("li." + This.widgetBaseClass + "-state-" + index), transition[dir]);
          $.fn.hide.apply($(this).children("li." + This.widgetBaseClass + "-state-" + old_index), transition[dir2]);
        });
        this.element
          .find("." + this.widgetBaseClass + "-footer-group .ui-icon")
            .removeClass("ui-state-active")
            .filter(".ui-icon-numeral-" + (index + 1))
              .addClass("ui-state-active");
      }
      this._trigger("frame");
    },
    rotate: function (direction) {
      var new_index = this.options.state;
      if ("left" === direction) {
        new_index -= 1;
        if (new_index < 0) {
          if (this.options.loop) {
            new_index = this.options.maxIndex - 1;
          } else {
            new_index = this.options.state;
          }
        }
      } else if ("right" === direction) {
        new_index += 1;
        if (new_index === this.options.maxIndex) {
          if (this.options.loop) {
            new_index = 0;
          } else {
            new_index = this.options.state;
          }
        }
      }
      this._trigger("rotate", null, { direction: direction });
      this.frame(new_index, direction);
    },
    autorotate: function (action, direction) {
      clearInterval(this.options.autoplayInterval);
      if ("start" === action) {
        if (this.options.autoRotateChangesDirection) {
          this.options.autoplayDirection = direction || this.options.autoRotateDefaultDirection;
        } else {
          this.options.autoplayDirection = this.options.autoRotateDefaultDirection;
        }
        var This = this;
        this.options.autoplayInterval = setInterval(function () {
          This.rotate(This.options.autoplayDirection);
        }, this.options.autoRotateInterval);
        this._trigger("autorotate-start");
      } else if ("stop" === action) {
        this._trigger("autorotate-stop");
      }
    },
    _keyHandler: function (ev) {
      var This = ev.data;
      if (37 === ev.keyCode) {
        This.rotate("left");
      } else if (39 === ev.keyCode) {
        This.rotate("right");
      } else if ((0 === ev.keyCode || (47 < ev.keyCode && 58 > ev.keyCode)) && 47 < ev.which && 58 > ev.which) {
        This.frame(ev.which - 49);
      } else if (13 === ev.keyCode || 32 === ev.keyCode || (0 === ev.keyCode && 32 === ev.which)) {
        document.location = This.element.find("li:visible a:first").attr("href");
      } else {
        return;
      }
      ev.preventDefault();
    }
  });
  $.ui.carousel.defaults = {
    autoRotate: true,
    autoRotateInterval: 10000,
    autoRotateDefaultDirection: "right",
    autoRotateChangesDirection: true,
    transitions: [],
    defaultTransition: {
      left: ["slide", { direction: "left", easing: "easeOutQuint" }],
      right: ["slide", { direction: "right", easing: "easeOutQuint" }]
    },
    loop: true,
    keyHandler: true,
    showFooter: true,
    state: 0,
    templates: {
      leftArrowSmall: "<span class='ui-icon ui-icon-arrow-1-w'>&lt;</span>",
      rightArrowSmall: "<span class='ui-icon ui-icon-arrow-1-e'>&gt;</span>",
      leftArrow: "<span class='ui-icon ui-icon-arrowthick-1-w'>&lt;</span>",
      rightArrow: "<span class='ui-icon ui-icon-arrowthick-1-e'>&gt;</span>",
      number: "<span class='ui-icon'></span>",
      footer: "<div><span></span></div>"
    }
  };
}(jQuery));
