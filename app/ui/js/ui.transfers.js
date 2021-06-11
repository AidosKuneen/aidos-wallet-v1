var UI = (function (UI, $, undefined) {
  UI.handleTransfers = function () {
    console.log("handleTransfer");
    $("#transfer-btn").on("click", function (e) {
      console.log("UI.handleTransfers: Click");

      var $stack = $("#transfer-stack");

      if ($("#transfer-autofill").val() == "1") {
        UI.formError("transfer", "Are you sure?", {
          initial: "Yes, Send It Now",
        });
        $("#transfer-autofill").val("0");
        return;
      }

      $stack.addClass("loading");
      var transfer_additional_data = "";
	  
      try {
        var address = $("#transfer-address").val().toUpperCase();

        transfer_additional_data = $("#transfer-additional-data").val().toUpperCase();
	  
        if (!address) {
          throw "Address is required";
        } else if (address.length == 81) {
          throw "Missing address checksum";
        } else if (address.length != 90) {
          throw "Incorrect address length";
        } else if (!aidos.utils.isValidChecksum(address)) {
          throw "Incorrect address checksum";
        }

		if (!transfer_additional_data) {
			transfer_additional_data = "";
		}

        // var amount = aidos.utils.convertUnits(parseFloat($("#transfer-amount").val()), $("#transfer-units-value").html(), "i");

        var multi = 100000000;
        switch ($("#transfer-units-value").html()) {
          case "u ADK":
            multi = 0.000001 * 100000000;
            break;
          case "m ADK":
            multi = 0.001 * 100000000;
            break;
          case "ADK":
            multi = 1 * 100000000;
            break;
          case "K ADK":
            multi = 1000 * 100000000;
            break;
          case "M ADK":
            multi = 1000000 * 100000000;
            break;
        }

        var floatValue = parseFloat($("#transfer-amount").val());
        var amount = Math.round(floatValue * multi);

        if (!amount) {
          throw "Amount cannot be zero";
        }
        if (amount < 1) {
          throw "Amount must be more than 0.00000001 ADK";
        }
        var tag = $.trim($("#transfer-tag").val().toUpperCase());

        if (tag && /[^A-Z9]/.test(tag)) {
          throw "Tag is invalid";
        }
		
		if (transfer_additional_data && /[^A-Z9]/.test(transfer_additional_data)) {
          throw "Smart Data contains invalid characters";
        }
		
      } catch (error) {
        $stack.removeClass("loading");
        UI.formError("transfer", error);
        return;
      }
      $("#progress-bar").val(0);
      $("#transfer-btn").addClass("hidden");
      $("#progress-bar").removeClass("hidden");
      console.log("Server.transfer: " + address + " -> " + amount);

	  
      aidos.api.sendTransfer(
        connection.seed,
        connection.depth,
        connection.minWeightMagnitude,
        [{ address: address, value: amount, 
		              message: transfer_additional_data.slice(0, 2187),
					  tag: tag }],
        function (error, transfers) {
          if (error) {
            console.log("UI.handleTransfers: Error");
            console.log(error);
            $("#transfer-btn").removeClass("hidden");
            UI.formError("transfer", error, { initial: "Send" });
          } else {
            console.log("UI.handleTransfers: Success");
            UI.formSuccess("transfer", "Transfer Completed", {
              initial: "Send",
            });
            $("#transfer-btn").removeClass("hidden");
            $("#progress-bar").addClass("hidden");
            $("#progress-bar").val(0);
            $(".send_page").addClass("hidden");
            $(".confirmation_page").removeClass("hidden");
            UI.updateState(1000);
          }
          $stack.removeClass("loading");
        }
      );
    });

    $("#transfer-units-value").on("click", function (e) {
      var $overlay = $("#overlay");
      var $select = $(
        '<div class="dropdown" id="transfer-units-select">' +
          "<ul>" +
          '<li class="aidos-ua">u ADK</li>' +
          '<li class="aidos-ma">m ADK</li>' +
          '<li class="aidos-a">ADK</li>' +
          '<li class="aidos-Ka">K ADK</li>' +
          '<li class="aidos-Ma">M ADK</li>' +
          "</ul>" +
          "</div>"
      );

      $overlay.show();

      $("#transfer-units-select").remove();

      $("body").append($select);

      var offset = $(this).offset();

      $select
        .css({
          position: "absolute",
          top: offset.top + $(this).innerHeight() + 15 + "px",
          left: offset.left + "px",
          width: $(this).outerWidth() + "px",
        })
        .addClass("active");

      $select.on("click", "li", function (e) {
        $select.removeClass("active");
        $("#transfer-units-value").html($(this).html());
        $overlay.hide().off("click.transfer");
        $(window).off("resize.transfer");
      });

      $overlay.on("click.transfer", function (e) {
        $select.removeClass("active");
        $(this).hide().off("click.transfer");
        $(window).off("resize.transfer");
      });

      $(window).on("resize.transfer", function () {
        var $rel = $("#transfer-units-value");
        var offset = $rel.offset();
        $select.css({
          position: "absolute",
          top: offset.top + $rel.innerHeight() + 15 + "px",
          left: offset.left + "px",
          width: $rel.outerWidth() + "px",
        });
      });
    });

    $("#transfer-units-select").on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      var $ul = $(this).find("ul");
      $ul.addClass("active");
      $ul.find("li").click(function (e) {
        e.preventDefault();
        e.stopPropagation();

        $ul.find("li").unbind();
        $ul.find("li").removeClass("selected");
        $(this).addClass("selected");
        $ul.removeClass("active");
        $("body").unbind("click.dropdown");
      });

      $("body").on("click.dropdown", function (e) {
        $ul.removeClass("active");
        $("body").unbind("click.dropdown");
      });
    });
  };

  UI.onOpenTransferStack = function () {
    if ($("#transfer-address").val() == "") {
      $("#transfer-address").focus();
    }
  };

  return UI;
})(UI || {}, jQuery);
