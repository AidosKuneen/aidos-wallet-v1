const {
  remote,
  webFrame,
  ipcRenderer,
  shell,
  clipboard,
  BrowserView,
} = require("electron");

var __entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
};

String.prototype.escapeHTML = function () {
  return String(this).replace(/[&<>"'\/]/g, function (s) {
    return __entityMap[s];
  });
};

var UI = (function (UI, undefined) {
  var showQuitAlert = false;
  var isInitialized = false;
  var callNodeStarted = false;
  var serverLogLines = 0;
  var webviewIsLoaded = false;
  var lightWallet = false;
  var webview;

  UI.initialize = function () {
    isInitialized = true;

    var showStatusBar = false;
    var isFirstRun = false;

    if (typeof URLSearchParams != "undefined") {
      var params = new URLSearchParams(location.search.slice(1));
      showStatusBar = params.get("showStatus") == 1;
      isFirstRun = params.get("isFirstRun") == 1;
      lightWallet = parseInt(params.get("lightWallet"), 10) == 1;
    }

    if (isFirstRun) {
      document.body.className = "new-user-active";
    } else if (showStatusBar) {
      document.body.className = "status-bar-active";
    } else {
      document.body.className = "";
    }

    webFrame.setVisualZoomLevelLimits(1, 1);
    ipcRenderer.send("rendererIsInitialized");
    if (callNodeStarted) {
      UI.nodeStarted(callNodeStarted);
      callNodeStarted = false;
    }

    if (!lightWallet) {
      document.body.className += " full-node";
      document
        .getElementById("status-bar-milestone")
        .addEventListener("click", function (e) {
          ipcRenderer.send("showServerLog");
        });

      document
        .getElementById("status-bar-solid-milestone")
        .addEventListener("click", function (e) {
          ipcRenderer.send("showServerLog");
        });
    }

    document.getElementById("new-user").addEventListener("click", function (e) {
      UI.sendToWebview("openHelpMenu");
    });
  };

  UI.showContextMenu = function (e) {
    var template = [
      {
        label: "Cut",
        accelerator: "CmdOrCtrl+X",
        role: "cut",
      },
      {
        label: "Copy",
        accelerator: "CmdOrCtrl+C",
        role: "copy",
      },
      {
        label: "Paste",
        accelerator: "CmdOrCtrl+V",
        role: "paste",
      },
    ];

    if (remote.getCurrentWindow().isFullScreen()) {
      template.push({
        label: "Exit Fullscreen",
        accelerator: process.platform === "darwin" ? "Ctrl+Command+F" : "F11",
        click: function () {
          remote.getCurrentWindow().setFullScreen(false);
        },
      });
    }

    const menu = remote.Menu.buildFromTemplate(template);
    menu.popup(remote.getCurrentWindow(), e.x, e.y);
  };

  UI.nodeStarted = function (url, settings) {
    url =
      url +
      "?" +
      Object.keys(settings)
        .map(function (key) {
          return (
            encodeURIComponent(key) + "=" + encodeURIComponent(settings[key])
          );
        })
        .join("&");

    if (!isInitialized) {
      callNodeStarted = url;
      return;
    }

    console.log(url);

    // const view = new BrowserView();

    // view.setBounds({
    //   x: 0,
    //   y: 0,
    //   width: windowOptions.width,
    //   height: windowOptions.height,
    // });

    // view.webContents.loadURL(url);

    webview = document.getElementById("server");

    webviewIsLoaded = false;

    // webview.loadURL(url);

    webview.addEventListener("dom-ready", () => {
      console.log("webiew dom-ready");
      webview.loadURL(url);
    });

    // Prevent window from redirecting to dragged link location (mac)
    webview.addEventListener(
      "dragover",
      function (e) {
        e.preventDefault();
        return false;
      },
      false
    );

    //also "dom-ready"
    webview.addEventListener("did-finish-load", UI.webviewDidFinishLoad());

    //sometimes did-finish-load does not fire..
    setTimeout(UI.webviewDidFinishLoad, 1000);

    webview.addEventListener("new-window", function (e) {
      shell.openExternal(e.url);
    });
  };

  UI.webviewDidFinishLoad = function () {
    //for some reason this is sometimes called 2 times?..
    if (webviewIsLoaded) {
      return;
    }

    // if (remote.getGlobal("hasOtherWin")) {
    //   return;
    // }

    if (webview.style.display == "none") {
      webview.style.display = "";
    }

    webviewIsLoaded = true;

    const remoteContent = remote.webContents.fromId(webview.getWebContentsId());

    console.log(remote.webContents.fromId(webview.getWebContentsId()));

    remoteContent.addListener("context-menu", function (e) {
      e.preventDefault();
      e.stopPropagation();
      UI.showContextMenu(e);
    });

    setTimeout(function () {
      remote.getCurrentWindow().show();
      webview.focus();
      //ipcRenderer.send("rendererIsReady");
    }, 250);

    try {
      webview
        .getWebContents()
        .document.body.addEventListener(
          "contextmenu",
          UI.showContextMenu,
          false
        );
    } catch (err) {}
  };

  // https://github.com/electron/electron/issues/5900
  UI.focusOnWebview = function () {
    if (webviewIsLoaded && webview) {
      webview.focus();
    }
  };

  UI.showServerLog = function (serverOutput) {
    if (showQuitAlert) {
      return;
    }

    UI.hideAlerts();

    serverLogLines = serverOutput.length;
    var log = serverOutput.join("\n");

    log = log.replace(/\n\s*\n/g, "\n");

    UI.showAlert(
      "<h1>Server Log</h1><p>Below are the last messages from the server log (<a href='#' id='copy_server_log'>copy</a>):</p>" +
        "<textarea rows='10' class='form-control' id='server_output' style='background:#000;color:#fff;font-family:courier;' readonly>" +
        String(log).escapeHTML() +
        "</textarea>",
      function () {
        document
          .getElementById("copy_server_log")
          .addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            UI.copyServerLog();
          });
      },
      function () {
        ipcRenderer.send("stopLookingAtServerLog");
      }
    );

    document.getElementById(
      "server_output"
    ).scrollTop = document.getElementById("server_output").scrollHeight;
  };

  UI.copyServerLog = function () {
    document.getElementById("server_output").select();
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
  };

  UI.appendToServerLog = function (data) {
    var serverLog = document.getElementById("server_output");

    if (serverLog) {
      serverLogLines++;
      if (serverLogLines > 5000) {
        var lines = serverLog.value.split(/\n/);
        lines = lines.slice(lines.length - 1001, lines.length - 1);
        serverLog.value = lines.join("\n");
        serverLogLines = 1000;
      }
      serverLog.value += data;
      if (
        serverLog.scrollHeight -
          (serverLog.scrollTop + serverLog.offsetHeight) <
        100
      ) {
        serverLog.scrollTop = serverLog.scrollHeight;
      }
    }
  };

  UI.toggleStatusBar = function (show) {
    document.body.className = show ? "status-bar-active" : "";
    if (webviewIsLoaded && webview) {
      webview.send("toggleStatusBar", show);
    }
  };

  UI.updateStatusBar = function (data) {
    if (data.hasOwnProperty("latestSolidSubmeshMilestoneIndex")) {
      document.getElementById("status-bar-solid-milestone").innerHTML = String(
        data.latestSolidSubmeshMilestoneIndex
      ).escapeHTML();
    }
    if (data.hasOwnProperty("latestMilestoneIndex")) {
      document.getElementById("status-bar-milestone").innerHTML = String(
        data.latestMilestoneIndex
      ).escapeHTML();
    }

    if (data.hasOwnProperty("cpu")) {
      if (data.cpu === "") {
        document.getElementById("status-bar-cpu").innerHTML = "";
      } else {
        document.getElementById("status-bar-cpu").innerHTML =
          "CPU: " + String(data.cpu).escapeHTML() + "%";
      }
    }

    if (document.getElementById("status-bar-dot-1").style.display == "none") {
      if (
        document.getElementById("status-bar-milestone").innerHTML &&
        document.getElementById("status-bar-solid-milestone").innerHTML
      ) {
        document.getElementById("status-bar-dot-1").style.display = "inline";
      }
    }
    if (document.getElementById("status-bar-dot-2").style.display == "none") {
      if (
        (document.getElementById("status-bar-milestone").innerHTML ||
          document.getElementById("status-bar-solid-milestone").innerHTML) &&
        document.getElementById("status-bar-cpu").innerHTML
      ) {
        document.getElementById("status-bar-dot-2").style.display = "inline";
      }
    }

    if (data.hasOwnProperty("hoverAmount")) {
      if (data.hoverAmount == -1) {
        document.getElementById("status-bar-aidos").style.display = "none";
      } else {
        document.getElementById("status-bar-aidos").style.display = "inline";
        document.getElementById(
          "status-bar-aidos"
        ).innerHTML = UI.convertToAidos(data.hoverAmount);
      }
    }
  };

  UI.convertToAidos = function (amount) {
    if (isNaN(amount)) {
      return "";
    }

    var negative = "";

    if (amount < 0) {
      amount = Math.abs(amount);
      negative = "-";
    }

    formattedAmount = negative + amount + " ADK";

    return formattedAmount;
  };

  UI.showPreferences = function (settings) {
    UI.hideAlerts();

    var modal = new tingle.modal({
      footer: true,
      onOpen: function () {
        var close = document.querySelector(".tingle-modal__close");
        var modalContent = document.querySelector(".tingle-modal-box__content");
        modalContent.appendChild(close);
      },
    });

    /*
    modal.setContent("<h1>Preferences</h1>" + 
                     "<select name='auto_update_time' id='auto_update_time' style='width:100%'>" + 
                     "<option value='1'" + (checkForUpdatesOption == "1" ? " selected='selected'" : "") + ">Check for Updates on Application Start</option>" + 
                     "<option value='2'" + (checkForUpdatesOption == "2" ? " selected='selected'" : "") + ">Check for updates daily</option>" + 
                     "<option value='3'" + (checkForUpdatesOption == "3" ? " selected='selected'" : "") + ">Check for updates weekly</option>" + 
                     "<option value='0'" + (checkForUpdatesOption == "0" ? " selected='selected'" : "") + ">Never check for updates</option>" + 
                     "</select>");
    */

    modal.setContent(
      "<h1>Preferences</h1>" +
        (process.platform != "linux"
          ? "<div class='input-group input-group-last'><label class='label--checkbox'><input type='checkbox' name='open_at_login' id='preferences_open_at_login' class='checkbox' value='1'" +
            (settings.openAtLogin ? " checked='checked'" : "") +
            " />Open at Login</label>"
          : "")
    );

    modal.addFooterBtn("Save", "tingle-btn tingle-btn--primary", function () {
      var settings = {};

      if (process.platform != "linux") {
        settings.openAtLogin = document.getElementById(
          "preferences_open_at_login"
        ).checked;
      }

      /*
      var autoUpdateTimeSelect = document.getElementById("auto_update_time");
      var checkForUpdatesOption = autoUpdateTimeSelect.options[autoUpdateTimeSelect.selectedIndex].value;
      */

      modal.close();
      ipcRenderer.send("updatePreferences", settings);
    });

    modal.open();
  };

  UI.addPeerNode = function (node) {
    if (showQuitAlert) {
      return;
    }

    UI.hideAlerts();

    var modal = new tingle.modal({
      footer: true,
      onOpen: function () {
        var close = document.querySelector(".tingle-modal__close");
        var modalContent = document.querySelector(".tingle-modal-box__content");
        modalContent.appendChild(close);
      },
    });

    modal.setContent(
      "<h1>Add Peer</h1>" +
        "<p>Are you sure you want to add this Peer to your server configuration?</p>" +
        "<p style='font-weight:bold'>" +
        String(node).escapeHTML() +
        "</p>"
    );

    modal.addFooterBtn(
      "Yes, Add This Peer",
      "tingle-btn tingle-btn--primary",
      function () {
        modal.close();
        ipcRenderer.send("addPeerNode", node);
      }
    );

    modal.addFooterBtn(
      "No, Cancel",
      "tingle-btn tingle-btn--default",
      function () {
        modal.close();
      }
    );

    modal.open();
  };

  UI.editNodeConfiguration = function (configuration) {
    if (showQuitAlert) {
      return;
    }

    UI.hideAlerts();

    var modal = new tingle.modal({
      footer: true,
      onOpen: function () {
        var close = document.querySelector(".tingle-modal__close");
        var modalContent = document.querySelector(".tingle-modal-box__content");
        modalContent.appendChild(close);

        var el = document.getElementById(
          configuration.lightWallet
            ? "server_config_host"
            : "server_config_port"
        );

        var temp = el.value;
        el.value = "";
        el.value = temp;
        el.focus();
      },
    });

    var content = "";

    if (configuration.lightWallet) {
      var host = "wallet1.aidoskuneen.com";
      if (configuration.lightWalletHost) {
        host = configuration.lightWalletHost.match(/^https?:\/\/(.*)$/i);
        if (host && host.length > 0) {
          host = host[1];
        }
      }
      content =
        "<h3>Enter Server Address: </h3>" +
        "<input class='cfg' maxlength='32' type='text' id='server_config_host' placeholder='wallet1.aidoskuneen.com' value='" +
        host +
        "' />" +
        "<botLabel>(without 'http://' and port number)</botLabel>";
    }
    modal.setContent(content);

    modal.addFooterBtn("OK", "cfg-btn2", function () {
      var config = {};

      config.lightWallet = configuration.lightWallet;

      if (configuration.lightWallet) {
        //[0-9]+
        var res = String(document.getElementById("server_config_host").value); //.match(/^(https?:\/\/.*):(14266)$/i);

        if (!res) {
          document.getElementById("host-error").style.display = "inline";
          document.getElementById("host-error").innerHTML = "Invalid!";
          return;
        }

        config.lightWalletHost = "http://" + res;
        config.lightWalletPort = configuration.testNet ? 15555 : 14266; //res[2];
        config.minWeightMagnitude = configuration.testNet ? "13" : "18"; //parseInt(document.getElementById("server_config_min_weight_magnitude").value, 10);
      } else {
        config.port = configuration.testNet ? 15555 : 14266; //parseInt(document.getElementById("server_config_port").value, 10);
        config.depth = parseInt(
          document.getElementById("server_config_depth").value,
          10
        );
        config.minWeightMagnitude = configuration.testNet ? "13" : "18"; //parseInt(document.getElementById("server_config_min_weight_magnitude").value, 10);
        config.nodes = document.getElementById("server_config_peers").value;
      }

      modal.close();

      ipcRenderer.send("updateNodeConfiguration", config);
    });

    modal.open();
  };

  UI.showUpdateAvailable = function () {
    UI.showAlert(
      "<h1>Update Available</h1><p>An update is available and is being downloaded.</p>"
    );
  };

  UI.showUpdateDownloaded = function (releaseNotes, releaseName, releaseDate) {
    if (showQuitAlert) {
      return;
    }

    UI.hideAlerts();

    var modal = new tingle.modal({
      allowClose: false,
      footer: true,
      cssClass: ["update-downloaded"],
    });

    modal.setContent(
      "<h1>New Update Available...</h1><p>Version " +
        String(releaseName).escapeHTML() +
        " is downloaded and ready to install."
    );

    modal.addFooterBtn(
      "Install Now",
      "tingle-btn tingle-btn--primary",
      function () {
        modal.close();
        ipcRenderer.send("installUpdate");
      }
    );

    modal.addFooterBtn(
      "Install on Quit",
      "tingle-btn tingle-btn--default",
      function () {
        modal.close();
      }
    );

    modal.open();
  };

  UI.showUpdateError = function () {
    UI.showAlert(
      "<h1>Update Error</h1><p>An error occurred during checking for an update.</p>"
    );
  };

  UI.showCheckingForUpdate = function () {
    if (showQuitAlert) {
      return;
    }

    UI.showAlert(
      "<h1>Checking for Updates...</h1><p>Checking for updates, please wait...</p>"
    );
  };

  UI.showUpdateNotAvailable = function () {
    UI.showAlert(
      "<h1>No Updates</h1><p>No updates are currently available.</p>"
    );
  };

  UI.showKillAlert = function () {
    showQuitAlert = true;

    UI.hideAlerts();

    var modal = new tingle.modal({
      footer: false,
      allowClose: false,
    });

    modal.setContent(
      "<h1>Shutdown In Progress</h1><p style='margin-bottom:0'>Shutting down Aidos... Please wait.</p>"
    );

    modal.open();
  };

  UI.hideAlerts = function () {
    var nodes = document.querySelectorAll(".tingle-modal");
    Array.prototype.forEach.call(nodes, function (node) {
      node.parentNode.removeChild(node);
    });

    var body = document.querySelector("body");
    body.classList.remove("tingle-enabled");
  };

  UI.showAlert = function (msg, openCallback, closeCallback) {
    if (showQuitAlert) {
      return;
    }

    UI.hideAlerts();

    var modal = new tingle.modal({
      footer: true,
      onOpen: function () {
        var close = document.querySelector(".tingle-modal__close");
        var modalContent = document.querySelector(".tingle-modal-box__content");
        modalContent.appendChild(close);
        if (openCallback) {
          openCallback();
        }
      },
      onClose: function () {
        if (closeCallback) {
          closeCallback();
        }
      },
    });

    modal.setContent(msg);

    modal.addFooterBtn("OK", "tingle-btn tingle-btn--primary", function () {
      modal.close();
    });

    modal.open();
  };

  UI.showAlertAndQuit = function (msg, serverOutput, callback) {
    if (showQuitAlert) {
      return;
    }

    showQuitAlert = true;

    UI.hideAlerts();

    if (!msg) {
      msg =
        "<h1>Error</h1><p>An error occurred, the server has quit. Please restart the application.</p>";
    }

    if (serverOutput && serverOutput.length) {
      var log = serverOutput.join("\n");

      log = log.replace(/\n\s*\n/g, "\n");

      var html =
        "<p>" +
        msg +
        "</p><textarea rows='6' class='form-control' readonly>" +
        String(log).escapeHTML() +
        "</textarea>";
    } else {
      var html = "<p>" + msg + "</p>";
    }

    var modal = new tingle.modal({
      footer: true,
      allowClose: false,
      onClose: function () {
        remote.getCurrentWindow().hide();
        remote.getCurrentWindow().close();
      },
    });

    modal.setContent(html);

    modal.addFooterBtn("OK", "tingle-btn tingle-btn--primary", function () {
      modal.close();
    });

    modal.open();
  };

  UI.relaunchApplication = function (didFinalize) {
    ipcRenderer.send("relaunchApplication", didFinalize);
  };

  UI.toggleDeveloperTools = function () {
    if (webviewIsLoaded && webview) {
      if (webview.isDevToolsOpened()) {
        webview.closeDevTools();
      } else {
        webview.openDevTools({ mode: "undocked" });
      }
    }
  };

  UI.sendToWebview = function (command, args) {
    if (showQuitAlert) {
      return;
    }

    if (webviewIsLoaded && webview) {
      webview.send(command, args);
    } else if (
      args &&
      args.constructor == Object &&
      args.hasOwnProperty("relaunch") &&
      args.relaunch
    ) {
      UI.relaunchApplication(true);
    }
  };

  UI.setFocus = function (focus) {
    if (webviewIsLoaded && webview) {
      webview.send("setFocus", focus);
    }
  };

  UI.notify = function (type, message, options) {
    if (webviewIsLoaded && webview) {
      webview.send("notify", type, message, options);
    }
  };

  UI.handleURL = function (url) {
    UI.hideAlerts();

    url = decodeURI(
      url.replace("aidos://", "").toLowerCase().replace(/\/$/, "")
    );

    if (url == "config" || url == "configuration" || url == "setup") {
      ipcRenderer.send("editNodeConfiguration");
    } else if (url == "log") {
      if (!lightWallet) {
        ipcRenderer.send("showServerLog");
      }
    } else if (url == "nodeinfo" || url == "node") {
      UI.sendToWebview("showNodeInfo");
    } else if (url == "peers") {
      UI.sendToWebview("showPeers");
    } else if (url == "spam" || url == "spammer") {
      UI.sendToWebview("showNetworkSpammer");
    } else if (url == "generateseed" || url == "seed") {
      UI.sendToWebview("generateSeed");
    } else if (url == "claim") {
      UI.sendToWebview("showClaimProcess");
    } else if (url == "faq") {
      UI.sendToWebview("faq");
    } else {
      var match = url.match(/(?:addnode|addneighbou?r)\/(.*)/i);
      if (match && match[1] && match[1].charAt(0) != "-") {
        if (!lightWallet) {
          UI.addPeerNode(match[1]);
        }
      } else {
        UI.sendToWebview("handleURL", url);
      }
    }
  };

  UI.relaunch = function () {
    UI.hideAlerts();
    showQuitAlert = false;
    webviewIsLoaded = false;
    var server = document.getElementById("server");
    if (server) {
      server.style.display = "none";
    }
  };

  UI.shutdown = function () {
    if (webviewIsLoaded && webview) {
      webview.send("shutdown");
    }
  };

  return UI;
})(UI || {});

