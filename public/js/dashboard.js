$(document).ready(function () {

    //Update resume
    $("#resume-update").on('click', function (e) {
        e.preventDefault();
        $("#resume-form").toggle();
        $('body').animate({
            scrollTop: $('body').get(0).scrollHeight
        }, 500);
    });

    //File picker
    $(function () {
        $("input[type='file']").filepicker({style: 'default'});
    });

    setInterval(function () {
        checkUserId();
        checkResume();
    }, 1000);

    //working with cornell students checkbox event
    $("#cornellteamcheck").on("change", function () {
        var _this = this;
        $(".checkbox").addClass("disabled");
        $(_this).prop("disabled", true);
        var checked = this.checked;
        $.ajax({
            url: "/user/team/cornell",
            type: "POST",
            data: {checked: checked},
            success: function (d) {
                $(".checkbox").removeClass("disabled");
                $(_this).prop("disabled", false);
            }
        })
    });

    /**
     * generic ajax to handle a user's bus decision (sign up or opt out)
     * @param busid
     * @param decision signup, optout
     * @param callback
     */
    var userBusDecision = function userBusDecision(busid, decision, callback) {
        $.ajax({
            type: "POST",
            url: "/user/busdecision",
            data: {
                busid: busid,
                decision: decision
            },
            success: function (data) {
                callback(data);
            },
            error: function (e) {
                console.log("Couldn't sign up or opt out of bus.");
                alert('The bus is full! Please contact us at info@bigredhacks.com')
            }
        });
    };

    //Sign up for bus
    $("#signup").on('click', function () {
        var businfobox = $(this).parents(".businfobox");
        if (businfobox.find(".userbusdecision").html() != "<b>Your Current Bus Decision:</b> Signed Up") {
            userBusDecision(businfobox.data("busid"), "signup", function (data) {
                var newmembernumber = parseInt(businfobox.find(".currentnumber").data("currentnumber")) + 1;
                businfobox.find(".currentnumber").html("<b>Current Number on Bus:</b> " + newmembernumber);
                businfobox.find(".currentnumber").data("currentnumber", newmembernumber.toString());
                businfobox.find(".userbusdecision").html("<b>Your Current Bus Decision:</b> Signed Up")
            });
        }
    });

    //Opt out of bus
    $("#optout").on('click', function () {
        var businfobox = $(this).parents(".businfobox");
        if (businfobox.find(".userbusdecision").html() != "<b>Your Current Bus Decision:</b> Opt Out") {
            userBusDecision(businfobox.data("busid"), "optout", function (data) {
                var newmembernumber = parseInt(businfobox.find(".currentnumber").data("currentnumber")) - 1;
                businfobox.find(".currentnumber").html("<b>Current Number on Bus:</b> " + newmembernumber);
                businfobox.find(".currentnumber").data("currentnumber", newmembernumber.toString());
                businfobox.find(".userbusdecision").html("<b>Your Current Bus Decision:</b> Opt Out")
            });
        }
    });

});


//check length of user id input
function checkUserId() {
    //field doens't exist if registration disabled
    if ($('#addteamid').length > 0) {
        if ($('#addteamid').val().length > 0) {
            $('#addteamid-submit').prop('disabled', false);
        }
        else {
            $('#addteamid-submit').prop('disabled', true);
        }
    }
}

//check whether resume is present in upload
function checkResume() {
    var files = $('input#resumeinput')[0].files;
    if (files.length > 0 && files[0].type === "application/pdf") {
        $('#resume-save').prop('disabled', false);
    }
    else {
        $('#resume-save').prop('disabled', true);
    }
}

/**********************
 /********RSVP**********
 /*********************/

$("#rsvpDropdown").on('change', function() {
    if ($(this).val() == "yes") {
        $("#coming-only").show();
    }
    else $("#coming-only").hide();
});

$.validator.addMethod("conditionalRSVP", function (val, elem, params) {
    //require value if yes response
    if ($("#rsvpDropdown").val() == "yes" && val) {
        return true;
    }
    //dont require value if no response
    if ($("#rsvpDropdown").val() == "no") {
        return true;
    }
    else return false;
});

$('#rsvpForm').validate({
    ignore: 'input:not([name])', //ignore unnamed input tags
    onfocusout: function (e, event) {
        this.element(e); //validate field immediately
    },
    onkeyup: false,
    rules: {
        rsvpDropdown: {
            required: true
        },
        receipt: {
            conditionalRSVP: true,
            extension: "pdf",
            accept: 'application/pdf'
        },
        legal: {
            conditionalRSVP: true
        }
    },
    messages: {
        rsvpDropdown: "Please indicate whether you will be able to attend",
        receipt: {
            conditionalRSVP: "Please upload a travel receipt"
        },
        legal: {
            conditionalRSVP: "Please review the legal information"
        }
    }
});
