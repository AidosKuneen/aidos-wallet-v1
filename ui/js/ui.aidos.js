$(document).ready(function () {
    document.addEventListener("click", cc_click, false);
    function cc_click(e) {
        var t = e.target;
        var parent = t.parentNode;

    }

    $(document).mouseup(function (e) {
        var container = $("#menu");

        if (!container.is(e.target) // if the target of the click isn't the container...
            && container.has(e.target).length === 0) // ... nor a descendant of the container
        {
            if (!stato_menu) {
                stato_menu = true;
                menu_anima(-301);
            }
        }
    });

    $(".data-buttons .uk-button ").click(function () {
        $(".data-buttons .uk-button").attr("CLASS", "uk-button uk-width-medium-1-6");
        $(this).attr("CLASS", "uk-button uk-width-medium-1-6 active");
    });
    var stato_menu = true;
    $("#half-circle").click(function () {
        var left_div = 0;
        if (stato_menu) {
            stato_menu = false;
            left_div = 0;
        }
        else {
            stato_menu = true;
            left_div = -301;
        }
        menu_anima(left_div);

    });
    function menu_anima(mylest) {
        $("#menu").animate({
            left: mylest,
        }, 300, function () {
        });
    }
    $(document).ready(function () {
        $('body').fadeIn(1000);
    });
});