window.addEventListener("load", UI.initialize, false);

window.addEventListener("focus", UI.focusOnWebview);

window.addEventListener("contextmenu", function (e) {
  e.preventDefault();
  e.stopPropagation();
  UI.showContextMenu(e);
});

ipcRenderer.on("showAlertAndQuit", function (
  event,
  msg,
  serverOutput,
  callback
) {
  UI.showAlertAndQuit(msg, serverOutput, callback);
});

ipcRenderer.on("showKillAlert", UI.showKillAlert);

ipcRenderer.on("nodeStarted", function (event, url, settings) {
  UI.nodeStarted(url, settings);
});

ipcRenderer.on("showServerLog", function (event, serverOutput) {
  UI.showServerLog(serverOutput);
});

ipcRenderer.on("appendToServerLog", function (event, data) {
  UI.appendToServerLog(data);
});

ipcRenderer.on("toggleStatusBar", function (event, show) {
  UI.toggleStatusBar(show);
});

ipcRenderer.on("updateStatusBar", function (event, data) {
  UI.updateStatusBar(data);
});

ipcRenderer.on("updateAppInfo", function (event, data) {
  ipcRenderer.send("updateAppInfo", data);
});

ipcRenderer.on("showUpdateAvailable", UI.showUpdateAvailable);

