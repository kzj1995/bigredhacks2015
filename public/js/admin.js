$('document').ready(function () {

    var npCheckbox = $("[name='np-toggle-checkbox']");
    npCheckbox.bootstrapSwitch();

    /**
     * generic ajax to update status
     * @param type team,user
     * @param id
     * @param newStatus
     * @param callback
     */
    var updateStatus = function updateStatus(type, id, newStatus, callback) {
        if (type != "user" && type != "team") {
            console.error("Unrecognized update type in updateStatus!");
        }
        $.ajax({
            type: "PATCH",
            url: "/api/admin/" + type + "/" + id + "/setStatus",
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
    var updateRole = function updateRole(email, newRole, callback) {
        $.ajax({
            type: "PATCH",
            url: "/api/admin/user/" + email + "/setRole",
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


    /****************************
     * No participation switch***
     ***************************/

    /**
     * Check whether use is in non-participation mode
     * @type {*|jQuery}
     */
    var getNp = function () {
        $.ajax({
            type: "GET",
            url: "/api/admin/np",
            success: function (data) {
                if (data == "true" || data == "1") {
                    toggleNp(true);
                    //third parameter skips on change event
                    npCheckbox.bootstrapSwitch("state",true, true); //set starting state
                }
                else {
                    npCheckbox.bootstrapSwitch("state",false, true);
                    return toggleNp(false);

                }
            },
            error: function (e) {
                console.log("Unable to determine participation mode.");
                npCheckbox.bootstrapSwitch("state",false, true);
                return toggleNp(false);
            }
        })
    };

    var setNp = function (state) {
        $.ajax({
            type: "POST",
            url: "/api/admin/np/set",
            data: {
                state: state
            },
            success: function (data) {
                toggleNp(state);
                if (state == false) {
                    alert("WARNING: No participation mode is turned off for the duration of this session. All changes made to applicants during this time are permanent.");
                }
            },
            error: function (e) {
                console.log("Unable to set participation mode");
            }
        })
    };

    //disable non-participation enabled items
    var toggleNp = function(state) {
        $(".np-enabled").children().prop("disabled", state);
        $(".np-enabled input[type=radio]").prop("disabled", state);
    };

    npCheckbox.on('switchChange.bootstrapSwitch', function(event, state) {
        setNp(state);
    });


    /******************
     * Initialization**
     ******************/
    getNp();


    /******************
     * Detail Views****
     *****************/

        //handle decision radio buttons for individual(detail) view
    $('input[type=radio][name=individualstatus]').on('change', function () {
        var _this = this;
        var newStatus = $(_this).val();
        var pubid = $("#pubid").text();
        updateStatus("user", pubid, newStatus, function (data) {
        });
    });

    //handle decision radio buttons for team view
    $('input[type=radio][name=teamstatus]').on('change', function () {
        var _this = this;
        var newStatus = $(_this).val();
        var teamid = $("#teamid").text();
        updateStatus("team", teamid, newStatus, function (data) {
            $('.status').text(newStatus);
            $('.status').attr("class", "status " + newStatus);
        });
    });


    /******************
     * SEARCH PAGE ****
     ******************/

        //handle decision buttons
    $(".decisionbuttons button").click(function () {
        var _this = this;
        var buttongroup = $(this).parent();
        var buttons = $(this).parent().find(".btn");
        var newStatus = $(_this).data("status");
        var pubid = $(_this).parents(".applicant").data("pubid");

        $(buttons).prop("disabled", true).removeClass("active");

        updateStatus("user", pubid, newStatus, function (data) {
            $(_this).parent().siblings(".status-text").text(newStatus);
            $(buttons).prop("disabled", false);
            $(_this).addClass("active");
        });


    });

    //handle decision radio buttons for search view
    $('.decision-radio input[type=radio][name=status]').on('change', function () {
        var _this = this;
        var newStatus = $(_this).val();
        var radios = $(_this).parents(".decision-radio").find("input[type=radio]");
        var pubid = $(_this).parents(".applicant").data("pubid");

        $(radios).prop("disabled", true);

        updateStatus("user", pubid, newStatus, function (data) {
            $(radios).prop("disabled", false);
        })
    });

    //switch render location
    $('#render').on('change', function () {
        var redirect = _updateUrlParam(window.location.href, "render", $(this).val());
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


    /*********************
     *** Role settings****
     *********************/

    //edit button
    $(".btn-edit").on('click', function () {
        $(this).siblings(".btn-save").eq(0).prop("disabled", function (idx, oldProp) {
            return !oldProp;
        });
        $(this).closest("tr").find(".roleDropdown").prop("disabled", function (idx, oldProp) {
            return !oldProp;
        });
    });

    //save button
    $(".btn-save").on('click', function () {
        var _this = this;
        var email = $(this).parents("tr").find(".email").text();
        var role = $(this).closest("tr").find(".roleDropdown").val();
        updateRole(email, role, function (data) {
            $(_this).prop("disabled", true);
            $(_this).closest("tr").find(".roleDropdown").prop("disabled", true);
        })
    });

    //remove button
    $(".btn-remove").on('click', function () {
        var _this = this;
        var email = $(this).parents("tr").find(".email").text();
        var c = confirm("Are you sure you want to remove " + email + "?");
        if (c) {
            updateRole(email, "user", function (data) {
                $(_this).parents("tr").remove();
            });
        }


    });

    //handle decision radio buttons for settings view
    $('#btn-add-user').on('click', function () {
        var email = $(this).closest("form").find("#new-email").val();
        var role = $(this).closest("form").find("#new-role").val();
        var c = confirm("Are you sure you want to add " + email + "?");
        if (c) {
            updateRole(email, role, function (data) {
                //todo dynamic update
                //$("#user-roles").append('<tr>name coming soon</tr><tr>'+email+'</tr><tr>'+role+'</tr>');
                location.reload();
            });
        }
    });

    var _updateUrlParam = function _updateUrlParam(url, param, paramVal) {
        var newAdditionalURL = "";
        var tempArray = url.split("?");
        var baseURL = tempArray[0];
        var additionalURL = tempArray[1];
        var temp = "";
        if (additionalURL) {
            tempArray = additionalURL.split("&");
            for (var i = 0; i < tempArray.length; i++) {
                if (tempArray[i].split('=')[0] != param) {
                    newAdditionalURL += temp + tempArray[i];
                    temp = "&";
                }
            }
        }
        var rows_txt = temp + "" + param + "=" + paramVal;
        return baseURL + "?" + newAdditionalURL + rows_txt;
    };
});




