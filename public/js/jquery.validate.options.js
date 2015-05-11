$.validator.setDefaults({
    highlight: function (element) {
        $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
    },
    unhighlight: function (element) {
        $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
    },
    errorElement: 'span',
    errorClass: 'help-inline',
    errorPlacement: function (error, element) {
        element = $(element).closest('.form-group').find('label');
        error.insertAfter(element);
    }
});