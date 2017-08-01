var UI = (function(UI, $, undefined) {
  UI.handleHistory = function() {
    var modal;
    $("#history-stack").on("click", ".show-bundle", function(e) {
      e.preventDefault();

      var hash = $(this).data("hash");
      var $modal = $("#bundle-details");

      var persistence = $(this).data("persistence");
      var options = {hashTracking: false, closeOnOutsideClick: false, closeOnEscape: false};

      console.log("UI.handleHistory: Show bundle modal for hash " + hash);
      aidos.api.getBundle(hash, function(error, transactions) {
        if (error) { 
          console.log(error);
          return;
        }
        var send_html = "";
        var recv_html = "";

        for (var i=0; i<transactions.length; i++) {
          var adr_short=aidos.utils.addChecksum(transactions[i].address).substr(0,20)+"...";
          var adr=aidos.utils.addChecksum(transactions[i].address);
          var html= "<a href='#' class='clipboard' title='" + adr + "' data-clipboard-text='" + adr + "'>" + adr_short + "</a>"
                   +"<span>"+UI.formatAmount(transactions[i].value) +"</span>";

          if (transactions[i].value>=0){
            recv_html += `<div class="uk-panel transaction-panel">`;
            recv_html += html;
            recv_html += "</div>";
          }else{
            send_html += `<div class="uk-panel transaction-panel-left">`;
            send_html += html
            send_html += "</div>";
          }
        }
      
        $modal.find("#recv_right").html(recv_html);
        $modal.find("#send_left").html(send_html);
        $modal.find("#bd-hash").html(UI.formatForClipboard(hash));

        if (persistence){
          $modal.find(".confirmed").show();
          $modal.find(".unconfirmed").hide();
          $modal.find(".btn").hide();
        }else{
          $modal.find(".confirmed").hide();
          $modal.find(".unconfirmed").show();
          $modal.find(".btn").show();
        }
        $modal.find(".btn").data("hash", hash);

        $modal.find(".btn").each(function() {
          $(this).loadingReset($(this).data("initial"));
        });
       
        var modal = UIkit.modal("#bundle-details");
        modal.show();
      });
    });

    $("#replay-btn, #rebroadcast-btn").on("click", function(e) {
      e.preventDefault();

      var hash = $(this).data("hash");

      if (!hash) {
        console.log("UI.replay/rebroadcast: No hash");
        return;
      }

      var isRebroadcast = $(this).attr("id") == "rebroadcast-btn";

      if (isRebroadcast) {
        $("#replay-btn").attr("disabled", "disabled");
      } else {
        $("#rebroadcast-btn").attr("disabled", "disabled");
      }

      $(".remodal-close").on("click", function(e) {
        UI.notify("error", "Cannot close whilst " + (isRebroadcast ? "rebroadcasting" : "replaying") + ".");
        e.preventDefault();
        e.stopPropagation();
      });

      console.log("UI.handleHistory: Do " + (isRebroadcast ? "rebroadcast" : "replay") + " for hash " + hash);

      UI.isLocked = true;

      if (isRebroadcast) {
        aidos.api.broadcastBundle(hash, function(error, bundle) {
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
          $("#replay-btn").removeAttr("disabled");
        });
      } else {
        aidos.api.replayBundle(hash, connection.depth, connection.minWeightMagnitude, function(error, bundle) {
          console.log(bundle);
          if (error) {
            console.log("UI.replay: Error");
            console.log(error);
            $("#replay-btn").loadingError(error);
          } else {
            console.log("UI.replay: Success");
            if (!UI.isFocused()) {
              UI.notifyDesktop("Transaction replayed successfully");
            }
            $("#replay-btn").loadingSuccess("Replay Completed");
            $("#bundle-modal .persistence").hide();

            UI.updateState(1000);
          }

          UI.isLocked = false;
          $(".remodal-close").off("click");
          $("#rebroadcast-btn").removeAttr("disabled");
        });
      }
    });

    $("#history-stack .submenu li").on("click", function(e) {
      e.preventDefault();

      $("#history-stack .active").removeClass("active");
      $(this).addClass("active");

      var type = $(this).data("type");
      if (type == "transfers") {
        $("#history-stack .addresses").hide();
        $("#history-stack .transfers").show();
      } else {
        $("#history-stack .transfers").hide();
        $("#history-stack .addresses").show();
      }
      UI.animateStacks(200);
    });
  }

  UI.updateHistory = function() {
    //no changes..
    if (JSON.stringify(connection.accountData) == JSON.stringify(connection.previousAccountData)) {
      return;
    }

    var $transfersBtn = $("#history-stack li[data-type=transfers]");
    var $addressesBtn = $("#history-stack li[data-type=addresses]");

    var $transfers = $("#history-stack .transfers");
    var $addresses = $("#history-stack .addresses");

    var transfersHtml = addressesHtml = "";

    if (connection.accountData) {
      var addresses = aidos.utils.addChecksum(connection.accountData.addresses).reverse();

      $.each(addresses, function(i, address) {
        addressesHtml += "<li>";
        addressesHtml += "<div class='details'>";
        addressesHtml += "<div class='address'>" + UI.formatForClipboard(address) + "</div>";
        addressesHtml += "</div>";
        addressesHtml += "<div class='value'></div>";
        addressesHtml += "</div>";
        addressesHtml += "</li>";
      });

      var categorizedTransfers = aidos.utils.categorizeTransfers(connection.accountData.transfers, connection.accountData.addresses);
      var addresses = connection.accountData.addresses;

      $.each(connection.accountData.transfers.reverse(), function(i, bundle) {
        var persistence = bundle[0].persistence ? bundle[0].persistence : false;
        var isSent = false;
        var index = [];
        $.each(categorizedTransfers.sent, function(i, sentBundle) {
          if (sentBundle[0].hash == bundle[0].hash) {
            isSent = true;
            return false;
          }
        });
        
        // if !isSent check for address and amount to display, because it's possible that a bundle has multiple tx that go to different accounts
        if (!isSent && bundle.length > 3){
        	addresses.forEach(function(address) {
            	bundle.forEach(function(tx, i) {
            	    if (address == tx.address){
            	    	//found address for seed, save bundle index
            	    	index.push(i);
            	    }
            	});
        	});
        }
        transfersHtml += "<div class='single-transaction show-bundle' data-hash='" + String(bundle[0].hash).escapeHTML() + "' data-type='" + (isSent ? "spending" : "receiving") + "' data-persistence='" + persistence*1 + "'>";
        transfersHtml +='<span class="'+ (isSent ? "send" : "receive") +'"></span><p>';
        if (index.length > 0){
	        index.forEach(function(i) {
	        	transfersHtml += "<p>" + UI.formatAmount((isSent ? "-":"") + bundle[i].value) + " ("+(persistence ? "Confirmed" : "Pending") +")</p></br>";
	        	transfersHtml += '<p class="address">'+(bundle[i].address ? aidos.utils.addChecksum(bundle[i].address) : "-")+"</p><br />";
	        });
        } else {
        	transfersHtml += "<p>" + UI.formatAmount((isSent ? "-":"") + bundle[0].value) + " ("+(persistence ? "Confirmed" : "Pending") +")</p></br>";
        	transfersHtml += '<p class="address">'+(bundle[0].address ? aidos.utils.addChecksum(bundle[0].address) : "-")+"</p><br />";
        }
        transfersHtml += '<p class="date">' + (bundle[0].timestamp != "0" ? UI.formatDate(bundle[0].timestamp, true) : "Genesis")+"</p>";
        transfersHtml += '<a href="#" onclick="return false" class="details">View Bundle</a>';
        transfersHtml += '</div>';
      });
    }

    $transfersBtn.html("<span>" + connection.accountData.transfers.length + " </span>Transfer" + (connection.accountData.transfers.length != "1" ? "s" : ""));
    $addressesBtn.html("<span>" + connection.accountData.addresses.length + " </span>Address" + (connection.accountData.addresses.length != "1" ? "es" : ""));

    if (!transfersHtml) {
      $transfers.html("<h4>No transactions</h4>");
      $transfers.find("ul").empty().hide();
      $transfers.find("p").show();
    } else {
      $transfers.html(transfersHtml);
    }

    if (!addressesHtml) {
      $addressesBtn.html("0 Addresses");
      $addresses.find("ul").empty().hide();
      $addresses.find("p").show();
    } else {
      $addresses.find("ul").html(addressesHtml).show();
      $addresses.find("p").hide();
    }

    if ($("#history-stack").hasClass("open")) {
      UI.animateStacks(200);
    }
  }

  UI.updateBalance = function() {
    $("#available-balance,#available-balance-always").html(UI.formatAmount(connection.accountData.balance));
    $("#available-balance-always span").html($("#available-balance-always span").data("long")).hide().fadeIn();

  }

  return UI;
}(UI || {}, jQuery));