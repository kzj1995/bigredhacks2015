$('document').ready(function () {

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

    //generic ajax to update team status
    var updateTeamStatus = function updateTeamStatus(teamid, newStatus, callback) {
        $.ajax({
            type: "PATCH",
            url: "/api/admin/team/" + teamid + "/setStatus",
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
    $('input[type=radio][name=status]').on('change', function () {
        var _this = this;
        var newStatus = $(_this).val();
        var radios = $(_this).parents(".decision-radio").find("input[type=radio]");
        var pubid = $(_this).parents(".applicant").data("pubid");

        $(radios).prop("disabled", true);

        updateStatus("user", pubid, newStatus, function (data) {
            $(radios).prop("disabled", false);
        })
    });

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
            $('.status').attr("class","status "+newStatus);
        });
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


    /*
     *Role settings
     */

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
        updateRole(email, role, function (data) {
            //todo dynamic update
            //$("#user-roles").append('<tr>name coming soon</tr><tr>'+email+'</tr><tr>'+role+'</tr>');
            location.reload();
        })
    });

    //add college to list of bus stops
    $('#addcollege').on('click', function () {
        var newCollege = $("#college").val();
        var currentBusStops = $("#busstops").val();
        if(currentBusStops != "") {
            $("#busstops").val(currentBusStops+","+newCollege);
        }
        else{
            $("#busstops").val(newCollege);
        }
        $("#college").val("");
    });

    //edit bus from list of buses
    $('.editbus').on('click', function () {
        var businfobox = $(this).parents(".businfobox");
        //Edit bus route name
        var currentBusName = businfobox.find(".busname").text().trim();
        businfobox.find(".busname").replaceWith("<input type='text' id='newbusname' name='newbusname' value='" +
        currentBusName + "' />");
        //Allow for removal of current colleges (bus stops)
        businfobox.find(".removecollege").show();
        //Allow for addition of new colleges (bus stops) to the bus route
        businfobox.find(".editbusstops").show();
        //Edit max capacity of bus
        var currentBusCapacity = businfobox.find(".maxcapacitynumber").text().trim();
        businfobox.find(".maxcapacity").replaceWith("<li class='maxcapacity'> <b>Max Capacity:</b> <input type='text'" +
        "id = 'maxcapacitynumber' name='maxcapacitynumber' value='" + currentBusCapacity + "' /></li>");
        //Replace "edit" and "remove" buttons with "update" and "cancel"
        $(this).parent().find(".btn.btn-primary.removebus").replaceWith("<a href='/admin/businfo'><input " +
        "type='button' value='cancel' name='cancel' class='btn btn-primary cancel'></a>");
        $(this).parent().find(".btn.btn-primary.editbus").replaceWith("<input type='button' value='update' " +
        "name='update' class='btn btn-primary update'>");
    });

    //remove bus from list of buses
    $('.removebus').on('click', function () {
        var _this = this;
        $.ajax({
            type: "POST",
            url: "/admin/removeBus",
            data: {
                busid: $(_this).parents(".businfobox").data("busid")
            },
            success: function (data) {
                $(_this).parents(".businfobox").remove();
                $(".header-wrapper-leaf").after("<h3 id='nobuses'> No Buses Currently </h3>");
            },
            error: function (e) {
                console.log("Couldn't remove the bus!");
            }
        });
    });

    //remove college from list of colleges
    $("li").on('click', '.removecollege', function () {
        $(this).parent().remove();
    });

    //add new college to list of colleges
    $('#addnewcollege').on('click', function () {
        var businfobox = $(this).parents(".businfobox");
        var newcollegeid = businfobox.find("#collegeid").val()
        var newcollege = businfobox.find("#newcollege").val()
        businfobox.find(".busstops").append("<li data-collegeid='"+ newcollegeid + "'>" +
        "<span class='collegename'>" + newcollege + "</span> &nbsp;&nbsp;&nbsp; <input type='button'" +
        "class='removecollege' name='busname' value='Remove' /></li>");
        businfobox.find(".removecollege").show();
        businfobox.find("#newcollege").val("");
    });

    //update bus from list of buses
    $(".modifybus").on('click', '.btn.btn-primary.update', function () {
        var businfobox = $(this).parents(".businfobox")
        var collegeidlist = "";
        var busstops = "";
        for(var i = 0; i < businfobox.find(".busstops li").length; i++){
            collegeidlist = collegeidlist + businfobox.find(".busstops li").eq(i).data("collegeid") + ",";
            busstops = busstops + businfobox.find(".collegename").eq(i).text() + ",";
        }
        $.ajax({
            type: "POST",
            url: "/admin/updateBus",
            data: {
                busid: businfobox.data("busid"),
                busname: businfobox.find("#newbusname").val(),
                collegeidlist: collegeidlist.substring(0,collegeidlist.length - 1),
                busstops: busstops.substring(0, busstops.length - 1),
                buscapacity: businfobox.find("#maxcapacitynumber").val()
            },
            success: function (data) {
                businfobox.find("#newbusname").replaceWith("<div class='busname'>"+businfobox.find("#newbusname").val()+
                "</div>");
                businfobox.find(".removecollege").hide();
                businfobox.find(".editbusstops").hide();
                businfobox.find(".maxcapacity").replaceWith("<li class='maxcapacity'> <b>Max Capacity:</b>" +
                "<span class='maxcapacitynumber'>" + businfobox.find("#maxcapacitynumber").val() + "</span> </li>");
                businfobox.find(".btn.btn-primary.cancel").replaceWith("<input type='button' value='remove'" +
                "name='removebus' class='btn btn-primary removebus'>");
                businfobox.find(".btn.btn-primary.update").replaceWith("<input type='button' value='edit'" +
                "name='editbus' class='btn btn-primary editbus'>");

            },
            error: function (e) {
                console.log("Couldn't remove the bus!");
            }
        });
    });

});