ipcRenderer.on("showUpdateDownloaded", function (
  event,
  releaseNotes,
  releaseName,
  releaseDate
) {
  UI.showUpdateDownloaded(releaseNotes, releaseName, releaseDate);
});

ipcRenderer.on("showUpdateError", UI.showUpdateError);

ipcRenderer.on("showCheckingForUpdate", UI.showCheckingForUpdate);

ipcRenderer.on("showUpdateNotAvailable", UI.showUpdateNotAvailable);

ipcRenderer.on("showPreferences", function (event, settings) {
  UI.showPreferences(settings);
});

ipcRenderer.on("showNodeInfo", function () {
  UI.hideAlerts();
  UI.sendToWebview("showNodeInfo");
});

ipcRenderer.on("showModal", function (event, identifier, html) {
  UI.hideAlerts();

  var modal = new tingle.modal({
    footer: false,
    cssClass: [identifier],
    onOpen: function () {
      var close = document.querySelector(".tingle-modal__close");
      var modalContent = document.querySelector(".tingle-modal-box__content");
      modalContent.appendChild(close);

      if (identifier == "generated-seed-modal") {
        document.getElementById(
          "generated-seed-value"
        ).onclick = document.getElementById(
          "generated-seed-value-copy"
        ).onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          clipboard.writeText(
            document.getElementById("generated-seed-value").dataset
              .clipboardText
          );
        };
      }
    },
  });

  modal.setContent(html);

  modal.open();
});

