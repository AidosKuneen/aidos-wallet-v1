var aidos;
var toastr = require("toastr");

var connection = {
  accountData: false,
  previousAccountData: false,
  isLoggedIn: false,
  showStatus: false,
  inApp: false,
  isSpamming: false,
  handleURL: false,
  testNet: false,
  host: "http://localhost",
  port: 14265,
  depth: 3,
  minWeightMagnitude: 18,
  ccurlPath: null,
  lightWallet: false,
};

var __entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

String.prototype.escapeHTML = function () {
  return String(this).replace(/[&<>"']/g, function (s) {
    return __entityMap[s];
  });
};

if (typeof document.hasFocus === "undefined") {
  document.hasFocus = function () {
    return document.visibilityState == "visible";
  };
}

$(document).ready(function () {
  UI.start();
});

var UI = (function (UI, $, undefined) {
  UI.initializationTime = 0;
  UI.initialConnection = false;

  UI.isLocked = false;
  UI.hasFocus = true;

  UI.start = function () {
    console.log("UI.start: Initialization");

    UI.initializationTime = new Date().getTime();

    var d = document.documentElement.style;
    var supported =
      "flex" in d || "msFlex" in d || "webkitFlex" in d || "webkitBoxFlex" in d;
    if (!supported || String(2779530283277761) != "2779530283277761") {
      showOutDatedBrowserMessage();
    } else {
      if (typeof URLSearchParams != "undefined" && parent) {
        var params = new URLSearchParams(location.search.slice(1));
        connection.inApp = params.get("inApp") == 1;
        connection.showStatus = params.get("showStatus") == 1;
        if (params.has("host")) {
          connection.host = params.get("host");
        }
        if (params.has("port")) {
          connection.port = params.get("port");
        }
        if (params.has("depth")) {
          connection.depth = parseInt(params.get("depth"), 10);
        }
        if (params.has("minWeightMagnitude")) {
          connection.minWeightMagnitude = parseInt(
            params.get("minWeightMagnitude"),
            10
          );
        }
        if (params.has("ccurlPath")) {
          connection.ccurlPath = params.get("ccurlPath");
        }
      }

      if (
        connection.inApp &&
        (typeof backendLoaded == "undefined" || !backendLoaded)
      ) {
        showBackendConnectionError();
        return;
      }

      aidos = new aidos({
        host: connection.host,
        port: connection.port,
      });

      if (connection.host != "http://localhost") {
        connection.lightWallet = true;
        if (!connection.inApp || typeof ccurl == "undefined" || !ccurl) {
          if (typeof ccurl == "undefined") {
            console.log("ccurl is undefined");
          } else if (!ccurl) {
            console.log("ccurl is false");
          } else {
            console.log("...");
          }
          showLightWalletErrorMessage();
          return;
        } else {
          connection.ccurlProvider = ccurl.ccurlProvider(connection.ccurlPath);
          if (!connection.ccurlProvider) {
            console.log(
              "Did not get ccurlProvider from " + connection.ccurlPath
            );
            showLightWalletErrorMessage();
            return;
          }
        }

        // Overwrite aidos lib with light wallet functionality
        $.getScript("js/aidos.lightwallet.js")
          .done(function () {
            setTimeout(initialize, 100);
          })
          .fail(function (jqxhr, settings, exception) {
            console.log("Could not load aidos.lightwallet.js");
            console.log(exception);
            showLightWalletErrorMessage();
          });
      } else {
        setTimeout(initialize, 100);
      }
    }
  };

  function initialize() {
    $("body").show();

    // Set notification options
    toastr.options.positionClass = "toast-top-center";
    // Need not escape, UI.notify already does that.
    // toastr.options.escapeHtml = true;

    // Hide pages
    $("#app, #login").hide();

    // Initialize button handlers
    $(".btn:not(.btn-no-loading)").loadingInitialize();

    // Enable copy to clipboard
    var clipboard = new ClipboardJS(".clipboard");
    clipboard.on("success", function (e) {
      UI.notify("success", "Copied to clipboard.");
    });

    // Show full amounts on click
    $("body").on("click", ".amount.long", function (e) {
      if ($(this).hasClass("detailed")) {
        $(this).parent().removeClass("detailed");
        $(this)
          .removeClass("detailed")
          .html($(this).data("short"))
          .hide()
          .fadeIn();
      } else {
        $(this).parent().addClass("detailed");
        $(this).addClass("detailed").html($(this).data("long")).hide().fadeIn();
      }
    });

    UI.showLoginScreen();

    // Until we have a server connection we will check every 500ms..
    UI.createStateInterval(500, true);

    $(".href_wallet").on("click", function () {
      UI.hide_all();
      $(".wallet_page").fadeIn(1000);
    });
    $(".href_main").on("click", function () {
      UI.hide_all();
      $(".main_page").fadeIn(1000);
    });
    $(".href_transaction").on("click", function () {
      UI.hide_all();
      $(".transaction_page").fadeIn(1000);
    });
    $(".href_statistics").on("click", function () {
      UI.hide_all();
      $(".statistics_page").fadeIn(1000);
    });
    $(".href_send").on("click", function () {
      UI.hide_all();
      $(".send_page").fadeIn(1000);
    });
    $(".href_settings").on("click", function () {
      UI.hide_all();
      $(".settings_page").fadeIn(1000);
    });
    $(".href_receive").on("click", function () {
      UI.hide_all();
      $(".receive_page").fadeIn(1000);
    });
    // Enable app message listening
    if (connection.inApp) {
      UI.inAppInitialize();
    }
  }

  function showErrorMessage(error) {
    document.body.innerHTML =
      "<div style='padding: 20px;background:#efefef;border:#aaa;border-radius: 5px;max-width: 60%;margin: 100px auto;'>" +
      String(error).escapeHTML() +
      "</div>";
    document.body.style.display = "block";
  }

  function showLightWalletErrorMessage() {
    showErrorMessage("Could not load light wallet functionality.");
  }

  function showBackendConnectionError() {
    showErrorMessage("Could not load required backend files.");
  }

  function showOutdatedBrowserMessage() {
    console.log("showOutdatedBrowserMessage");

    var html = "";

    html +=
      "<div style='padding: 20px;background:#efefef;border:#aaa;border-radius: 5px;max-width: 60%;margin: 100px auto;'>";
    html +=
      "<strong>Your browser is out-of date. Please download one of these up-to-date, free and excellent browsers:</strong>";
    html += "<ul>";
    html +=
      "<li><a href='https://www.google.com/chrome/browser/desktop/' rel='noopener noreferrer'>Google Chrome</a></li>";
    html +=
      "<li><a href='http://www.mozilla.com/firefox/' rel='noopener noreferrer'>Mozilla Firefox</a></li>";
    html +=
      "<li><a href='http://www.opera.com/' rel='noopener noreferrer'>Opera</a></li>";
    html += "</ul>";
    html += "</div>";

    $("body").html(html).show();
  }

  return UI;
})(UI || {}, jQuery);
