var UI = (function (UI, $, undefined) {
  var didClickGenerateAddress = false;

  UI.handleAddressGeneration = function () {
    $(".href_receive").on("click", function (e) {
      if ($(this).hasClass("open") || $(this).hasClass("opening")) {
        return;
      }

      console.log("UI.handleAddressGeneration: Open stack.");

      var $stack = $("#generate-address-stack");

      // Don't proceed if the user has already clicked the button.
      if (didClickGenerateAddress) {
        console.log("UI.handleAddressGeneration: Already clicked, return.");
        return;
      }

      var $btn = $stack.find(".btn").first();

      //$btn.loadingUpdate("Generate New Address", {"icon": false, "initial": "Generate New Address", "loading": "Generating Address..."});

      // Always get the newest address on click of stack, in case the user was out of sync, update
      aidos.api.getNewAddress(connection.seed, { checksum: true }, function (
        error,
        newAddress
      ) {
        if (error) {
          console.log("UI.handleAddressGeneration: GetNewAddress Error:");
          console.log(error);
          $stack.find(".padded").css("visibility", "hidden");
          $btn.loadingUpdate("Generate New Address", {
            initial: "Generate New Address",
            loading: "Attaching to Mesh...",
          });
          // UI.animateStacks(0);
          return;
        }

        console.log(newAddress);

        if (didClickGenerateAddress) {
          // User already clicked the generate button, don't update. Abort..
          console.log("UI.handleAddressGeneration: Abort updating address.");
          return;
        }

        $btn.loadingUpdate("Register address", {
          icon: false,
          initial: "Register address",
          loading: "Registering...",
        });

        // Different from the previous result, update...
        if (newAddress != $btn.data("address")) {
          console.log(
            "UI.handleAddressGeneration: Address is different, update."
          );

          updateGeneratedAddress(newAddress, true);

          $stack
            .find(".padded")
            .css("opacity", 0)
            .css("visibility", "visible")
            .fadeTo("slow", 1);

          // UI.animateStacks(0);
        } else {
          console.log("UI.handleAddressGeneration: Address has not changed.");
        }
      });
    });

    $("#generate-address-btn").on("click", function (e) {
      // Make sure other click event above is not triggered...
      e.preventDefault();
      e.stopPropagation();

      console.log("UI.handleAddressGeneration: Click");

      didClickGenerateAddress = true;

      try {
        var $stack = $("#generate-address-stack");
        var $btn = $stack.find(".btn").first();

        $stack.addClass("loading");

        if (!$btn.data("address")) {
          $stack.find(".padded").css("visibility", "hidden");
          var gotAddress = false;
        } else {
          var gotAddress = true;
        }

        aidos.api.getNewAddress(connection.seed, { checksum: true }, function (
          error,
          newAddress
        ) {
          if (error) {
            console.log("UI.handleAddressGeneration: Error:");
            console.log(error);
            UI.formError("generate-address", error);
            $stack.removeClass("loading");
            return;
          }

          console.log("UI.handleAddressGeneration: Got address: " + newAddress);

          if (newAddress != $btn.data("address")) {
            updateGeneratedAddress(newAddress);
            $stack
              .find(".padded")
              .css("opacity", 0)
              .css("visibility", "visible")
              .fadeTo("slow", 1);
          } else {
            $("#generate-address-result, #generate-address-qr-code").off(
              "click.notyetgenerated"
            );
            $stack.find(".padded").css("visibility", "visible");
          }

          console.log(
            "send transfer to " + newAddress + ": " + newAddress.length
          );

          //$btn.loadingUpdate("Attaching to Mesh...", {"timeout": 500});

          newAddress = aidos.utils.noChecksum(newAddress);

          aidos.api.sendTransfer(
            connection.seed,
            connection.depth,
            connection.minWeightMagnitude,
            [{ address: newAddress, value: 0, message: "", tag: "" }],
            function (error, transfers) {
              if (error) {
                UI.formError("generate-address", error);
              } else {
                $btn.data("address", "");
                console.log("UI.handleAddressGeneration: Attached to Mesh");
                UI.formSuccess("generate-address", "Address Registered", {
                  initial: "Generate New Address",
                  loading: "Registering...",
                });
                UI.updateState(1000);
              }
              $stack.removeClass("loading");
            }
          );
        });
      } catch (error) {
        console.log("UI.handleAddressGeneration: Error:");
        console.log(error);
        UI.formError("generate-address", error);
      }
    });
  };

  function updateGeneratedAddress(address, notYetGenerated) {
    var $stack = $("#generate-address-stack");
    var $btn = $stack.find(".btn").first();

    $btn.data("address", address);

    $("#generate-address-result").val(String(address).escapeHTML());
    $("#generate-address-qr-code")
      .empty()
      .qrcode({
        text: JSON.stringify({ address: address }),
        fill: "#000",
        background: "#fff",
        size: 100,
      });

    if (notYetGenerated) {
      $("#generate-address-result, #generate-address-qr-code").on(
        "click.notyetgenerated",
        function (e) {
          UI.notify("error", "Be sure to Register before using the address.");
        }
      );
    } else {
      $("#generate-address-result, #generate-address-qr-code").off(
        "click.notyetgenerated"
      );
    }

    $stack.find(".clipboard").attr("data-clipboard-text", address);
  }

  return UI;
})(UI || {}, jQuery);
