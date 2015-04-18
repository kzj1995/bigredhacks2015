$('document').ready(function () {
    var engine = new Bloodhound({
        name: 'colleges',
        prefetch: '/api/colleges',
        datumTokenizer: function (d) {
            return Bloodhound.tokenizers.whitespace(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        limit: 5,
        sorter: function (a, b) {

            //case insensitive matching
            var input = $('#college').val().toLowerCase();
            a = a.name.toLowerCase();
            b = b.name.toLowerCase();

            //move exact matches to top
            if (input === a) {
                return -1;
            }
            if (input === b) {
                return 1;
            }

            //move beginning matches to top
            if (a.lastIndexOf(input, 0) === 0){
                return -1;
            }
            if (b.lastIndexOf(input, 0) === 0){
                return 1;
            }
        }
    });

    engine.initialize();

    $('.typeahead').typeahead({
        hint: true,
        highlight: true,
        autoselect: false,
        minLength: 3
    }, {
        displayKey: 'name', // if not set, will default to 'value',
        source: engine.ttAdapter()
    }).on('typeahead:selected typeahead:autocomplete', function (obj, datum, name) {
        $("#collegeid").val(datum.id);

    });

    $('#registrationForm').validate({
        rules: {
            email: {
                required: true,
                email: true
            },
            password: {
                required: true,
                minlength: 6
            },
            confirmpassword: {
                required: true,
                minlength: 6,
                equalTo: "#password"
            },
            firstname: {
                required: true,
                minlength: 2
            },
            lastname: {
                required: true,
                minlength: 2
            },
            phonenumber: {
                required: true,
                minlength: 10,
                digits: true
            },
            major: {
                required: true
            },
            q1: {
                required: true
            },
            q2: {
                required: true
            },
            linkedin: {
                url: true
            }
        },
        messages: {
            email: "Please provide a valid email address",
            password: {
                required: "Please provide a password",
                minlength: "Your password must be at least 6 characters long"
            },
            confirm_password: {
                required: "Please confirm your password",
                minlength: "Your password must be at least 6 characters long",
                equalTo: "Please enter the same password as above"
            },
            firstname: "Please enter your first name",
            lastname: "Please enter your last name",
            phonenumber: "Please provide a valid phone number",
            major: "Please enter your major",
            q1: "Please fill out essay question 1",
            q2: "Please fill out essay question 2",
            github: "Please provide a valid url"
        }
    });

});