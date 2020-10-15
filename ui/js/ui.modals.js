var UI = (function (UI, $, undefined) {
  UI.showGeneratedSeed = function (returnHTML) {
    console.log("UI.showGeneratedSeed");

    var seed = generateSeed();

    // var seed =
    //   "TESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEEDTESTSEED";

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

      var html = "<table class='table-auto' id='info-tbl'>";

      $.each(info, function (key, value) {
        if (key != "duration") {
          var v = String(value);
          if (v.length > 30) {
            v = v.substr(0, 30) + "...";
          }
          html +=
            "<tr><td class='border px-4 py-2'>" +
            String(key).escapeHTML() +
            "</td><td class='border px-4 py-2'>" +
            v.escapeHTML() +
            "</td></tr>";
        }
      });

      html += "</table>";

      if (callback) {
        callback(
          null,
          "node-info-modal",
          "<h1 class='text-2xl text-center pb-3'>Server Information</h1><div class='contents'>" +
            html +
            "</div>"
        );
      } else {
        var $modal = $("#node-info-modal");

        $modal.find(".contents").html(html);

        modal.open();
      }
    });
  };

  return UI;
})(UI || {}, jQuery);
