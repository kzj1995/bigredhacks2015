$('document').ready(function () {


    //generic ajax to update status
    var updateStatus = function updateStatus(pubid, newStatus, callback) {
        $.ajax({
            type: "PATCH",
            url: "/api/admin/user/" + pubid + "/setStatus",
            data: {
                status: newStatus
            },
            success: function (data) {
                callback(data);
            },
            error: function (e) {
                //todo more descriptive errors
                console.log("Update failed!");
            }
        });
    };

    //generic ajax to update role
    var updateRole = function updateRole(pubid, newRole, callback) {
        $.ajax({
            type: "PATCH",
            url: "/api/admin/user/" + pubid + "/setRole",
            data: {
                role: newRole
            },
            success: function (data) {
                callback(data);
            },
            error: function (e) {
                //todo more descriptive errors
                console.log("Update failed!");
            }
        });
    };

    var updateUrlParam = function updateUrlParam(url, param, paramVal){
        var newAdditionalURL = "";
        var tempArray = url.split("?");
        var baseURL = tempArray[0];
        var additionalURL = tempArray[1];
        var temp = "";
        if (additionalURL) {
            tempArray = additionalURL.split("&");
            for (var i=0; i<tempArray.length; i++){
                if(tempArray[i].split('=')[0] != param){
                    newAdditionalURL += temp + tempArray[i];
                    temp = "&";
                }
            }
        }
        var rows_txt = temp + "" + param + "=" + paramVal;
        return baseURL + "?" + newAdditionalURL + rows_txt;
    };

    //handle decision buttons
    $(".decisionbuttons button").click(function () {
        var _this = this;
        var buttongroup = $(this).parent();
        var buttons = $(this).parent().find(".btn");
        var newStatus = $(_this).data("status");
        var pubid = $(_this).parents(".applicant").data("pubid");

        $(buttons).prop("disabled", true).removeClass("active");

        updateStatus(pubid, newStatus, function (data) {
            $(_this).parent().siblings(".status-text").text(newStatus);
            $(buttons).prop("disabled", false);
            $(_this).addClass("active");
        });


    });

    //handle decision radio buttons for search view
    $('input[type=radio][name=status]').on('change', function () {
        var _this = this;
        var newStatus = $(_this).val();
        var radios = $(_this).parents(".decision-radio").find("input[type=radio]");
        var pubid = $(_this).parents(".applicant").data("pubid");

        $(radios).prop("disabled", true);
        updateStatus(pubid, newStatus, function (data) {
            $(radios).prop("disabled", false);
        })
    });

    //handle decision radio buttons for individual(detail) view
    $('input[type=radio][name=individualstatus]').on('change', function () {
        var _this = this;
        var newStatus = $(_this).val();
        var pubid = $("#pubid").text().slice(1);
        updateStatus(pubid, newStatus, function (data) {});
    });

    //handle decision radio buttons for settings view
    $('input[type=radio][name=role]').on('change', function () {
        var _this = this;
        var newRole = $(_this).val();
        var radios = $(_this).parents(".role-radio").find("input[type=radio]");
        var pubid = $(_this).parents(".applicant").data("pubid");
        updateRole(pubid, newRole, function (data) {});
    });


    //switch render location
    $('#render').on('change', function() {
        var redirect = updateUrlParam(window.location.href, "render", $(this).val());
        window.location.assign(redirect);
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




