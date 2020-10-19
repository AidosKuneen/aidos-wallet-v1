var UI = (function (UI, $, undefined) {
  UI.handleHelpMenu = function () {
    $("#app .menu").on("click", function (e) {
      UI.openHelpMenu();
    });
  };
  UI.openTermMenu = function () {
    $("#terms").modal({ showClose: false });
  };

  UI.openHelpMenu = function () {
    $("#help").modal({
      showClose: false,
    });
  };

  return UI;
})(UI || {}, jQuery);
