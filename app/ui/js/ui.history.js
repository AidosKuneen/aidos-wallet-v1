var UI = (function (UI, $, undefined) {
  let bundleArr = [];
  let detailsHashes = [];
  let transactionList;

  const transactionListOptions = {
    valueNames: ["hash", "amount", "status", "type", "date"],
    item: function (values) {
      return `<div class="single-transaction py-5 flex flex-wrap items-center">
      <div class="flex flex-wrap items-center flex-shrink-0 w-full">
        <span class="font-montserrat text-xl ${
          values.type == "sent" ? "text-red-600" : "text-green-700"
        }">
          ${
            values.type == "sent"
              ? '<img src="./images/arrow-left.svg" alt="" onload="SVGInject(this)" />'
              : '<img src="./images/arrow-right.svg" alt="" onload="SVGInject(this)" />'
          }
        </span>
        <div class="ml-4 flex flex-col justify-center">
          <p class="hash clipboard cursor-pointer" data-clipboard-text="${
            values.hash
          }"> ${values.hash.substr(0, 40)}...</p>
                      <span class="text-xs">
                      ${values.type == "sent" ? "-" : ""}
                      ${values.amount / 100000000 + " ADK"}
            (${values.status ? "Confirmed" : "Pending"})
          </span>
        </div>
        <button
          type="button"
          class="details ml-auto pr-4 text-sm text-dark-green"
          data-hash="${String(values.hash).escapeHTML()}"
          data-type="${values.type == "sent" ? "spending" : "receiving"}"
          data-persistence="${values.status * 1}"
        >
          View Bundle
        </button>
      </div>
    </div>`;
    },
    pagination: [
      {
        outerWindow: 5,
      },
    ],
    page: 10,
  };

  document.addEventListener("DOMContentLoaded", () => {
    transactionList = new List("transaction-stack", transactionListOptions);
  });

  UI.handleHistory = function () {
    $("#transaction-stack, #history-stack-latest").on(
      "click",
      ".details",
      function (e) {
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
      }
    );

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

    const allTransactionBtn = document.getElementById("alltransaction");
    const sendTransactionBtn = document.getElementById("sendtransaction");
    const receivedTransactionBtn = document.getElementById(
      "receivedtransaction"
    );

    allTransactionBtn.addEventListener("click", () => {
      transactionList.filter();
    });

    sendTransactionBtn.addEventListener("click", () => {
      transactionList.filter(function (item) {
        if (item.values().type == "sent") {
          return true;
        } else {
          return false;
        }
      });
    });

    receivedTransactionBtn.addEventListener("click", () => {
      transactionList.filter(function (item) {
        if (item.values().type == "received") {
          return true;
        } else {
          return false;
        }
      });
    });
  };

  UI.updateHistory = function () {
    if (
      JSON.stringify(connection.accountData) ==
      JSON.stringify(connection.previousAccountData)
    ) {
      return;
    }

    if (connection.accountData) {
      var addresses = aidos.utils
        .addChecksum(connection.accountData.addresses)
        .reverse();

      var categorizedTransfers = aidos.utils.categorizeTransfers(
        connection.accountData.transfers,
        connection.accountData.addresses
      );
      var addresses = connection.accountData.addresses;

      $.each(connection.accountData.transfers.reverse(), function (i, bundle) {
        $.each(categorizedTransfers.sent, function (i, sentBundle) {
          if (sentBundle[0].hash == bundle[0].hash) {
            if (!detailsHashes.includes(sentBundle[0].hash)) {
              transactionList.add({
                hash: sentBundle[0].hash,
                amount: sentBundle[0].value,
                status: sentBundle[0].persistence,
                date: sentBundle[0].timestamp,
                type: "sent",
              });
            }
          }
        });

        $.each(categorizedTransfers.received, function (i, receivedBundle) {
          if (receivedBundle[0].hash == bundle[0].hash) {
            if (!detailsHashes.includes(receivedBundle[0].hash)) {
              transactionList.add({
                hash: receivedBundle[0].hash,
                amount: receivedBundle[0].value,
                status: receivedBundle[0].persistence,
                date: receivedBundle[0].timestamp,
                type: "received",
              });
            }
            bundleArr.push(receivedBundle[0]);
          }
        });
      });

      const transactionItems = transactionList.items;
      transactionItems.forEach((item) => {
        if (!detailsHashes.includes(item._values.hash)) {
          detailsHashes.push(item._values.hash);
        }
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
          if (i == 9) {
            return false;
          }
          if (!latestHtml) {
            $("#history-stack-latest .transfers").html(
              "<h4 class='text-lg text-center py-4'>No transactions</h4>"
            );
          } else {
            $("#history-stack-latest .transfers").html(latestHtml);
          }
        });
      }
    }
  };

  UI.refreshTransaction = function () {
    transactionList.refresh();
    transactionList.sort();
  };

  UI.checkAddresses = function () {
    const registeredAddress = [];

    // create a new array that will return the address and value
    const checkAddress = bundleArr.map((x) => {
      const container = {};
      container.address = x.address;
      container.value = x.value;
      return container;
    });

    // check for duplicates and total their value
    const getTotalValue = checkAddress.reduce((acc, cur) => {
      const address = cur.address;
      const found = acc.find((e) => {
        return e.address == address;
      });

      if (found) {
        found.value += cur.value;
      } else {
        acc.push(cur);
      }

      return acc;
    }, []);

    // sort address
    getTotalValue.filter((item) => {
      if (item.value == 0) {
        registeredAddress.push({
          address: aidos.utils.addChecksum(item.address),
          status: "unused",
        });
      } else {
        registeredAddress.push({
          address: aidos.utils.addChecksum(item.address),
          status: "used",
        });
      }
    });

    const listOptions = {
      valueNames: ["address", "status"],
      item: function (values) {
        return `<div class="flex flex-wrap items-center flex-shrink-0 w-full py-2">
          <p class="clipboard cursor-pointer ${
            values.status == "used" ? "text-tetsu-black text-opacity-50" : ""
          } address" data-clipboard-text=${values.address}>${values.address}</p>
          <span class="ml-auto ${
            values.status == "unused"
              ? "text-dark-green bg-dark-green"
              : "bg-tetsu-black"
          }  bg-opacity-10 py-1 px-2 text-sm font-medium rounded-md capitalize status">${
          values.status
        }</span>
        </div>`;
      },
      pagination: true,
      page: 10,
    };

    const addressList = new List(
      "registered-address",
      listOptions,
      registeredAddress
    );
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
