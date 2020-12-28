const { ipcRenderer, remote } = require("electron");
const Store = require("electron-store");

var UI = (function (UI, $, undefined) {
  UI.showLoginForm = false;
  UI.loginFormShown = false;
  UI.isLoggingIn = false;
  UI.isLoggingOut = false;
  UI.isShuttingDown = false;
  let notifHashes = [];

  var seedError;
  // Start Electron store
  const schema = {
    account: {
      type: "array",
      items: {
        type: "object",
        properties: {
          seedKey: {
            type: "string",
            minLegth: 81,
            maxLength: 81,
          },
          name: {
            type: "string",
            minLength: 1,
          },
          active: {
            type: "boolean",
            default: true,
          },
        },
      },
    },
    pincode: {
      type: "string",
      minLength: 6,
      maxLength: 6,
      pattern: "^[0-9]*$",
    },
    logindate: {
      type: "string",
    },
    notifdate: {
      type: "string",
    },
  };

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

    //  Pinlogin Query Selector
    const accountSecurity = document.getElementById("account-security");
    const pinLoginHolder = document.getElementById("pin-login");
    const pinRegister = document.getElementById("pin-register");
    const pinLock = document.getElementById("pin-lock");
    const pinChange = document.getElementById("pin-change");
    const pinChangeCurrentHolder = document.getElementById(
      "pin-change-current-holder"
    );
    const pinChangeNewHolder = document.getElementById("pin-change-new-holder");
    const cancelBtn = document.getElementById("cancel-btn");
    const lockBtn = document.getElementById("lock-btn");
    const pinChangeBtn = document.getElementById("pin-change-btn");

    (async () => {
      const key = await ipcRenderer.invoke("getKey");
      const store = new Store({
        schema,
        encryptionKey: key,
      });
      // Get Account Details
      const accountArr = store.get("account");

      const registerPin = () => {
        if (
          !store.get("pincode") ||
          (!store.get("pincode") && store.get("account"))
        ) {
          const registerpin = new Pinlogin(
            document.querySelector("#register-pin"),
            {
              fields: 6,
              reset: false,
              autofocus: true,
              complete: function (pin) {
                regPin = pin;

                // focus on the first field of the pincode retype instance
                registerpinretype.focus(0);

                // disable this instance
                registerpin.disable();

                document
                  .getElementById("register-pin")
                  .classList.remove("active");
                document
                  .getElementById("register-pin-validation")
                  .classList.add("active");
              },
            }
          );

          const registerpinretype = new Pinlogin(
            document.querySelector("#register-pin-validation"),
            {
              fields: 6,
              reset: false,
              complete: function (pin) {
                // compare entered pincodes
                if (regPin !== pin) {
                  regPin = "";
                  // reset both instances
                  registerpin.reset();
                  registerpinretype.reset();

                  // disable repeat instance
                  registerpinretype.disable();

                  // set focus to first instance again
                  registerpin.focus(0);

                  alert("Pincodes do not match, please try again");
                } else {
                  // reset both instances
                  registerpin.reset();
                  registerpinretype.reset();

                  // disable both instances
                  registerpin.disable();
                  registerpinretype.disable();

                  // further processing here
                  store.set("pincode", pin);
                  accountSecurity.classList.add("hidden");
                  pinRegister.classList.add("hidden");
                  document
                    .getElementById("register-pin-validation")
                    .classList.remove("active");
                  store.set("account", [
                    {
                      seedKey: connection.seed,
                      active: true,
                    },
                  ]);
                  UI.showAppScreen();
                }
              },
            }
          );
          // disable repeat instance at start
          registerpinretype.disable();
          accountSecurity.classList.remove("hidden");
          pinRegister.classList.remove("hidden");
          document.getElementById("register-pin").classList.add("active");
          const pinPadBtn = document.querySelectorAll("#pin-pad-btn");
          pinPadBtn.forEach((btn) => {
            btn.addEventListener("click", () => {
              if (
                document
                  .getElementById("register-pin")
                  .classList.contains("active")
              ) {
                registerpin.addInput(btn.value);
              } else if (
                document
                  .getElementById("register-pin-validation")
                  .classList.contains("active")
              ) {
                registerpinretype.addInput(btn.value);
              }
            });
          });
          registerpin.focus(0);
          UI.hide_all();
          // Set Pin to store
        } else {
          UI.showAppScreen();
        }
      };

      // Create Pin Login Form
      const pinlogin = new Pinlogin(document.querySelector("#pin-form"), {
        fields: 6,
        complete: function (pin) {
          // If completed do this
          if (store.get("pincode") === pin) {
            pinLoginHolder.classList.add("hidden");
            pinLoginHolder.classList.remove("active");
            document
              .querySelector("#account-security .spinner")
              .classList.remove("hidden");
            pinlogin.disable(); //disable instance
            for (const i in accountArr) {
              if (accountArr[i].seedKey && accountArr[i].active == true) {
                var seed = accountArr[i].seedKey;
                break;
              }
            }
            connection.seed = getSeed(seed);
            if (seedError) {
              console.log("UI.login: Error");
              return;
            }
            UI.isLoggingIn = true;

            setTimeout(function () {
              UI.executeState(function (error) {
                if (error) {
                  connection.seed = "";
                  UI.initialConnection = false;
                  UI.createStateInterval(500, false);
                } else {
                  accountSecurity.classList.add("hidden");
                  document
                    .querySelector("#account-security .spinner")
                    .classList.add("hidden");
                  UI.showAppScreen();
                }
                UI.isLoggingIn = false;
              });
            }, 150);
          } else {
            Toastify({
              text: "Wrong Pin",
              duration: 3000,
              newWindow: true,
              close: true,
              gravity: "top",
              position: "right",
              backgroundColor: "#ED0B0B",
              stopOnFocus: true,
            }).showToast();
          }
        },
        input: function (e, field, nr) {
          // console.log(e, field, nr);
        },
      });

      if (store.get("pincode")) {
        UI.hide_all();
        accountSecurity.classList.remove("hidden");
        pinLoginHolder.classList.remove("hidden");
        pinLoginHolder.classList.add("active");
        // pinPad(pinlogin);
        pinlogin.focus(0);
      } else {
        $(".main_page").removeClass("hidden");
      }

      const loginPass = document.getElementById("login-password");
      const loginBtn = document.getElementById("login-btn");

      loginPass.addEventListener("keydown", (e) => {
        if (e.key == "Enter" && !loginBtn.disabled) {
          loginBtn.click();
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
              UI.hide_all();

              $("#login-password").val("");
              $("#login-btn").loadingReset("Logging in...");

              const now = new Date();
              store.set("logindate", `${now}`);

              if (accountArr) {
                UI.hide_all();
                if (store.get("pincode")) {
                  store.set("account", [
                    {
                      seedKey: connection.seed,
                      active: true,
                    },
                  ]);
                  UI.showAppScreen();
                } else {
                  registerPin();
                }
              } else {
                UI.hide_all();
                registerPin();
                store.set("account", [
                  {
                    seedKey: connection.seed,
                    active: true,
                  },
                ]);
              }
            }
            UI.isLoggingIn = false;
          });
        }, 150);
      });

      /* Lock Screen */
      const pinlock = new Pinlogin(document.querySelector("#pin-lock-form"), {
        fields: 6,
        complete: function (pin) {
          if (store.get("pincode") === pin) {
            accountSecurity.classList.add("hidden");
            pinLock.classList.add("hidden");
            pinLock.classList.remove("active");
            UI.showScreen();
          } else {
            Toastify({
              text: "Wrong Pin",
              duration: 3000,
              newWindow: true,
              close: true,
              gravity: "top",
              position: "right",
              backgroundColor: "#ED0B0B",
              stopOnFocus: true,
            }).showToast();
          }
        },
      });

      lockBtn.addEventListener("click", () => {
        pinlock.focus(0);
        UI.hideAppScreen();
        // UI.hide_all();
        accountSecurity.classList.remove("hidden");
        pinLock.classList.remove("hidden");
        pinLock.classList.add("active");
      });

      /* End Lock Screen */

      /* Pin Change */

      pinChangeBtn.addEventListener("click", () => {
        pinChangeCurrent.focus(0);
        UI.hideAppScreen();
        // UI.hide_all();
        accountSecurity.classList.remove("hidden");
        pinChange.classList.remove("hidden");
        pinChangeCurrentHolder.classList.remove("hidden");
        pinChangeCurrentHolder.classList.add("active");
      });

      const pinChangeCurrent = new Pinlogin(
        document.querySelector("#pin-change-current"),
        {
          fields: 6,
          complete: function (pin) {
            if (store.get("pincode") === pin) {
              pinChangeCurrent.disable();
              pinChangeNew.enable();
              pinChangeNew.focus(0);
              pinChangeNewHolder.classList.remove("hidden");
              pinChangeCurrentHolder.classList.add("hidden");
              pinChangeCurrentHolder.classList.remove("active");
              document.getElementById("pin-change-new").classList.add("active");
            } else {
              Toastify({
                text: "Wrong Pin",
                duration: 3000,
                newWindow: true,
                close: true,
                gravity: "top",
                position: "right",
                backgroundColor: "#ED0B0B",
                stopOnFocus: true,
              }).showToast();
            }
          },
        }
      );

      const pinChangeNew = new Pinlogin(
        document.querySelector("#pin-change-new"),
        {
          fields: 6,
          reset: false,
          autofocus: true,
          complete: function (pin) {
            regPin = pin;

            // focus on the first field of the pincode retype instance
            pinChangeNewRetype.enable();
            pinChangeNewRetype.focus(0);

            // disable this instance
            pinChangeNew.disable();

            document
              .getElementById("pin-change-new")
              .classList.remove("active");
            document
              .getElementById("pin-change-new-retype")
              .classList.add("active");
          },
        }
      );
      pinChangeNew.disable();

      const pinChangeNewRetype = new Pinlogin(
        document.querySelector("#pin-change-new-retype"),
        {
          fields: 6,
          reset: false,
          complete: function (pin) {
            // compare entered pincodes
            if (regPin !== pin) {
              regPin = "";
              // reset both instances
              pinChangeNew.reset();
              pinChangeNewRetype.reset();

              // disable repeat instance
              pinChangeNewRetype.disable();

              // set focus to first instance again
              pinChangeNew.focus(0);

              alert("Pincodes do not match, please try again");
            } else {
              // reset both instances
              pinChangeNew.reset();
              pinChangeNewRetype.reset();

              // disable both instances
              pinChangeNew.disable();
              pinChangeNewRetype.disable();

              // further processing here
              store.set("pincode", pin);
              Toastify({
                text: "Pin changed successfully",
                duration: 3000,
                newWindow: true,
                close: true,
                gravity: "top",
                position: "right",
                backgroundColor: "#3FA577",
                stopOnFocus: true,
              }).showToast();
              accountSecurity.classList.add("hidden");
              pinChange.classList.add("hidden");
              pinChangeCurrentHolder.classList.remove("hidden");
              pinChangeNewHolder.classList.add("hidden");
              document
                .getElementById("pin-change-new-retype")
                .classList.remove("active");
              UI.showScreen();
            }
          },
        }
      );
      pinChangeNewRetype.disable();

      document.getElementById("cancel-btn").addEventListener("click", () => {
        accountSecurity.classList.add("hidden");
        pinChange.classList.add("hidden");
        pinChangeCurrentHolder.classList.add("hidden");
        pinChangeNewHolder.classList.add("hidden");
        pinChangeNew.reset();
        pinChangeNew.disable();
        pinChangeNewRetype.reset();
        pinChangeNewRetype.disable();
        UI.showScreen();
      });

      /* End Pin Change */

      document
        .getElementById("back-login-account")
        .addEventListener("click", () => {
          accountSecurity.classList.add("hidden");
          pinLoginHolder.classList.add("hidden");
          document.querySelector(".main_page").classList.remove("hidden");
          document.getElementById("login-page").classList.remove("hidden");
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

      //use pinpad for pincode
      const pinPadBtn = document.querySelectorAll("#pin-pad-btn");
      pinPadBtn.forEach((btn) => {
        btn.onclick = (e) => {
          if (pinLoginHolder.classList.contains("active")) {
            pinlogin.addInput(btn.value);
          } else if (pinLock.classList.contains("active")) {
            pinlock.addInput(btn.value);
          } else if (pinChangeCurrentHolder.classList.contains("active")) {
            pinChangeCurrent.addInput(btn.value);
          } else if (
            document
              .getElementById("pin-change-new")
              .classList.contains("active")
          ) {
            pinChangeNew.addInput(btn.value);
          } else if (
            document
              .getElementById("pin-change-new-retype")
              .classList.contains("active")
          ) {
            pinChangeNewRetype.addInput(btn.value);
          }
        };
      });
    })();
  };

  UI.hideAppScreen = function () {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("header").classList.add("hidden");
  };

  UI.showScreen = function () {
    document.getElementById("menu").classList.remove("hidden");
    document.getElementById("header").classList.remove("hidden");
  };

  UI.showAppScreen = function (cls) {
    document.getElementById("menu").classList.remove("hidden");
    document.getElementById("header").classList.remove("hidden");

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
    UI.checkAddresses();

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

  UI.updateNotification = function () {
    (async () => {
      const key = await ipcRenderer.invoke("getKey");
      const store = new Store({
        schema,
        encryptionKey: key,
      });

      let getDate;
      const now = new Date();
      const logindate = new Date(store.get("logindate"));
      const notifdate = new Date(store.get("notifdate"));

      if (notifdate == "Invalid Date") {
        getDate = logindate;
      } else {
        getDate = notifdate;
      }

      if (
        JSON.stringify(connection.accountData) ==
        JSON.stringify(connection.previousAccountData)
      ) {
        return;
      }

      if (connection.accountData) {
        var categorizedTransfers = aidos.utils.categorizeTransfers(
          connection.accountData.transfers,
          connection.accountData.addresses
        );

        const notifCount = document.getElementById("notification-count");
        const notifBtn = document.getElementById("notification-btn");
        $.each(
          connection.accountData.transfers.reverse(),
          function (i, bundle) {
            $.each(categorizedTransfers.received, function (i, receivedBundle) {
              if (receivedBundle[0].hash == bundle[0].hash) {
                if (
                  !notifHashes.includes(receivedBundle[0].hash) &&
                  new Date(receivedBundle[0].timestamp * 1000) > getDate &&
                  receivedBundle[0].value > 0
                ) {
                  notifHashes.push(receivedBundle[0].hash);
                  document
                    .querySelector(".notification-holder")
                    .insertAdjacentHTML(
                      "afterbegin",
                      `
                                <div class="flex flex-wrap py-4 notification" data-hash="${
                                  receivedBundle[0].hash
                                }">
                                    <div class="flex flex-col flex-grow w-auto justify-center">
                                      <div>
                                        <p class="text-base">${receivedBundle[0].hash.substr(
                                          0,
                                          32
                                        )}...</p>
                                      </div>
                                      <div
                                        class="flex flex-wrap w-full"
                                      >
                                      <div class="flex-shrink-0">
                                        <span class="text-sm">ADK ${
                                          receivedBundle[0].value / 100000000
                                        }</span>
                                      </div>
                                      <div class="flex flex-grow w-auto justify-end">
                                      <span>
                                    ${new Date(
                                      receivedBundle[0].timestamp * 1000
                                    ).toLocaleDateString(undefined, {
                                      day: "numeric",
                                      month: "short",
                                    })}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <p class="text-xs uppercase ${
                                    receivedBundle[0].persistence
                                      ? "text-green-700"
                                      : "text-red-600"
                                  }" id="status">
                                    ${
                                      receivedBundle[0].persistence
                                        ? "Confirmed"
                                        : "Pending"
                                    }
                                  </p>
                                </div>
                          `
                    );
                  notifBtn.classList.add("active");
                  store.set("notifdate", `${now}`);
                }

                if (
                  notifHashes.includes(receivedBundle[0].hash) &&
                  receivedBundle[0].persistence == true
                ) {
                  const notification = document.querySelector(
                    `[data-hash=${receivedBundle[0].hash}]`
                  );
                  const status = notification.querySelector("#status");
                  status.innerHTML = "Confirmed";
                  status.classList.remove("text-red-600");
                  status.classList.add("text-green-700");
                  notifBtn.classList.add("active");
                }
              }
            });
          }
        );
        notifCount.innerHTML = notifHashes.length;
      }
    })();
  };

  UI.shutdown = function () {
    UI.isShuttingDown = true;
  };

  return UI;
})(UI || {}, jQuery);
