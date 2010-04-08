/*jslint white: true, browser: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false*/
"use strict";

/** Gilt Groupe SizeChart Plugin
 *
 * @version 0.9
 * @requires jQuery v1.3, jQueryUI v1.7, Caret Plugin
 * @author Kevan Davis
 * @copyright Copyright (c) 2009, Gilt Groupe
 *
 * Distributed under the terms of the GNU General Public License
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * @TODO: Compress it, once it's stable
 */
(function ($) {
  $.widget("ui.sizechart", {
    _init: function () {
      if (!this.options.testElement) {
        this.options.testElement = this.element;
      }
      this.render();
      var sortStartIndex, sortStopIndex, This = this;
      if (this.options.editable) {
        this.element.sortable({
          axis: "y",
          containment: this.element,
          items: "tr",
          tolerance: "pointer",
          start: function (ev, ui) {
            sortStartIndex = ui.item.prevAll().length;
            if (ui.item.parent("tbody").length) {
              sortStartIndex += 1;
            }
          },
          stop: function (ev, ui) {
            sortStopIndex = ui.item.prevAll().length;
            if (ui.item.parent("tbody").length && sortStartIndex) {
              sortStopIndex += 1;
            }
            var row = This.options.data.splice(sortStartIndex, 1)[0];
            This.options.data.splice(sortStopIndex, 0, row);
            if (ui.item.parent("thead").length) {
              This.element.find("tbody").prepend(This.element.find("thead tr:last"));
            } else if (!This.element.find("thead tr").length) {
              This.element.find("thead").prepend(This.element.find("tbody tr:first"));
            }
            This.render();
          }
        });
      }
    },
    _calcMinWidth: function (col) {
      var min = 0,
        testTable = $(this.options.templates.table).appendTo(this.options.testElement),
        testRow = $("<tr/>"),
        i, test, changed = false;
      testTable.append(testRow);
      for (i = 0; i < this.options.data.length; i += 1) {
        test = $("<td>" + this.options.data[i].entries[col] + "</td>").appendTo(testRow);
        if (!this.options.padding) {
          this.options.padding = {
            l: parseInt(test.css("padding-left") || "0", 10),
            r: parseInt(test.css("padding-right") || "0", 10),
            t: parseInt(testTable.css("border-spacing") || "0", 10)
          };
        }
        min = Math.max(min, test.width());
        test.remove();
      }
      testTable.remove();
      if (this.options.widths[col] !== min) {
        changed = true;
      }
      this.options.widths[col] = min;
      return changed;
    },
    _calcColumnSets: function () {
      var sets = [],
        colsRemaining = this.options.data[0].entries.length - this.options.repeatFirstNColumns,
        sanity = 100,
        nextCol = this.options.repeatFirstNColumns,
        padding = this.options.padding,
        set, curWidth, i;
      while (colsRemaining && sanity) {
        sanity -= 1;
        set = { snap: false, cols: [] };
        curWidth = -padding.t;
        for (i = 0; i < this.options.repeatFirstNColumns; i += 1) {
          set.cols.push(i);
          curWidth += this.options.widths[i] + padding.l + padding.r + padding.t + this.options.fudgeFactor;
        }
        if (curWidth >= this.options.width) {
          throw "Min Width of Repeating Columns exceeds Max Width of the Table";
        }
        for (i = nextCol; i < this.options.data[0].entries.length; i += 1) {
          if (curWidth + this.options.widths[i] + padding.l + padding.r + padding.t + this.options.fudgeFactor <= this.options.width) {
            set.cols.push(i);
            curWidth += this.options.widths[i] + padding.l + padding.r + padding.t + this.options.fudgeFactor;
            colsRemaining -= 1;
            nextCol += 1;
          } else {
            break;
          }
        }
        set.width = curWidth;
        set.snap = (curWidth >= this.options.snapPoint);
        sets.push(set);
      }
      return sets;
    },
    _clickCell: function () {
      var This = $(this).closest("table").parent().data("sizechart"),
        wasrerendered, t_row, t_col, t_check, input, extra;
      if (!(This.options.sizeMode && this === This.element.find("td:first")[0])) {
        wasrerendered = false;
        t_row = $(this).closest("tr").prevAll().length;
        if ($(this).closest("tbody").length) {
          t_row += 1;
        }
        t_col = $(this).closest("td").prevAll().length;
        $(this).closest("table").prevAll("table").each(function () {
          t_col += $(this).find("tr:first td").length - This.options.repeatFirstNColumns;
        });
        This.element.find("td input").each(function () {
          var row = $(this).closest("tr").prevAll().length,
            col = $(this).closest("td").prevAll().length,
            p, extra;
          if ($(this).closest("tbody").length) {
            row += 1;
          }
          if (col >= This.options.repeatFirstNColumns) {
            $(this).closest("table").prevAll("table").each(function () {
              col += $(this).find("tr:first td").length - This.options.repeatFirstNColumns;
            });
          }
          This.options.data[row].entries[col] = $(this).val();
          if (This._calcMinWidth(col)) {
            This.render();
            wasrerendered = true;
          }
          p = $(this).parent();
          extra = p.find("a");
          p.html($(this).val() || "&nbsp;").prepend(extra);
        });
        if (wasrerendered) {
          t_check = 0;
          This.element.find("table").each(function () {
            t_check += $(this).find("tr:first td").length;
            if (t_check < t_col) {
              t_col += This.options.repeatFirstNColumns;
            } else {
              return false;
            }
          });
          This.element.find("table").find("tr:eq(" + t_row + ") td").eq(t_col).trigger("click");
          return;
        }
        input = $("<input type='text'/>");
        extra = $(this).find("a");
        $("body").append(extra);
        input.val($.trim($(this).text()));
        $(this).html("").append(input);
        input.before(extra);
        input.focus().blur(function () {
          $("body").append(extra);
          var p = input.parent(),
           row = p.parent().prevAll().length,
           col = p.prevAll().length;
          if (p.closest("tbody").length) {
            row += 1;
          } 
          if (col >= This.options.repeatFirstNColumns) {
            p.closest("table").prevAll("table").each(function () {
              col += $(this).find("tr:first td").length - This.options.repeatFirstNColumns;
            });
          }
          This.options.data[row].entries[col] = input.val();
          if (This._calcMinWidth(col)) {
            This.render();
          }
          p.html(input.val() || "&nbsp;");
          p.prepend(extra);
        });
        if (This.options.editable) {
          input.keydown(function (ev) {
            var col, target, row, cell, pos, set;
            switch (ev.which) {
            case 38: // up
              if (!ev.shiftKey && !input.caret()) {
                ev.preventDefault();
                if (input.closest("tr").prevAll("tr").length) {
                  target = input.closest("tr").prev("tr").find("td:eq(" + input.parent().prevAll("td").length + ")");
                  target.trigger("click");
                  input.blur();
                } else if (input.closest("tbody").length) {
                  target = input.closest("table").find("thead td:eq(" + input.parent().prevAll("td").length + ")");
                  target.trigger("click");
                  input.blur();
                }
              }
              break;
            case 40: // down
              if (!ev.shiftKey && input.caret() === input.val().length) {
                ev.preventDefault();
                if (ev.altKey && This.options.editable) {
                  col = input.closest("td").prevAll().length;
                  This.addrow();
                  This.element.find("tr:eq(" + (This.element.find("tr").length - 2) + ") td:eq(" + col + ")").trigger("click");
                }
                if (input.closest("tr").nextAll("tr").length) {
                  target = input.closest("tr").next("tr").find("td:eq(" + input.parent().prevAll("td").length + ")");
                  target.trigger("click");
                  input.blur();
                } else if (input.closest("thead").length) {
                  target = input.closest("table").find("tbody tr:first td:eq(" + input.parent().prevAll("td").length + ")");
                  target.trigger("click");
                  input.blur();
                }
              }
              break;
            case 37: // left
              if (!ev.shiftKey && !input.caret()) {
                ev.preventDefault();
                if (input.parent().prevAll("td").length) {
                  target = input.parent().prev("td");
                  target.trigger("click");
                  input.blur();
                }
              }
              break;
            case 39: // right
              if (!ev.shiftKey && input.caret() === input.val().length) {
                ev.preventDefault();
                if (ev.altKey && This.options.editable) {
                  row = input.closest('tr').prevAll().length;
                  if (input.closest("tbody").length) {
                    row += 1;
                  }
                  This.addcolumn();
                  This.element.find("tr:eq(" + row + ") td:last").trigger("click");
                }
                if (input.parent().nextAll("td").length) {
                  target = input.parent().next("td");
                  target.trigger("click");
                  input.blur();
                }
              }
              break;
            case 9: // tab
              ev.preventDefault();
              cell = $(this).parent()[0];
              pos = $(this).prevAll("td").length;
              set = This.element.find("td");
              if (This.options.sizeMode) {
                set = set.not(":first");
              }
              set.each(function (i) {
                if (this === cell) {
                  pos = i;
                  return false;
                }
              });
              if (!ev.shiftKey) {
                if (pos === set.length - 1) {
                  pos = 0;
                } else {
                  pos += 1;
                }
              } else {
                if (0 === pos) {
                  pos = set.length - 1;
                } else {
                  pos -= 1;
                }
              }
              set.eq(pos).trigger("click");
              $(this).blur();
              break;
            case 13: // enter
              ev.preventDefault();
              break;
            }
          });
        }
      } else {
        $(this).next("td").trigger('click');
      }
    },
    render: function () {
      this.element.empty();
      if (this.options.data.length) {
        for (var i = 0; i < this.options.data[0].entries.length; i += 1) {
          this._calcMinWidth(i);
        }
        this._render();
      }
    },
    _render: function () {
      var This = this,
        sets = this._calcColumnSets(),
        i, table, section, j, row, k, cell, btn, lastrow,
        clickHandler = function (ev) {
          ev.preventDefault();
          var i = $(this).closest("tr").prevAll().length + 1;
          //This.options.data.splice(i, 1);
          This.options.data[i]._delete = true;
          This.render();
        },
        eachColFactory = function (j) {
          var set = sets[i];
          btn = $(This.options.templates.removeColButton);
          if (j >= This.options.repeatFirstNColumns) {
            btn.find("a").click(function (ev) {
              ev.preventDefault();
              var index = set.cols[j], k;
              for (k = 0; k < This.options.data.length; k += 1) {
                This.options.data[k].entries.splice(index, 1);
              }
              This.render();
            });
          } else {
            btn.empty();
          }
          lastrow.append(btn);
        };
      for (i = 0; i < sets.length; i += 1) {
        table = $(this.options.templates.table);
        this.element.append(table);
        for (j = 0; j < this.options.data.length; j += 1) {
          if (this.options.data[j]._delete) {
            continue;
          }
          row = $("<tr/>");
          if (!j) {
            section = $("<thead/>").appendTo(table);
            section.append(row);
            section = $("<tbody/>").appendTo(table);
          } else {
            section.append(row);
          }
          for (k = 0; k < sets[i].cols.length; k += 1) {
            if (j || k || !this.options.sizeMode) {
              cell = $("<td>" + (this.options.data[j].entries[sets[i].cols[k]] || "&nbsp;") + "</td>");
              if (this.options.editable) {
                cell.click(this._clickCell);
              }
            } else {
              cell = $("<td/>");
            }
            row.append(cell);
            if (!k) {
              if (j && this.options.editable && this.options.data.length > 2) {
                btn = $(this.options.templates.removeRowButton);
                btn.click(clickHandler);
                cell.prepend(btn);
              }
              if (this.options.sizeMode) {
                cell.addClass("first");
              }
            }
          }
        }
        if (this.options.editable && this.options.data[0].entries.length > this.options.repeatFirstNColumns + 1) {
          lastrow = $("<tr/>");
          table.append(lastrow);
          $.each(sets[i].cols, eachColFactory);
        }
        if (sets[i].snap) {
          table.css("width", "");
        }
      }
      this.element.find("thead td:not(.first)").hover(
        function () {
          This.element.find(".hover").removeClass("hover");
          var i = $(this).prevAll().length;
          $(this).closest("table").find("tbody tr").find("td:eq(" + i + ")").addClass("hover");
        },
        function () {
          This.element.find(".hover").removeClass("hover");
        }
      );
      this.element.find("tbody tr").hover(
        function () {
          This.element.find(".hover").removeClass("hover");
          var i = $(this).prevAll().length;
          This.element.find("tbody").find("tr:eq(" + i + ")").find("td").addClass("hover");
        },
        function () {
          This.element.find(".hover").removeClass("hover");
        }
      );
    },
    addcolumn: function () {
      var rows = this.options.data.length, i;
      for (i = 0; i < rows; i += 1) {
        this.options.data[i].entries.push("&nbsp;");
      }
      this.render();
    },
    addrow: function () {
      var cols = this.options.data[0].entries.length,
        newrow = { entries: [] }, i;
      for (i = 0; i < cols; i += 1) {
        newrow.entries.push("&nbsp;");
      }
      this.options.data.push(newrow);
      this.render();
    },
    _setData: function (key, value) {
      this.options[key] = value;
      if ("disabled" === key) {
        this.element[value ? "addClass" : "removeClass"](this.widgetBaseClass + "-disabled " + this.namespace + "-state-disabled").attr("aria-disabled", value);
      } else if ("data" === key || "width" === key || "snapPoint" === key || "repeatFirstNColumns" === key || "sizeMode" === key) {
        this.render();
      }
    }
  });
  $.ui.sizechart.defaults = {
    data: [],
    width: 1000,
    snapPoint: 0.5,
    repeatFirstNColumns: 1,
    editable: false,
    sizeMode: true,
    widths: [],
    fudgeFactor: 8,
    testElement: null,
    templates: {
      removeColButton: "<td class='nobg'><a href='#' class='delcol'>x</a></td>",
      removeRowButton: "<a href='#' class='delrow'>x</a>",
      table: "<table style='width: auto;'/>"
    }
  };
}(jQuery));
