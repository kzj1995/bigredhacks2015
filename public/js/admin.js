$('document').ready(function () {


    $(".decisionbuttons button").click(function () {
        var _this = this;
        var buttongroup = $(this).parent();
        var buttons = $(this).parent().find(".btn");
        var newStatus = $(_this).data("status");
        var pubid = $(_this).parents(".applicant").data("pubid");

        $(buttons).prop("disabled", true).removeClass("active");

        $.ajax({
            type: "PATCH",
            url: "/api/admin/user/" + pubid + "/setStatus",
            data: {
                status: newStatus
            },
            success: function (data) {
                $(_this).parent().siblings(".status-text").text(newStatus);
                $(buttons).prop("disabled", false);
                $(_this).addClass("active");
            },
            error: function (e) {
                //todo more descriptive errors
                console.log("Update failed!");
            }
        });

    });

    var searchCategories = {
        pubid: {
            name: "pubid",
            placeholder: "Public User ID"
        },
        email: {
            name: "email",
            placeholder: "Email"
        },
        name: {
            name: "name",
            placeholder: "Name"
        }
    };
    $("#categoryselection").change(function () {
        var catString = $(this).val();
        var category = searchCategories[catString];

        if (typeof category === "undefined") {
            console.log(catString, "Is not a valid category!");
        }
        else {
            var inputElem = '<input class="form-control" type="text" name="' + category.name + '" placeholder="' + category.placeholder + '" />';
            $(".category-input").html(inputElem);
        }
    });

});




