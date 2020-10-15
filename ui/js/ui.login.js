var UI = (function (UI, $, undefined) {
  UI.showLoginForm = false;
  UI.loginFormShown = false;
  UI.isLoggingIn = false;
  UI.isLoggingOut = false;
  UI.isShuttingDown = false;

  var loginGradientInterval;
  var seedError;

  function getSeed(value) {
    value = value.toUpperCase();

    var seed = "";

    for (var i = 0; i < 81; i++) {
      var char = value.charAt(i);

      if (!char || "9ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(char) < 0) {
        seed += "9";
      } else {
        seed += char;
      }
    }

    return seed;
  }

  function checkSeedStrength(value) {
    value = String(value);

    var invalidCharacters = value.match(/[^A-Z9]/i);

    //don't care if the user has all his characters lowercased, but we do care if he uses mixed case.
    var mixedCase = value.match(/[a-z]/) && value.match(/[A-Z]/);

    if (value.length == 0) {
      return "Seed is needed";
    }
    if (value.length == 90) {
      return "This is address, NOT seed.";
    }
    if (invalidCharacters) {
      return (
        "Your seed contains invalid characters. Only A-Z and the number 9 are accepted." +
        (value.length > 81
          ? " Your seed is also too long."
          : value.length < 41
          ? " Your seed is also too short."
          : "")
      );
    } else if (mixedCase) {
      return (
        "Your seed contains mixed case characters. Lowercase is converted to uppercase." +
        (value.length > 81
          ? " Your seed is also too long."
          : value.length < 41
          ? " Your seed is also too short."
          : "")
      );
    } else if (value.length > 81) {
      return "Your seed should not contain more than 81 characters. Extra characters are ignored.";
    } else if (value.length < 41) {
      return "Your seed does not contain enough characters. This is not secure.";
    } else {
      return "";
    }
  }

  UI.hide_all = function () {
    $(
      ".receive_page,.main_page,.send_page,.settings_page, .transaction_page, .wallet_page, .faq_page, .confirmation_page"
    ).addClass("hidden");
  };

  UI.showLoginScreen = function () {
    console.log("UI.showLoginScreen");

    $(".main_page").removeClass("hidden");

    // setTimeout(function () {
    //   clearInterval(loginGradientInterval);
    // }, 60000);

    $("#login-password").on("keydown", function (e) {
      if (e.keyCode == 13 && !$("#login-btn").is(":disabled")) {
        $("#login-btn").trigger("click");
      }
    });

    $("#login-btn").on("click", function (e) {
      var seed = $("#login-password").val();

      connection.seed = getSeed(seed);
      seedError = checkSeedStrength(seed);
      if (seedError) {
        console.log("UI.login: Error");
        console.log(seedError);
        $("#login-btn").loadingError(seedError);
        $("#login-password").focus();
        return;
      }
      UI.isLoggingIn = true;

      setTimeout(function () {
        UI.executeState(function (error) {
          if (error) {
            connection.seed = "";
            $("#login-btn").loadingError("Connection refused");
            UI.initialConnection = false;
            UI.createStateInterval(500, false);
          } else {
            $("#login-password").val("");
            $("#login-btn").loadingReset("Logging in...");
            UI.showAppScreen();
          }
          UI.isLoggingIn = false;
        });
      }, 150);
    });

    $("#register").on("click", function (e) {
      var loginPage = $("#login-page");
      loginPage.addClass("hidden");
      var registerPage = $("#generated-seed");
      registerPage.removeClass("hidden");
      UI.showGeneratedSeed(false);
    });

    $("#back-login").on("click", function (e) {
      var loginPage = $("#login-page");
      loginPage.removeClass("hidden");
      var registerPage = $("#generated-seed");
      registerPage.addClass("hidden");
    });
    UI.handleHelpMenu();
    // UI.handleNetworkSpamming();
    // UI.handleClaiming();
  };

  UI.showAppScreen = function (cls) {
    $("#menu").removeClass("hidden");
    $("#header").removeClass("hidden");

    console.log("UI.showAppScreen");

    // After logging in, update state every minute
    // update state every 2 min
    UI.createStateInterval(120000, false);

    UI.update();

    if (seedError) {
      var options = {
        timeOut: 10000,
        extendedTimeOut: 10000,
      };

      UI.notify("error", seedError, options);
    }

    if (connection.handleURL) {
      UI.handleURL();
    }
    if (!seedError) {
      UI.hide_all();
      $(".wallet_page").removeClass("hidden");
    } else {
      $("#login-btn").loadingError("");
    }

    UI.handleTransfers();
    UI.handleAddressGeneration();
    UI.handleHistory();

    $(".logout").on("click", function (e) {
      $("#menu").addClass("hidden");
      $("#header").addClass("hidden");
      e.preventDefault();
      e.stopPropagation();

      UI.isLoggingOut = true;

      aidos.api.interruptAttachingToMesh(function () {
        window.location.reload();
      });
    });
  };

  UI.fadeInLoginForm = function () {
    UI.loginFormShown = true;

    var $form = $("#login-form");

    $form.find(":input").hide();
    // Hackety hack
    if ($("#error-btn").hasClass("no-connection")) {
      $("#error-btn").show();
    }
    $form.removeClass("hidden");

    UI.updateLoginForm();
  };

  UI.updateLoginForm = function () {
    if (!connection.nodeInfo) {
      console.log("UI.updateLoginForm: No node info");
      if (connection.inApp && !UI.initialConnection) {
        var timeTaken = new Date().getTime() - UI.initializationTime;
        if (timeTaken >= 500 && timeTaken < 10000) {
          if (!$("#error-btn").hasClass("no-connection")) {
            $("#login-btn, #login-password").hide();
            $("#error-btn")
              .addClass("no-connection")
              .html("Connecting...")
              .fadeIn();
          }
        }
      } else {
        $("#login-btn, #login-password").hide();
        $("#error-btn")
          .removeClass("no-connection")
          .html("CONNECTION REFUSED")
          .show();
        if (UI.updateIntervalTime != 500) {
          UI.createStateInterval(500, false);
        }
      }
    } else if (!$("#login-password").is(":visible")) {
      console.log("UI.updateLoginForm: Fade in");

      var fadeIn = false;

      if (
        $("#error-btn").hasClass("no-connection") &&
        $("#error-btn").is(":visible")
      ) {
        fadeIn = true;
      }

      $("#error-btn").hide();

      if (fadeIn) {
        $("#login-btn, #login-password").fadeIn();
      } else {
        $("#login-btn, #login-password").show();
      }

      $("#login-password").focus();
    }
  };

  UI.shutdown = function () {
    UI.isShuttingDown = true;
  };

  return UI;
})(UI || {}, jQuery);
