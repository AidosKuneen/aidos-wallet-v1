/**
 * Pinlogin
 * Javascript cross-browser and flexible pincode login input experience
 *
 * Copyright (c) 2019 Bob Hageman https://github.com/bobhageman
 * License: MIT - https://opensource.org/licenses/mit-license
 *
 * https://github.com/bobhageman/pinlogin
 */

(function (window, Pinlogin) {
  // universal module definition
  /* jshint strict: false */ /*globals define, module */
  if (typeof define == "function" && define.amd) {
    // AMD
    define([], Pinlogin);
  } else if (typeof module == "object" && module.exports) {
    // CommonJS
    module.exports = Pinlogin();
  } else {
    // browser global
    window.Pinlogin = Pinlogin();
  }
})(window, function Pinlogin() {
  "use strict";

  // -------------------------- Pinlogin definition -------------------------- //

  var pluginname = "pinlogin";

  let fieldID = -1;

  // constructor
  function Pinlogin(element, options) {
    this.elementId = element.id;

    this.defaults = {
      fields: 5, // number of fields
      placeholder: "*", // character that's displayed after entering a number in a field
      autofocus: true, // focus on the first field at loading time
      hideinput: true, // hide the input digits and replace them with placeholder
      reset: true, // resets all fields when completely filled
      pattern: "^[0-9]*$", // the required pattern for each field
      copypaste: false, // allow copy paste the pincode, this only works if the first field has focus
      complete: function (pin) {
        // fires when all fields are filled in
        /*jshint unused:false*/
        // pin	:	the entered pincode
      },
      invalid: function (field, nr) {
        // fires when user enters an invalid value in a field
        /*jshint unused:false*/
        // field: 	the jquery field object
        // nr	:	the field number
      },
      keydown: function (e, field, nr) {
        // fires when user pressed a key down in a field
        /*jshint unused:false*/
        // e	:	the event object
        // field: 	the jquery field object
        // nr	:	the field number
      },
      input: function (e, field, nr) {
        // fires when a value is entered in a field
        /*jshint unused:false*/
        // e	:	the event object
        // field: the jquery field object
        // nr:	the field number
      },
    };

    // inject default settings and override with given options
    this.settings = this.defaults;

    if (options) {
      for (var i in options) this.settings[i] = options[i];
    }

    var containerObj = this._createElement("div", {
      id: element.id + "_" + pluginname,
      class: [pluginname],
    });

    // to keep track of the entered values
    this.values = [];
    this.timers = [];

    // main loop creating the fields
    for (var x = 0; x < this.settings.fields; x++) {
      var input = this._createInput(this.getFieldId(x), x);

      this._attachEvents(input, x);

      containerObj.appendChild(input);
    }

    element.appendChild(containerObj);

    // set all fields in 'default' state
    this.reset();

    // focus on first field, if enabled
    if (this.settings.autofocus) this.focus(0);
  }

  // create an HTML element
  Pinlogin.prototype._createElement = function (type, attributes) {
    var el = document.createElement(type);

    for (var key in attributes) {
      if (key == "class") {
        el.classList.add.apply(el.classList, attributes[key]); // add all classes at once
      } else {
        el[key] = attributes[key];
      }
    }

    return el;
  };

  // create a field element
  Pinlogin.prototype._createInput = function (id) {
    return this._createElement("input", {
      id: id,
      name: id,
      type: "tel",
      maxlength: 1,
      inputmode: "numeric",
      "x-inputmode": "numeric",
      pattern: this.settings.pattern,
      autocomplete: false,
      autocorrect: "off",
      autocapitalize: "off",
      spellcheck: false,
      role: "presentation",
      class: ["pinlogin-field"],
    });
  };
  // add eventlisteners and logic to a field
  Pinlogin.prototype._attachEvents = function (field, nr) {
    var that = this; // ref to 'this'

    field.addEventListener("focus", function () {
      if (!this.readOnly) this.value = "";
    });

    field.addEventListener("input", function (e) {
      // validate input value
      if (!that.validateInput(nr)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // fire input callback
      that.settings.input(e, this, nr);

      fieldID++;
      if (fieldID > 5) {
        fieldID = 0;
      }

      // store value
      that.values[nr] = this.value;
      // when it's not the last field
      if (nr < that.settings.fields - 1) {
        // set a delay on replacing the actual entered value with the placeholder
        if (that.settings.hideinput) {
          // when it's not the 1st field, set placeholder on prev. field
          if (nr > 0) {
            that.getField(nr - 1).value = that.settings.placeholder;
          }

          // and on the current field, add a timer to set the placeholder in x milliseconds
          var x = this; // ref to current field
          that.timers.push(
            setTimeout(function () {
              x.value = that.settings.placeholder;
            }, 0)
          );
        }

        // make next field editable
        that.getField(nr + 1).removeAttribute("readonly");

        // set focus to the next field
        that.focus(nr + 1);
      }
      // and when you're done
      else {
        if (that.settings.hideinput) this.value = that.settings.placeholder;

        var pin = that.values.join("");

        // reset the plugin
        if (that.settings.reset) that.reset();

        that.values = [];

        // fire complete callback
        that.settings.complete(pin);
      }
    });

    field.addEventListener("keydown", function (e) {
      // cleanup all timers first (so if we go back/break with normal input order, not suddenly placeholders start appearing inside fields we do not want to)
      for (var i = 0; i < that.timers.length; i++) clearTimeout(that.timers[i]);

      that.timers = [];

      // fire keydown callback
      that.settings.keydown(e, this, nr);

      // when user goes back
      if ((e.keyCode == 37 || e.key == "Backspace") && nr > 0) {
        // arrow back, backspace
        that.resetField(nr);

        // set focus to previous input
        that.focus(nr - 1);

        e.preventDefault();
        e.stopPropagation();
      }
    });

    // only on first field, it is allowed to 'paste' a complete pincode, intercept from here
    if (that.settings.copypaste && nr == 0) {
      field.addEventListener("paste", function (e) {
        var clipboardData, pasted;

        // Stop data actually being pasted
        e.stopPropagation();
        e.preventDefault();

        // Get pasted data via clipboard API
        clipboardData = e.clipboardData || window.clipboardData;
        pasted = clipboardData.getData("Text").trim();

        // when length does not match don't even start
        if (pasted.length != that.settings.fields) return;

        for (var i = 0; i < that.settings.fields; i++) {
          var pasteField = that.getField(i);

          pasteField.removeAttribute("readonly");
          pasteField.value = pasted[i];

          if (!that.validateInput(i)) break;

          that.focus(i + 1);
        }
      });
    }
  };

  // Add input via pin pad
  Pinlogin.prototype.addInput = function (btnVal) {
    var that = this; // ref to 'this'

    if (btnVal != "Backspace") {
      fieldID++;
      if (fieldID > 5) {
        fieldID = 0;
      }
      // fire input callback
      that.settings.input("click", that.getField(fieldID), fieldID);
      //store values
      that.values[fieldID] = btnVal;

      // when it's not the last field
      if (fieldID < that.settings.fields - 1) {
        // set a delay on replacing the actual entered value with the placeholder
        if (that.settings.hideinput) {
          // when it's not the 1st field, set placeholder on prev. field

          if (fieldID > 0) {
            that.getField(fieldID - 1).value = that.settings.placeholder;
          }

          // and on the current field, add a timer to set the placeholder in x milliseconds
          var x = that.getField(fieldID); // ref to current field
          that.timers.push(
            setTimeout(function () {
              x.value = that.settings.placeholder;
            }, 0)
          );
        }

        // make next field editable
        that.getField(fieldID + 1).removeAttribute("readonly");

        // set focus to the next field
        that.focus(fieldID + 1);
      }
      // and when you're done
      else {
        if (that.settings.hideinput) this.value = that.settings.placeholder;

        var pin = that.values.join("");

        // reset the plugin
        if (that.settings.reset) that.reset();

        // that.fieldId = -1;
        // fire complete callback
        that.settings.complete(pin);
        fieldID = -1;
      }
    } else {
      if (fieldID > -1) {
        that.values[fieldID] = "";
        var field = that.getField(fieldID);
        var nextField = that.getField(fieldID + 1);
        field.value = "";
        nextField.readOnly = true;
        that.focus(fieldID);
        fieldID -= 1;
      }
    }
  };

  // match the value of a field to the given pattern and validate it
  Pinlogin.prototype.validateInput = function (nr) {
    var field = this.getField(nr);

    // validate input pattern
    var pattern = new RegExp(field.pattern);
    if (!field.value.match(pattern)) {
      field.value = "";
      field.classList.add("invalid");

      // fire error callback
      this.settings.invalid(field, nr);

      return false;
    } else {
      field.classList.remove("invalid");

      return true;
    }
  };

  // get the id for a given input number
  Pinlogin.prototype.getFieldId = function (nr) {
    return this.elementId + "_" + pluginname + "_" + nr;
  };

  // get the input field object
  Pinlogin.prototype.getField = function (nr) {
    return document.getElementById(this.getFieldId(nr));
  };

  // focus on the input field object
  Pinlogin.prototype.focus = function (nr) {
    this.enableField(nr); // make sure its enabled
    setTimeout(() => {
      this.getField(nr).focus();
    }, 0);
  };

  // reset the saved value and input fields
  Pinlogin.prototype.reset = function () {
    this.values = new Array(this.settings.fields);

    for (var i = 0; i < this.settings.fields; i++) {
      var field = this.getField(i);

      field.value = "";

      if (i > 0) {
        field.readOnly = true;
        field.classList.remove("invalid");
      }
    }

    // focus on first field
    if (this.settings.autofocus) this.focus(0);
  };

  // reset a single field
  Pinlogin.prototype.resetField = function (nr) {
    this.values[nr] = "";

    var field = this.getField(nr);

    field.value = "";
    field.readOnly = true;
    field.classList.remove("invalid");
  };

  // disable all fields
  Pinlogin.prototype.disable = function () {
    for (var i = 0; i < this.settings.fields; i++) {
      this.disableField(i);
    }
  };

  // disable specified field
  Pinlogin.prototype.disableField = function (nr) {
    var f = this.getField(nr);
    f.readOnly = true;
  };

  // enable all fields
  Pinlogin.prototype.enable = function () {
    for (var i = 0; i < this.settings.fields; i++) {
      this.enableField(i);
    }
  };

  // enable specified field
  Pinlogin.prototype.enableField = function (nr) {
    this.getField(nr).removeAttribute("readonly");
  };

  // jQuery plugin wrapper
  if (typeof jQuery !== "undefined") {
    // A really lightweight plugin wrapper around the constructor,
    $.fn[pluginname] = function (options) {
      var plugin;
      this.each(function () {
        plugin = $.data(this, pluginname);
        if (!plugin) {
          plugin = new Pinlogin(this, options);
          $.data(this, pluginname, plugin);
        }
      });
      return plugin;
    };
  }

  return Pinlogin;
});
