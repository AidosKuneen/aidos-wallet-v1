var UI = (function (UI, $, undefined) {
  UI.hideAlerts = function () {
    $(".remodal-wrapper, .remodal-overlay").remove();
    $("html").removeClass("remodal-is-locked");
  }

  UI.formatAmount = function (amount) {
    if (typeof (amount) != "integer") {
      amount = parseInt(amount, 10);
    }

    var units = negative = formattedAmount = "", afterComma = "", beforeComma = "", hidden = "", afterCommaDigits = 0;

    if (amount < 0) {
      amount = Math.abs(amount);
      negative = "-";
    }


    /*
	 * 1 M ADK = 10⁶ ADK = 1,000,000 ADK
	 * 1 ADK = 10^0 = 1 ADK
	 * 1 m ADK =10-³ ADK = 0.001 ADK 
	 * 1 u ADK =10-6 ADK = 0.000001 ADK
	 */

    if (amount >= 1000000 * 100000000) {
      units = "M ADK";
      afterCommaDigits = 6 + 8;
    } else if (amount >= 1 * 100000000) {
      units = "ADK";
      afterCommaDigits = 8;
    } else if (amount >= 0.001 * 100000000) {
      units = "m ADK";
      afterCommaDigits = -3 + 8;
    } else if (amount == 0) {
      units = "ADK";
      afterCommaDigits = 0;
    } else {
      units = "u ADK";
      afterCommaDigits = -6 + 8;
    }

    value = amount * 0.00000001;
    amount = amount.toString();
    if (units == "u ADK") {
      for (i = amount.length; i <= 2; i++) {
        amount = "0" + amount
      }
    }

    var digits = amount.split("").reverse();

    for (var i = 0; i < afterCommaDigits; i++) {
      afterComma = digits[i] + afterComma;
    }

    if (/^0*$/.test(afterComma)) {
      afterComma = "";
    }

    var j = 0;

    for (var i = afterCommaDigits; i < digits.length; i++) {
      if (j > 0 && j % 3 == 0) {
        beforeComma = "'" + beforeComma;
      }
      beforeComma = digits[i] + beforeComma;
      j++;
    }

    if (afterComma.length > 2) {
      hidden = afterComma.substring(1).replace(/0+$/, "");
      afterComma = afterComma[0];
    }

    var short = negative + beforeComma + (afterComma ? "." + afterComma : "") + (hidden ? "+" : "") + " " + units;
    // var long = (hidden ? short.replace("+", hidden) : "");

    // long = long.escapeHTML();
    short = short.escapeHTML();
    
    // format value
    var stringValue = value.toFixed(8).replace(/\.?0+$/,"");
    var splitValue = stringValue.split("");
    var commaIndex = stringValue.indexOf(".");
    var formatValue = "";
    
    var decimals = 0;
    if (commaIndex != -1){
    	decimals = commaIndex-1
    } else {
    	decimals = splitValue.length-1
    }
    var split = 0;
    for (var i = decimals; i >= 0; i--) {
    	if (split > 0 && split % 3 == 0) {	
    		formatValue = "'" + formatValue;
    	}
    	formatValue = splitValue[i] + formatValue;
    	split++;
    }
    if (commaIndex == -1){
        formatValue = negative + formatValue + " ADK";
    } else {
    	formatValue = negative + formatValue + stringValue.substring(commaIndex) + " ADK";
    }
    formatValue = formatValue.escapeHTML();
    
    value = negative + value;
    value = value.escapeHTML();

    // if (long) {
    var output = "<span class='amount long' data-value='" + value + "' data-short='" + short + "' data-long='" + formatValue + "'>" + short + "</span>";
    // } else {
    // var output = "<span class='amount' data-value='" + negative + value + "'
    // data-long='" + short + "'>" + short + "</span>";
    // }

    return output;
  }

  UI.formatForClipboard = function (text, id) {
    text = String(text).escapeHTML();

    return "<span class='clipboard' title='" + text + "' data-clipboard-text='" + text + "'" + (id ? " id='" + id + "'" : "") + ">" + text + "</span>";
  }
  
  function addZero(i) {
	    if (i < 10) {
	        i = "0" + i;
	    }
	    return i;
  }


  UI.formatDate = function (timestamp, full) {
    var date = new Date(timestamp * 1000);
    var h = addZero(date.getHours());
    var m = addZero(date.getMinutes());
    
    return ("0" + date.getDate()).substr(-2) + "/" + ("0" + (date.getMonth() + 1)).substr(-2) + (full ? "/" + date.getFullYear() : "") + " " + h + ":" + m;
  }

  UI.notify = function (type, message, options) {
    console.log("UI.notify: " + message);

    message = String(message).escapeHTML();

    if (type == "error") {
      toastr.error(message, "", options);
    } else if (type == "success") {
      toastr.success(message, "", options);
    } else if (type == "warning") {
      toastr.warning(message, "", options);
    } else {
      toastr.info(message, "", options);
    }

    UI.notifyDesktop(message, true);
  }

  UI.isFocused = function () {
    return ((connection.inApp && UI.hasFocus) || (!connection.inApp && document.hasFocus()));
  }

  UI.notifyDesktop = function (message, ifNotFocused) {
    console.log("UI.notifyDesktop: " + message);

    if (ifNotFocused && UI.isFocused()) {
      return;
    }

    if (!("Notification" in window)) {
      return;
    } else if (Notification.permission === "granted") {
      var notification = new Notification("AIDOS Wallet", { "body": message });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission(function (permission) {
        if (permission === "granted") {
          var notification = new Notification("AIDOS Wallet", { "body": message });
        }
      });
    }
  }

  UI.formSuccess = function (form, message, options) {
    var $stack = $("#" + form + "-stack");

    $stack.find("input[type=text], input[type=number], textarea").val("");
    $stack.find("select option:first-child").attr("selected", true);

    var $btn = $stack.find(".btn").first();

    $btn.loadingSuccess(message, options);

    if (!$stack.hasClass("open")) {
      UI.notify("success", message);
    } else {
      UI.notifyDesktop(message, true);
    }
  }

  UI.formError = function (form, message, options) {
    var $stack = $("#" + form + "-stack");
    var $btn = $stack.find(".btn").first();

    $btn.loadingError(message, options);

    if (!$stack.hasClass("open")) {
      UI.notify("error", message);
    } else {
      UI.notifyDesktop(message, true);
    }
  }

  UI.formUpdate = function (form, message, options) {
    var $stack = $("#" + form + "-stack");
    var $btn = $stack.find(".btn").first();

    $btn.loadingUpdate(message, options);
  }

  UI.addPeer = function (addNodes) {
    if (addNodes && addNodes.length) {
      aidos.api.addPeer(addNodes, function (error, success) {
        if (error) {
          UI.notify("error", "Error whilst adding peers.");
        } else {
          UI.notify("success", "Added " + addNodes.length + " peer" + (addNodes.length != 1 ? "s" : "") + ".");
        }
      });
    }
  }

  return UI;
}(UI || {}, jQuery));