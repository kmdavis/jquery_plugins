/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: false, regexp: true, strict: true, newcap: true, immed: true, indent: 2 */
/*global jQuery: false, $: false*/
"use strict";

/**
 * Gilt Groupe Custom Validators
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
jQuery.validator.addMethod("zipcode", function (value, element) {
  return this.optional(element) || /^\d{5}([\- ]?\d{4})?$/.test(value);
}, "Your ZIP-code is invalid");

jQuery.validator.addMethod("phone_number", function (phone_number, element) {
  phone_number = phone_number.replace(/\s+/g, "");
  return this.optional(element) || /^(1-?)?\s*(\([2-9]\d{2}\)|[2-9]\d{2})(-?|\s*)[2-9]\d{2}(-?|\s*)\d{4}(\s*x?\d+)?$/.test(phone_number);
}, "Please specify a valid phone number");

// consistent email validation with blackbird email validation
jQuery.validator.addMethod("bb_email", function (value, element) {
  return this.optional(element) || /^[\w\+\-]+(\.[\w\+\-]+)*@([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}$/i.test(value);
}, jQuery.validator.messages.email);

// same as email, but accepts a csv of emails
jQuery.validator.addMethod("multiemail", function (value, element) {
  return this.optional(element) || /^(((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?\s*[,;]?\s*)+$/i.test(value);
}, jQuery.validator.messages.email);

jQuery.validator.addMethod("currencyUS", function (value, element, range) {
  if (this.optional(element)) {
    return true;
  }
  value = value.replace(/\$|\,/, '');
  if (!/^\d+(\.\d{2})?$/.test(value)) {
    return false;
  }
  value = parseFloat(value);
  if (range) {
    if (range[0] > value || range[1] < value) {
      return false;
    }
  }
  return true;
}, "Please enter a valid dollar amount");

jQuery.validator.addMethod("futureMonth", function (value, element, yearElement) {
  return this.optional(element) || !$(yearElement).val() || (new Date($(yearElement).val(), value, 0)).getTime() > (new Date()).getTime();
}, "Please enter a date in the future");

jQuery.validator.addMethod("creditcard2", function (value, element) {
  if (this.optional(element)) {
    return "dependency-mismatch";
  }
  // accept only digits and dashes and spaces
  if (/^[\d\-\s]+$/.test(value)) {
    return false;
  }
  var nCheck = 0,
    bEven = false,
    n, cDigit, nDigit;

  value = value.replace(/\D/g, "");

  for (n = value.length - 1; n >= 0; n -= 1) {
    cDigit = value.charAt(n);
    nDigit = parseInt(cDigit, 10);
    if (bEven) {
      if ((nDigit *= 2) > 9) {
        nDigit -= 9;
      }
    }
    nCheck += nDigit;
    bEven = !bEven;
  }

  return (nCheck % 10) === 0;
}, jQuery.validator.messages.creditcard);

// Combines Luhn+5 & Prefix validation
jQuery.validator.addMethod("creditcard3", function (value, element, param) {
  if (this.optional(element)) {
    return "dependency-mismatch";
  }
  // accept only digits and dashes and spaces
  if (/^[\d\-\s]+$/.test(value)) {
    return false;
  }

  value = value.replace(/\D/g, "");

  if ("4222222222222" === value) { // Authorize.net force error code credit card number
    $(element).data("creditcardtype", "errorcode");
    return true;
  }

  var nCheck = 0,
    bEven = false,
    n, cDigit, nDigit, validTypes;
  
  for (n = value.length - 1; n >= 0; n -= 1) {
    cDigit = value.charAt(n);
    nDigit = parseInt(cDigit, 10);
    if (bEven) {
      if ((nDigit *= 2) > 9) {
        nDigit -= 9;
      }
    }
    nCheck += nDigit;
    bEven = !bEven;
  }

  if (nCheck % 10 !== 0 && nCheck % 10 !== 5) {
    $(element).data("creditcardtype", "checksum");
    return false;
  }

  param = jQuery.extend({}, jQuery.validator.methods.creditcard3.types, param);

  validTypes = 0x0000;

  if (param.mastercard) {
    validTypes |= 0x0001;
  }
  if (param.visa) {
    validTypes |= 0x0002;
  }
  if (param["american express"]) {
    validTypes |= 0x0004;
  }
  if (param.dinersclub) {
    validTypes |= 0x0008;
  }
  if (param.enroute) {
    validTypes |= 0x0010;
  }
  if (param.discover) {
    validTypes |= 0x0020;
  }
  if (param.jcb) {
    validTypes |= 0x0040;
  }
  if (param.unknown) {
    validTypes |= 0x0080;
  }
  if (param.all) {
    validTypes = 0x0001 | 0x0002 | 0x0004 | 0x0008 | 0x0010 | 0x0020 | 0x0040 | 0x0080;
  }

  if (validTypes & 0x0001 && /^(51|52|53|54|55)/.test(value)) { //mastercard
    $(element).data("creditcardtype", "mastercard");
    return value.length === 16;
  }
  if (validTypes & 0x0002 && /^(4)/.test(value)) { //visa
    $(element).data("creditcardtype", "visa");
    return value.length === 16;
  }
  if (validTypes & 0x0004 && /^(34|37)/.test(value)) { //amex
    $(element).data("creditcardtype", "american express");
    return value.length === 15;
  }
  if (validTypes & 0x0008 && /^(300|301|302|303|304|305|36|38)/.test(value)) { //dinersclub
    $(element).data("creditcardtype", "dinersclub");
    return value.length === 14;
  }
  if (validTypes & 0x0010 && /^(2014|2149)/.test(value)) { //enroute
    $(element).data("creditcardtype", "enroute");
    return value.length === 15;
  }
  if (validTypes & 0x0020 && /^(6011)/.test(value)) { //discover
    $(element).data("creditcardtype", "discover");
    return value.length === 16;
  }
  if (validTypes & 0x0040 && /^(3)/.test(value)) { //jcb
    $(element).data("creditcardtype", "jcb");
    return value.length === 16;
  }
  if (validTypes & 0x0040 && /^(2131|1800)/.test(value)) { //jcb
    $(element).data("creditcardtype", "jcb");
    return value.length === 15;
  }
  $(element).data("creditcardtype", "unknown");
  return (validTypes & 0x0080); //unknown
}, function (params, el) {
  return jQuery.validator.methods.creditcard3.messages[$(el).data("creditcardtype")];
});
jQuery.validator.methods.creditcard3.messages = {
  checksum: "Please enter a valid credit card number.",
  mastercard: "The credit card number you entered is not a valid Mastercard",
  visa: "The credit card number you entered is not a valid Visa card",
  "american express": "The credit card number you entered is not a valid American Express card",
  dinersclub: "The credit card number you entered is not a valid Diners Club card",
  enroute: "The credit card number you entered is not a valid Enroute card",
  discover: "The credit card number you entered is not a valid Discover card",
  jcb: "The credit card number you entered is not a valid JCB card",
  unknown: "The credit card number you entered is not recognized as a valid credit card."
};
jQuery.validator.methods.creditcard3.types = {
  mastercard: true,
  visa: true,
  "american express": true,
  dinersclub: false,
  enroute: false,
  discover: true,
  jcb: true,
  unknown: false
};
