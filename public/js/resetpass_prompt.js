$('#resetPassForm').validate({
    onfocusout: function (e, event) {
        this.element(e); //validate field immediately
    },
    onkeyup: false,
    rules: {
        password: {
            minlength: 6,
            maxlength: 25
        },
        confirmpassword: {
            required: true,
            minlength: 6,
            maxlength: 25,
            equalTo: "#password"
        }
    }
});