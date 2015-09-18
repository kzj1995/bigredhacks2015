$(document).ready(function () {

    /**********************
     *** Request Mentor****
     **********************/

    var socket = io(); //client-side Socket.IO object

    requestPermission(); //request permission for HTML5 Notifications

    function requestPermission() {
        if ("Notification" in window) {
            if (Notification.permission !== "granted" && Notification.permission !== 'denied') {
                Notification.requestPermission(function (permission) {});
            }
        }
    }

    //Submission of request mentor form through socket
    $("#requestmentorform").submit(function () {
        var mentorRequest = {
            requestDescription: $("#requestdescription").val(),
            requestSkills: $("#requestskills").val(),
            requestLocation: $("#requestlocation").val(),
            userpubid: $(".row").data("userpubid")
        }
        socket.emit('new mentor request', mentorRequest);
        $("#requestdescription").val('');
        $("#requestskills").val('');
        $("#requestlocation").val('');
        return false;
    });

    //Update user's page with his/her new mentor request
    socket.on("user " + $(".row").data("userpubid"), function (mentorRequest) {
        var requestTitle = "<div class='mentorrequestbox' data-mentorrequestpubid='" + mentorRequest.pubid + "'>" +
            "<div class='mentorrequestboxtitle'> Request from " + mentorRequest.user.name + " </div>" +
            "<div class='requeststatus'><h3> Status of Request: <span class='" + mentorRequest.requeststatus.toLowerCase()
            + "'>" + mentorRequest.requeststatus + "</span> , # Matching Mentors: <span class='nummatchingmentors'>" +
            mentorRequest.nummatchingmentors + "</span></h3></div><ul class='requestinfo'>";
        var description = "<li class='description'> <b>Description of Request: </b><textarea class='form-control " +
            "description' rows='5' readonly>" + mentorRequest.description + "</textarea></li>";
        var skillsList = "";
        for (var i = 0; i < mentorRequest.skills.length; i = i + 1) {
            skillsList = skillsList + "<li class='skill'>" + mentorRequest.skills[i] + "</li>"
        }
        var desiredSkills = "<li class='desiredskills'> <b>Desired Skills: </b> <ul class='skillslist'>" + skillsList +
            "</ul></li>";
        var location = "<li class='location'> <b>Location of User: </b>" + mentorRequest.location + "</li>";
        var mentor = "<li class='mentor'> <b>Mentor: </b>None</li>";
        var cancelRequest = "<div class='changerequeststatus'><input type='button' value='cancel request' " +
            "name='cancelrequest' class='cancelrequest btn btn-danger'></div>";
        var newMentorRequest = requestTitle + description + desiredSkills + location +
            mentor + "</ul>" + cancelRequest + "</div>";
        if ($('#usermentorrequests').length == 0) {
            $("#norequests").replaceWith("<div id='usermentorrequests'>" + newMentorRequest + "</div>");
        }
        else {
            $('#usermentorrequests').append(newMentorRequest);
        }
    });

    //Update existing user request with new status (Unclaimed, Claimed, Completed)
    socket.on("new request status " + $(".row").data("userpubid"), function (requestStatus) {
        showRequestNotification(requestStatus);
        var allUserRequests = $(".mentorrequestbox");
        for (var i = 0; i < allUserRequests.length; i++) {
            if (allUserRequests.eq(i).data("mentorrequestpubid") == requestStatus.mentorRequestPubid) {
                if (requestStatus.newStatus == "Claimed") {
                    allUserRequests.eq(i).find(".requeststatus").html("<h3> Status of Request: <span class='claimed'> " +
                        "Claimed </span></h3>");
                    allUserRequests.eq(i).find(".mentor").html("<b>Mentor: </b>" + requestStatus.mentorInfo.name + " (" +
                        requestStatus.mentorInfo.company + ")");
                    allUserRequests.eq(i).find(".changerequeststatus").html("<input type='button' value=" +
                        "'set request as completed' name='completerequest' class='completerequest btn btn-success'>");
                } else if (requestStatus.newStatus == "Unclaimed") {
                    allUserRequests.eq(i).find(".requeststatus").html("<h3> Status of Request: <span class='unclaimed'> " +
                        "Unclaimed </span>, # Matching Mentors: <span class='nummatchingmentors'>" +
                        requestStatus.nummatchingmentors + "</span></h3>");
                    allUserRequests.eq(i).find(".mentor").html("<b>Mentor: </b>" + "None");
                    allUserRequests.eq(i).find(".changerequeststatus").html("<input type='button' value=" +
                        "'cancel request' name='cancelrequest' class='cancelrequest btn btn-danger'>");
                }
            }
        }
    });

    //Update number of mentors for a given user request
    socket.on("new number of mentors " + $(".row").data("userpubid"), function (givenRequest) {
        var allUserRequests = $(".mentorrequestbox");
        for (var i = 0; i < allUserRequests.length; i++) {
            if (allUserRequests.eq(i).data("mentorrequestpubid") == givenRequest.mentorRequestPubid) {
                allUserRequests.eq(i).find(".nummatchingmentors").text(givenRequest.nummatchingmentors);
            }
        }
    });

    //delete existing mentor request
    $(document).on('click', ".cancelrequest", function () {
        var mentorrequestbox = $(this).parents(".mentorrequestbox");
        var cancelRequest = {
            mentorRequestPubid: mentorrequestbox.data("mentorrequestpubid")
        }
        socket.emit('cancel mentor request', cancelRequest);
        mentorrequestbox.remove();
        if ($('.mentorrequestbox').length == 0) {
            $("#usermentorrequests").replaceWith("<h3 id='norequests'>" +
                "You have not sent any mentor requests yet. </h3>");
        }
        return false;
    });

    //set status of existing mentor request as complete
    $(document).on('click', ".completerequest", function () {
        var mentorrequestbox = $(this).parents(".mentorrequestbox");
        var completeRequest = {
            mentorRequestPubid: mentorrequestbox.data("mentorrequestpubid")
        }
        socket.emit('complete mentor request', completeRequest);
        mentorrequestbox.find(".requeststatus").html("<h3> Status of Request: <span class='completed'>" +
            "Completed</span></h3>");
        mentorrequestbox.find(".changerequeststatus").remove();
        return false;
    });

    /************************************
     *** Dashboard Home Functionality****
     ************************************/

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

    /**
     * triggers an HTML5 Notification with content based on the requestStatus object
     * @param requestStatus JSON object representing the new status of a user's mentor request
     */
    function showRequestNotification(requestStatus) {
        var notificationTitle = ""; //title of HTML5 notification
        var notificationBody = ""; //text body of HTML5 notification
        if (requestStatus.newStatus == "Claimed") {
            notificationTitle = "Request Claimed";
            notificationBody = requestStatus.mentorInfo.name + " from " + requestStatus.mentorInfo.company +
                " has claimed your request."
        }
        else if (requestStatus.newStatus == "Unclaimed") {
            notificationTitle = "Request Unclaimed";
            notificationBody = requestStatus.mentorInfo.name + " from " + requestStatus.mentorInfo.company +
                " has unclaimed your request."
        }
        if ("Notification" in window) {
            if (Notification.permission === "granted") {
                var options = {
                    body: notificationBody,
                    icon: window.location.protocol + "//" + window.location.host +
                    requestStatus.mentorInfo.companyImage
                };
                var notification = new Notification(notificationTitle, options);
            }
            else if (Notification.permission !== 'denied') {
                Notification.requestPermission(function (permission) {
                    if (permission === "granted") {
                        var options = {
                            body: notificationBody,
                            icon: window.location.protocol + "//" + window.location.host +
                            requestStatus.mentorInfo.companyImage
                        };
                        var notification = new Notification(notificationTitle, options);
                    }
                });
            }
        }
    }


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

//not interested in going check for waitlisted
$("#notinterested").on("change", function () {
    var _this = this;
    $(".checkbox").addClass("disabled");
    $(_this).prop("disabled", true);
    var checked = this.checked;
    $.ajax({
        url: "/api/rsvp/notinterested",
        type: "POST",
        data: {checked: checked},
        success: function (d) {
            $(".checkbox").removeClass("disabled");
            $(_this).prop("disabled", false);
        }
    })
});

//rsvp for cornell students
$("#cornell-rsvp").on("change", function () {
    var _this = this;
    $(".checkbox", this).addClass("disabled");
    $(_this).prop("disabled", true);
    var checked = this.checked;
    $.ajax({
        url: "/api/rsvp/cornellstudent",
        type: "PATCH",
        data: {checked: checked},
        success: function (d) {
            $(".checkbox").removeClass("disabled");
            $(_this).prop("disabled", false);
        }
    })
});

$("#rsvpDropdown").on('change', function () {
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