ipcRenderer.on("handleURL", function (event, url) {
  UI.handleURL(url);
});

ipcRenderer.on("showPeers", function () {
  UI.hideAlerts();
  UI.sendToWebview("showPeers");
});

ipcRenderer.on("showFAQ", function () {
  UI.hideAlerts();
  UI.sendToWebview("showFAQ");
});

ipcRenderer.on("showTerm", function () {
  UI.hideAlerts();
  UI.sendToWebview("showTerm");
});

ipcRenderer.on("addPeer", function (event, addedNode) {
  UI.sendToWebview("addPeer", { add: addedNode });
});

ipcRenderer.on("stopCcurl", function (event, data) {
  UI.sendToWebview("stopCcurl", data);
});

ipcRenderer.on("editNodeConfiguration", function (event, serverConfiguration) {
  UI.editNodeConfiguration(serverConfiguration);
});

ipcRenderer.on("toggleDeveloperTools", UI.toggleDeveloperTools);

ipcRenderer.on("setFocus", function (event, focus) {
  UI.setFocus(focus);
});

ipcRenderer.on("hoverAmountStart", function (event, amount) {
  UI.updateStatusBar({ hoverAmount: amount });
});

ipcRenderer.on("hoverAmountStop", function () {
  UI.updateStatusBar({ hoverAmount: -1 });
});

ipcRenderer.on("notify", function (event, type, message, options) {
  UI.notify(type, message, options);
});

ipcRenderer.on("relaunch", UI.relaunch);

ipcRenderer.on("shutdown", UI.shutdown);
