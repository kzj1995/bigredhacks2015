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

