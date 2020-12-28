var UI = (function (UI, $, undefined) {
  UI.showGeneratedSeed = function (returnHTML) {
    console.log("UI.showGeneratedSeed");

    // var seed = generateSeed();

    var seed =
      "TESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEED";

    var $seedContainer = $("#generated-seed");

    $seedContainer.find("#seed").attr("value", seed);

    $seedContainer.find("#seed").attr("data-clipboard-text", seed);
  };

  function generateSeed() {
    var cryptoObj = window.crypto || window.msCrypto; // for IE 11

    if (!cryptoObj) {
      throw "Crypto tools not available";
    }

    var seed = "";
    var characters = "9ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    var randomValues = new Uint32Array(81);
    cryptoObj.getRandomValues(randomValues);

    for (var i = 0; i < 81; i++) {
      seed += characters.charAt(randomValues[i] % 27);
    }

    return seed;
  }

  UI.showPeers = function (callback) {
    console.log("UI.showPeers");

    if (!callback && UI.isLocked) {
      console.log("UI.showPeers: UI is locked");
      return;
    }

    aidos.api.getPeerAddresses(function (error, activity) {
      if (error) {
        return callback ? callback(error) : error;
      }

      var html = "";

      if (!activity.peerlist) {
        html = "<p>No peers found.</p>";
      } else {
        for (var i = 0; i < activity.peerlist.length; i++) {
          var peer = activity.peerlist[i];

          html += "<div class='list'><ul>";

          $.each(peer, function (key, value) {
            html +=
              "<li><div class='details'><div class='address'>" +
              String(key).escapeHTML() +
              "</div></div><div class='value'>" +
              String(value).escapeHTML() +
              "</div></li>";
          });

          html += "</ul></div>";

          if (i < activity.peerlist.length - 1) {
            html += "<br><br>";
          }
        }

        if (callback) {
          callback(
            null,
            "peers-modal",
            "<h1>Peers (" +
              activity.peerlist.length +
              ")</h1><div class='contents'>" +
              html +
              "</div>"
          );
        } else {
          var $modal = $("#peers-modal");

          $("#peer-count").html(activity.peerlist.length);

          $modal.find(".contents").html(html);

          // var modal = $modal.remodal({ hashTracking: false });
          modal.open();
        }
      }
    });
  };

  UI.showNodeInfo = function (callback) {
    console.log("UI.showNodeInfo");

    if (!callback && UI.isLocked) {
      console.log("UI.showNodeInfo: UI is locked");
      return;
    }

    aidos.api.getNodeInfo(function (error, info) {
      if (error) {
        return callback ? callback(error) : error;
      }

      var html = "<table class='table-auto mx-auto' id='info-tbl'>";

      $.each(info, function (key, value) {
        if (key != "duration") {
          var v = String(value);
          if (v.length > 30) {
            v = v.substr(0, 30) + "...";
          }
          html +=
            "<tr><td class='border border-platinum px-4 py-2'>" +
            String(key).escapeHTML() +
            "</td><td class='border border-platinum px-4 py-2'>" +
            v.escapeHTML() +
            "</td></tr>";
        }
      });

      html += "</table>";

      if (callback) {
        callback(
          null,
          "node-info-modal",
          `<div class="flex flex-wrap h-full bg-cultured rounded-xl shadow-lg">
            <div class="w-full">
              <div class="px-6 flex flex-wrap items-center justify-between h-24 rounded-tl-xl rounded-tr-xl bg-dr-white">
                <div class="flex items-center flex-shrink-0">
                  <button type="button" class="rounded-full bg-gainsboro opacity-50 text-silver text-3xl p-2" id="modal-close">
                    <img
                      src="ui/images/close.svg"
                      alt=""
                    />
                  </button>
                </div>
                <div class="flex flex-grow items-center w-auto">
                  <div class="flex-grow text-center">
                    <h2 class="font-medium text-3xl">Server Information</h2>
                  </div>
                </div>
              </div>
            </div>
            <div class="w-full py-8 content">
              <div class="h-72 overflow-y-scroll">${html}</div>
            </div>
          </div>`
        );
      } else {
        var $modal = $("#node-info-modal");

        $modal.find(".content").html(html);

        modal.open();
      }
    });
  };

  return UI;
})(UI || {}, jQuery);
