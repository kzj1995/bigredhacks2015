$(document).ready( function() {

    //Update resume
    $("#resume-update").on('click', function(e) {
        e.preventDefault();
        $("#resume-form").toggle();
    });

    //File picker
    $(function () {
        $("input[type='file']").filepicker();
    });

    setInterval(function() {
        checkUserId();
        checkResume();
    }, 200);
});



function checkUserId() {
    if ($('#addteamid').val().length > 0){
        $('#addteamid-submit').prop('disabled', false);
    }
    else {
        $('#addteamid-submit').prop('disabled', true);
    }
}

function checkResume() {
    var files = $('input#resumeinput')[0].files;
    if (files.length > 0 && files[0].type === "application/pdf") {
        $('#resume-save').prop('disabled', false);
    }
    else {
        $('#resume-save').prop('disabled', true);
    }
}