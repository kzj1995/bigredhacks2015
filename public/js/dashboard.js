$(document).ready( function() {
    setInterval(function() {
        checkUserId();
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