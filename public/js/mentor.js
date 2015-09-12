$(document).ready(function () {

    var socket = io(); //client-side Socket.IO object

    //Update mentor's requests queue with new request
    socket.on("mentor " + $("#mentorname").data("mentorpubid"), function (mentorRequest) {
        var requestTitle = "<div class='mentorrequestbox' data-mentorrequestpubid='" + mentorRequest.pubid + "'>" +
            "<div class='mentorrequestboxtitle'> Mentor Request Information </div><div class='requeststatus'> " +
            "<h3> Status of Request: <span class='" + mentorRequest.requeststatus.toLowerCase() + "'>" +
            mentorRequest.requeststatus + "</span></h3> </div><ul class='requestinfo'>";
        var userName = "<li class='userName'> <b>User: </b>" + mentorRequest.user.name + "</li>";
        var description = "<li class='description'> <b>Description of Request: </b><textarea class='form-control " +
            "description' rows='5' readonly>" + mentorRequest.description + "</textarea></li>";
        var skillsList = "";
        for (var i = 0; i < mentorRequest.skills.length; i = i + 1) {
            skillsList = skillsList + "<li class='skill'>" + mentorRequest.skills[i] + "</li>"
        }
        var desiredSkills = "<li class='desiredskills'> <b>Desired Skills: </b> <ul class='skillslist'>" + skillsList +
            "</ul></li>";
        var requestStatus = "<li class='requeststatus'> <b>Status of Request: </b>" + mentorRequest.requeststatus + "</li>";
        var location = "<li class='location'> <b>Location of User: </b>" + mentorRequest.location + "</li>";
        var mentor = "<li class='mentor'> <b>Mentor: </b>None</li>";
        var claimRequest = "<div class='claimrequest'> <input type='button' value='claim' name='claim' " +
            "class='btn btn-primary'> </div>";
        var newMentorRequest = requestTitle + userName + description + desiredSkills + requestStatus + location +
            mentor + "</ul>" + claimRequest + "</div>";
        if ($('#usermentorrequests').length == 0) {
            $("#norequests").replaceWith("<div id='usermentorrequests'>" + newMentorRequest + "</div>");
        }
        else {
            $('#usermentorrequests').append(newMentorRequest);
        }
    });

});

