$(document).ready(function () {

    var socket = io(); //client-side Socket.IO object

    requestPermission(); //request permission for HTML5 Notifications

    function requestPermission() {
        if ("Notification" in window) {
            if (Notification.permission !== "granted" && Notification.permission !== 'denied') {
                Notification.requestPermission(function (permission) {});
            }
        }
    }

    //Update mentor's requests queue with new request
    socket.on("mentor " + $(".row").data("mentorpubid"), function (mentorRequest) {
        var requestTitle = "<div class='mentorrequestbox' data-mentorrequestpubid='" + mentorRequest.pubid + "' " +
            "data-match='" + mentorRequest.match + "'><div class='mentorrequestboxtitle'> Request from "
            + mentorRequest.user.name + " </div><div class='requeststatus'><h3> Status of Request: <span class='" +
            mentorRequest.requeststatus.toLowerCase() + "'>" + mentorRequest.requeststatus + "</span></h3> </div>" +
            "<ul class='requestinfo'>";
        var description = "<li class='description'> <b>Description of Request: </b><span class='long-text description' " + mentorRequest.description + "</span></li>";
        var skillsList = "";
        for (var i = 0; i < mentorRequest.skills.length; i = i + 1) {
            skillsList = skillsList + "<li class='skill'>" + mentorRequest.skills[i] + "</li>"
        }
        var desiredSkills = "<li class='desiredskills'> <b>Desired Skills: </b> <ul class='skillslist'>" + skillsList +
            "</ul></li>";
        var location = "<li class='location'> <b>Location of User: </b>" + mentorRequest.location + "</li>";
        var mentor = "<li class='mentor'> <b>Mentor: </b>None</li>";
        var claimRequest = "<div class='changerequeststatus'> <input type='button' value='claim' name='claim' " +
            "class='claim btn btn-primary'> </div>";
        var newMentorRequest = requestTitle + description + desiredSkills + location +
            mentor + "</ul>" + claimRequest + "</div>";
        if ($('#usermentorrequests').length == 0) {
            $("#norequests").replaceWith("<div id='usermentorrequests'><h5><input type='checkbox' id='onlyunclaimed' " +
            "name='onlyunclaimed'> show only unclaimed </h5><h5><input type='checkbox' id='onlymatching' " +
            "name='onlymatching'> show only matching requests</h5>" + newMentorRequest + "</div>");
        }
        else {
            $('#usermentorrequests').append(newMentorRequest);
        }
        if (mentorRequest.match == "yes") {
            showRequestNotification();
        }
        considerMatching();
    });

    //Update existing user request with new status (Unclaimed, Claimed, Completed)
    socket.on("new request status " + $(".row").data("mentorpubid"), function (requestStatus) {
        var allUserRequests = $(".mentorrequestbox");
        for (var i = 0; i < allUserRequests.length; i++) {
            if (allUserRequests.eq(i).data("mentorrequestpubid") == requestStatus.mentorRequestPubid) {
                if (requestStatus.newStatus == "Claimed") {
                    allUserRequests.eq(i).find(".requeststatus").html("<h3> Status of Request: <span class='claimed'> " +
                        "Claimed </span></h3>");
                    allUserRequests.eq(i).find(".mentor").html("<b>Mentor: </b>" + requestStatus.mentorInfo.name + " (" +
                        requestStatus.mentorInfo.company + ")");
                    allUserRequests.eq(i).find(".changerequeststatus").html("<input type='button' value='unclaim' " +
                        "name='unclaim' class='unclaim btn btn-primary'>");
                } else if (requestStatus.newStatus == "Unclaimed") {
                    allUserRequests.eq(i).find(".requeststatus").html("<h3> Status of Request: <span class='unclaimed'> " +
                        "Unclaimed </span>");
                    allUserRequests.eq(i).find(".mentor").html("<b>Mentor: </b>" + "None");
                    allUserRequests.eq(i).find(".changerequeststatus").html("<input type='button' value='claim' " +
                        "name='claim' class='claim btn btn-primary'>");
                }
            }
        }
    });

    //Cancel existing user request
    socket.on("cancel request " + $(".row").data("mentorpubid"), function (cancelRequest) {
        var allUserRequests = $(".mentorrequestbox");
        for (var i = 0; i < allUserRequests.length; i++) {
            if (allUserRequests.eq(i).data("mentorrequestpubid") == cancelRequest.mentorRequestPubid) {
                allUserRequests.eq(i).remove();
                if ($('.mentorrequestbox').length == 0) {
                    $("#usermentorrequests").replaceWith("<h3 id='norequests'> There are currently no requests that " +
                        "match your skill set. You can add to your skill set in dashboard home to increase the " +
                        "number of requests that come your way.</h3>");
                }
            }
        }
    });

    //Send existing user request to completion
    socket.on("complete request " + $(".row").data("mentorpubid"), function (completeRequest) {
        var allUserRequests = $(".mentorrequestbox");
        for (var i = 0; i < allUserRequests.length; i++) {
            if (allUserRequests.eq(i).data("mentorrequestpubid") == completeRequest.mentorRequestPubid) {
                allUserRequests.eq(i).find(".requeststatus").html("<h3> Status of Request: <span class='completed'>" +
                    "Completed</span></h3>");
                allUserRequests.eq(i).find(".changerequeststatus").remove();
            }
        }
    });

    //claim a user's mentor request
    $(document).on('click', ".claim", function () {
        var mentorrequestbox = $(this).parents(".mentorrequestbox");
        var claimRequest = {
            mentorRequestPubid: mentorrequestbox.data("mentorrequestpubid"),
            mentorPubid: $(".row").data("mentorpubid"),
            newStatus: "Claimed"
        }
        socket.emit('set request status', claimRequest);
        return false;
    });

    //unclaim a user's mentor request
    $(document).on('click', ".unclaim", function () {
        var mentorrequestbox = $(this).parents(".mentorrequestbox");
        var unclaimRequest = {
            mentorRequestPubid: mentorrequestbox.data("mentorrequestpubid"),
            mentorPubid: $(".row").data("mentorpubid"),
            newStatus: "Unclaimed"
        }
        socket.emit('set request status', unclaimRequest);
        return false;
    });

    //Consider only unclaimed mentor requests or all mentor requests
    $(document).on('change', "#onlyunclaimed", function () {
         if (this.checked) {
             $(".claimed").parents(".mentorrequestbox").hide();
             $(".completed").parents(".mentorrequestbox").hide();
         }
         else {
             $(".claimed").parents(".mentorrequestbox").show();
             $(".completed").parents(".mentorrequestbox").show();
         }
    });

    //Consider only mentor requests with at least one matching skill or all mentor requests
    $(document).on('change', "#onlymatching", function () {
        considerMatching();
    });

    var considerMatching = function considerMatching() {
        var allUserRequests = $(".mentorrequestbox");
        for (var i = 0; i < allUserRequests.length; i++) {
            if($("#onlymatching").is(':checked')) {
                if (allUserRequests.eq(i).data("match") == "no") {
                    allUserRequests.eq(i).hide();
                }
            }
            else {
                if (allUserRequests.eq(i).data("match") == "no") {
                    allUserRequests.eq(i).show();
                }
            }
        }
    }

    /**
     * triggers an HTML5 Notification letting mentor know that a matching mentor request has been submitted
     */
    function showRequestNotification() {
        var notificationTitle = "Matching Request"; //title of HTML5 notification
        var notificationBody = "A request that matches your skills has arrived."; //text body of HTML5 notification
        if ("Notification" in window) {
            if (Notification.permission === "granted") {
                var options = {
                    body: notificationBody,
                    icon: window.location.protocol + "//" + window.location.host +
                    "/img/icon/brh-icon-152.png"
                };
                var notification = new Notification(notificationTitle, options);
            }
            else if (Notification.permission !== 'denied') {
                Notification.requestPermission(function (permission) {
                    if (permission === "granted") {
                        var options = {
                            body: notificationBody,
                            icon: window.location.protocol + "//" + window.location.host +
                            "/img/icon/brh-icon-152.png"
                        };
                        var notification = new Notification(notificationTitle, options);
                    }
                });
            }
        }
    }

});

