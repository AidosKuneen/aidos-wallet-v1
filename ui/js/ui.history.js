var UI = (function (UI, $, undefined) {
  UI.handleHistory = function () {
    $(
      "#history-stack, #history-stack-latest, #history-stack-send, #history-stack-received"
    ).on("click", ".details", function (e) {
      console.log("clicked");
      e.preventDefault();
      var hash = $(this).data("hash");
      var $modal = $("#bundle-details");

      var persistence = $(this).data("persistence");
      var options = {
        hashTracking: false,
        closeOnOutsideClick: false,
        closeOnEscape: false,
      };

      console.log("UI.handleHistory: Show bundle modal for hash " + hash);
      aidos.api.getBundle(hash, function (error, transactions) {
        if (error) {
          console.log(error);
          return;
        }
        var send_html = "";
        var recv_html = "";

        for (var i = 0; i < transactions.length; i++) {
          var adr_short =
            aidos.utils.addChecksum(transactions[i].address).substr(0, 15) +
            "...";
          var adr = aidos.utils.addChecksum(transactions[i].address);
          var bdHash = transactions[0].bundle;
          var html =
            "<div class='pb-3'><a href='#' class='clipboard' title='" +
            adr +
            "' data-clipboard-text='" +
            adr +
            "'>" +
            adr_short +
            "</a>" +
            "<span class='float-right font-medium text-green-700'>" +
            UI.formatAmount(transactions[i].value) +
            "</span></div>";

          if (transactions[i].value >= 0) {
            recv_html += html;
          } else {
            send_html += html;
          }
        }
        $modal.find("#recv_right").html(recv_html);
        $modal.find("#send_left").html(send_html);
        $modal.find("#bd-hash").html(bdHash.substr(0, 50) + "...");
        $modal.find("#bd-hash").attr("data-clipboard-text", bdHash);
        if (persistence) {
          $modal.find(".confirmed").show();
          $modal.find(".unconfirmed").hide();
          $modal.find(".btn").hide();
        } else {
          $modal.find(".confirmed").hide();
          $modal.find(".unconfirmed").show();
          $modal.find(".btn").show();
        }
        $modal.find(".btn").data("hash", hash);
        $modal.find(".btn").each(function () {
          $(this).loadingReset($(this).data("initial"));
        });

        $("#bundle-details").modal({
          showClose: false,
        });
      });
    });

    $("#rebroadcast-btn").on("click", function (e) {
      e.preventDefault();

      var hash = $(this).data("hash");

      if (!hash) {
        console.log("UI.replay/rebroadcast: No hash");
        return;
      }

      $(".remodal-close").on("click", function (e) {
        UI.notify("error", "Cannot close whilst rebroadcasting");
        e.preventDefault();
        e.stopPropagation();
      });

      console.log("UI.handleHistory: Do rebroadcast for hash " + hash);

      UI.isLocked = true;

      aidos.api.broadcastBundle(hash, function (error, bundle) {
        if (error) {
          console.log("UI.rebroadcast: Error");
          console.log(error);
          $("#rebroadcast-btn").loadingError(error);
        } else {
          console.log("UI.rebroadcast: Success");
          if (!UI.isFocused()) {
            UI.notifyDesktop("Transaction rebroadcasted successfully");
          }
          $("#rebroadcast-btn").loadingSuccess("Rebroadcast Completed");
          UI.updateState(1000);
        }

        UI.isLocked = false;
        $(".remodal-close").off("click");
      });
    });
  };

  UI.updateHistory = function () {
    //no changes..
    if (
      JSON.stringify(connection.accountData) ==
      JSON.stringify(connection.previousAccountData)
    ) {
      return;
    }

    // var $transfersBtn = $("#history-stack li[data-type=transfers]");
    // var $addressesBtn = $("#history-stack li[data-type=addresses]");

    var $transfers = $("#history-stack .transfers");
    var $addresses = $("#history-stack .addresses");

    var transfersHtml = (addressesHtml = "");
    var sentHtml = (addressesHtml = "");
    var receivedHtml = (addressesHtml = "");

    if (connection.accountData) {
      var addresses = aidos.utils
        .addChecksum(connection.accountData.addresses)
        .reverse();

      $.each(addresses, function (i, address) {
        addressesHtml += "<li>";
        addressesHtml += "<div class='details'>";
        addressesHtml +=
          "<div class='address'>" + UI.formatForClipboard(address) + "</div>";
        addressesHtml += "</div>";
        addressesHtml += "<div class='value'></div>";
        addressesHtml += "</div>";
        addressesHtml += "</li>";
      });

      var categorizedTransfers = aidos.utils.categorizeTransfers(
        connection.accountData.transfers,
        connection.accountData.addresses
      );
      var addresses = connection.accountData.addresses;

      $.each(connection.accountData.transfers.reverse(), function (i, bundle) {
        var persistence = bundle[0].persistence ? bundle[0].persistence : false;
        var isSent = false;
        var index = [];

        $.each(categorizedTransfers.sent, function (i, sentBundle) {
          if (sentBundle[0].hash == bundle[0].hash) {
            sentHtml +=
              "<div class='single-transaction py-5 flex flex-wrap items-center'>";
            sentHtml +=
              "<div class='flex flex-wrap items-center flex-shrink-0 w-full'>";
            sentHtml += '<span class="font-montserrat text-xl text-red-600">';
            sentHtml +=
              '<img src="./images/arrow-left.svg" alt="" onload="SVGInject(this)" />';
            sentHtml += "</span>";
            sentHtml += "<div class='ml-4 flex flex-col justify-center'>";
            sentHtml +=
              '<p class="hash clipboard cursor-pointer" data-clipboard-text="' +
              sentBundle[0].hash +
              '">' +
              sentBundle[0].hash.substr(0, 40) +
              "..." +
              "</p>";
            sentHtml +=
              "<span class='text-xs'>" +
              UI.formatAmount("-" + sentBundle[0].value) +
              " (" +
              (persistence ? "Confirmed" : "Pending") +
              ")</span>";
            sentHtml +=
              '<div class="flex flex-grow w-auto justify-end"></div></div>';
            sentHtml +=
              "<button type='button' class='details ml-auto pr-4 text-sm text-dark-green' data-hash='" +
              String(sentBundle[0].hash).escapeHTML() +
              "' data-type='" +
              (isSent ? "spending" : "receiving") +
              "' data-persistence='" +
              persistence * 1 +
              "'>View Bundle</button></div></div>";

            isSent = true;
            return false;
          }
        });
        $.each(categorizedTransfers.received, function (i, receivedBundle) {
          if (receivedBundle[0].hash == bundle[0].hash) {
            receivedHtml +=
              "<div class='single-transaction py-5 flex flex-wrap items-center'>";
            persistence * 1 + "'>";
            receivedHtml +=
              "<div class='flex flex-wrap items-center flex-shrink-0 w-full'>";
            receivedHtml +=
              '<span class="font-montserrat text-xl text-green-700">';
            receivedHtml +=
              '<img src="./images/arrow-right.svg" alt="" onload="SVGInject(this)" />';
            receivedHtml += "</span>";
            receivedHtml += "<div class='ml-4 flex flex-col justify-center'>";
            receivedHtml +=
              '<p class="hash clipboard cursor-pointer" data-clipboard-text="' +
              receivedBundle[0].hash +
              '">' +
              receivedBundle[0].hash.substr(0, 40) +
              "..." +
              "</p>";
            receivedHtml +=
              "<span class='text-xs'>" +
              UI.formatAmount("" + receivedBundle[0].value) +
              " (" +
              (persistence ? "Confirmed" : "Pending") +
              ")</span>";
            receivedHtml +=
              '<div class="flex flex-grow w-auto justify-end"></div></div>';
            receivedHtml +=
              "<button type='button' class='details ml-auto pr-4 text-sm text-dark-green' data-hash='" +
              String(receivedBundle[0].hash).escapeHTML() +
              "' data-type='" +
              (isSent ? "spending" : "receiving") +
              "' data-persistence='" +
              persistence * 1 +
              "'>View Bundle</button></div></div>";
          }
        });

        // if !isSent check for address and amount to display, because it's possible that a bundle has multiple tx that go to different accounts
        if (!isSent && bundle.length > 3) {
          addresses.forEach(function (address) {
            bundle.forEach(function (tx, i) {
              if (address == tx.address) {
                //found address for seed, save bundle index
                index.push(i);
              }
            });
          });
        }

        transfersHtml +=
          "<div class='single-transaction py-5 flex flex-wrap items-center'>";
        persistence * 1 + "'>";
        transfersHtml +=
          "<div class='flex flex-wrap items-center flex-shrink-0 w-full'>";
        transfersHtml +=
          '<span class="font-montserrat text-xl ' +
          (isSent ? "text-red-600" : "text-green-700") +
          '">';
        isSent
          ? (transfersHtml +=
              '<img src="./images/arrow-left.svg" alt="" onload="SVGInject(this)" />')
          : (transfersHtml +=
              '<img src="./images/arrow-right.svg" alt="" onload="SVGInject(this)" />');
        transfersHtml += "</span>";
        transfersHtml += "<div class='ml-4 flex flex-col justify-center'>";
        if (index.length > 0) {
          index.forEach(function (i) {
            transfersHtml +=
              '<p class="hash clipboard cursor-pointer" data-clipboard-text="' +
              bundle[i].hash +
              '">' +
              bundle[i].hash.substr(0, 40) +
              "..." +
              "</p>";
            transfersHtml +=
              '<span class="text-xs">' +
              UI.formatAmount((isSent ? "-" : "") + bundle[i].value) +
              " (" +
              (persistence ? "Confirmed" : "Pending") +
              ")</span>";
          });
        } else {
          transfersHtml +=
            '<p class="hash clipboard cursor-pointer" data-clipboard-text="' +
            bundle[0].hash +
            '">' +
            bundle[0].hash.substr(0, 40) +
            "..." +
            "</p>";
          transfersHtml +=
            "<span class='text-xs'>" +
            UI.formatAmount((isSent ? "-" : "") + bundle[0].value) +
            " (" +
            (persistence ? "Confirmed" : "Pending") +
            ")</span>";
        }
        // transfersHtml +=
        //   '<p class="date">' +
        //   (bundle[0].timestamp != "0"
        //     ? UI.formatDate(bundle[0].timestamp, true)
        //     : "Genesis") +
        //   "</p>";
        transfersHtml +=
          '<div class="flex flex-grow w-auto justify-end"></div></div>';
        transfersHtml +=
          "<button type='button' class='details ml-auto pr-4 text-sm text-dark-green' data-hash='" +
          String(bundle[0].hash).escapeHTML() +
          "' data-type='" +
          (isSent ? "spending" : "receiving") +
          "' data-persistence='" +
          persistence * 1 +
          "'>View Bundle</button></div></div>";
        return;
      });

      //Latest Transaction
      if ($("#history-stack-latest")) {
        var latestHtml = (addressesHtml = "");

        $.each(connection.accountData.transfers, function (i, bundle) {
          var persistence = bundle[0].persistence
            ? bundle[0].persistence
            : false;
          var isSent = false;
          var index = [];

          $.each(categorizedTransfers.sent, function (i, sentBundle) {
            if (sentBundle[0].hash == bundle[0].hash) {
              isSent = true;
              return false;
            }
          });

          // if !isSent check for address and amount to display, because it's possible that a bundle has multiple tx that go to different accounts
          if (!isSent && bundle.length > 3) {
            addresses.forEach(function (address) {
              bundle.forEach(function (tx, i) {
                if (address == tx.address) {
                  //found address for seed, save bundle index
                  index.push(i);
                }
              });
            });
          }

          latestHtml +=
            "<div class='single-transaction py-5 flex flex-wrap items-center'>";
          latestHtml +=
            "<div class='flex flex-wrap items-center flex-shrink-0 w-full'>";
          latestHtml +=
            '<span class="font-montserrat text-xl ' +
            (isSent ? "text-red-600" : "text-green-700") +
            '">';
          isSent
            ? (latestHtml +=
                '<img src="./images/arrow-left.svg" alt="" onload="SVGInject(this)" />')
            : (latestHtml +=
                '<img src="./images/arrow-right.svg" alt="" onload="SVGInject(this)" />');
          latestHtml += "</span>";
          latestHtml += "<div class='ml-4 flex flex-col justify-center'>";
          if (index.length > 0) {
            index.forEach(function (i) {
              latestHtml +=
                '<p class="hash clipboard cursor-pointer" data-clipboard-text="' +
                bundle[i].hash +
                '">' +
                bundle[i].hash.substr(0, 40) +
                "..." +
                "</p>";
              latestHtml +=
                '<span class="text-xs">' +
                UI.formatAmount((isSent ? "-" : "") + bundle[i].value) +
                " (" +
                (persistence ? "Confirmed" : "Pending") +
                ")</span>";
            });
          } else {
            latestHtml +=
              '<p class="hash clipboard cursor-pointer" data-clipboard-text="' +
              bundle[0].hash +
              '">' +
              bundle[0].hash.substr(0, 40) +
              "..." +
              "</p>";
            latestHtml +=
              "<span class='text-xs'>" +
              UI.formatAmount((isSent ? "-" : "") + bundle[0].value) +
              " (" +
              (persistence ? "Confirmed" : "Pending") +
              ")</span>";
          }
          latestHtml += "</div>";
          latestHtml +=
            "<button type='button' class='details ml-auto pr-4 text-sm text-dark-green' data-hash='" +
            String(bundle[0].hash).escapeHTML() +
            "' data-type='" +
            (isSent ? "spending" : "receiving") +
            "' data-persistence='" +
            persistence * 1 +
            "'>View Bundle</button></div></div>";
          if (i < 9) {
            if (!latestHtml) {
              $("#history-stack-latest .transfers").html(
                "<h4 class='text-lg text-center py-4'>No transactions</h4>"
              );
            } else {
              $("#history-stack-latest .transfers").html(latestHtml);
            }
          } else if (i == 9) {
            if (!latestHtml) {
              $("#history-stack-latest .transfers").html(
                "<h4 class='text-lg text-center py-4'>No transactions</h4>"
              );
            } else {
              $("#history-stack-latest .transfers").html(latestHtml);
            }
            return false;
          }
        });
      }
    }

    // $transfersBtn.html(
    //   "<span>" +
    //     connection.accountData.transfers.length +
    //     " </span>Transfer" +
    //     (connection.accountData.transfers.length != "1" ? "s" : "")
    // );
    // $addressesBtn.html(
    //   "<span>" +
    //     connection.accountData.addresses.length +
    //     " </span>Address" +
    //     (connection.accountData.addresses.length != "1" ? "es" : "")
    // );

    if (!transfersHtml) {
      $transfers.html(
        "<h4 class='text-lg text-center py-4'>No transactions</h4>"
      );
      // $transfers.find("ul").empty().hide();
      // $transfers.find("p").show();
    } else {
      $transfers.html(transfersHtml);
    }

    if (!sentHtml) {
      $("#history-stack-send .transfers").html(
        "<h4 class='text-lg text-center py-4'>No transactions</h4>"
      );
    } else {
      $("#history-stack-send .transfers").html(sentHtml);
    }

    if (!receivedHtml) {
      $("#history-stack-received .transfers").html(
        "<h4 class='text-lg text-center py-4'>No transactions</h4>"
      );
    } else {
      $("#history-stack-received .transfers").html(receivedHtml);
    }

    // if (!addressesHtml) {
    //   $addressesBtn.html("0 Addresses");
    //   $addresses.find("ul").empty().hide();
    //   $addresses.find("p").show();
    // } else {
    //   $addresses.find("ul").html(addressesHtml).show();
    //   $addresses.find("p").hide();
    // }

    // if ($("#history-stack").hasClass("open")) {
    //   UI.animateStacks(200);
    // }
  };

  UI.updateBalance = function () {
    $("#available-balance,#available-balance-always").html(
      UI.formatAmount(connection.accountData.balance)
    );
    $("#available-balance-always span")
      .html($("#available-balance-always span").data("long"))
      .hide()
      .fadeIn();
  };

  return UI;
})(UI || {}, jQuery);
