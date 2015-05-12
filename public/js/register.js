$('document').ready(function () {

    //File picker
    $(function () {
        $("input[type='file']").filepicker();
    });

    /*
     * Typeahead
     */
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
            if (a.lastIndexOf(input, 0) === 0) {
                return -1;
            }
            if (b.lastIndexOf(input, 0) === 0) {
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


    /*
     * Validator
     */

    //check that two fields ae not simultaneously empty
    $.validator.addMethod("notEmpty", function (val, elem, params) {
        var f1 = $('#' + params[0]).val(),
            f2 = $('#' + params[1]).val();
        return f1 !== "" && f2 !== "";
    }, 'Enter a valid college. Enter "Unlisted" if your college is not listed.');

    //valid linkedin url or optional
    $.validator.addMethod("linkedinURL", function (val, elem, params) {
        return /^(www\.)?linkedin\.com\/\S+$/ig.test(val) || val === "";
    });

    notCornellText = 'We aren\'t accepting applications from Cornell students right now.';

    //fails for cornell email
    $.validator.addMethod("emailNotCornell", function (val, elem, params) {
        return !/^[^@]+@cornell\.edu$/i.test(val);
    }, notCornellText);

    //fails for cornell school
    $.validator.addMethod("schoolNotCornell", function (val, elem, params) {
        var restrict = ["Cornell Tech - NY", "Cornell University - NY"];
        if (restrict.indexOf(val) == -1) {
            return true;
        }
        else return false;
    }, notCornellText);

    $('#registrationForm').validate({
        onfocusout: function (e, event) {
            this.element(e); //validate field immediately
        },
        onkeyup: false,
        rules: {
            email: {
                required: true,
                email: true,
                emailNotCornell: true
            },
            password: {
                minlength: 6,
                maxlength: 25
            },
            confirmpassword: {
                required: true,
                minlength: 6,
                maxlength: 25,
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
                phoneUS: true
            },
            college: {
                notEmpty: ['college', 'collegeid'],
                schoolNotCornell: true
            },
            major: {
                required: true
            },
            resume: {
                required: true,
                extension: "pdf",
                accept: 'application/pdf'
            },
            q1: {
                required: true,
                maxlength: 5000
            },
            q2: {
                required: true,
                maxlength: 5000
            },
            linkedin: {
                linkedinURL: true
            },
            anythingelse: {
                required: false,
                maxlength: 1000
            }
        },
        messages: {
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
            resume: "Please upload a valid .pdf",
            major: "Please enter your major",
            linkedin: "Please provide a valid LinkedIn url"
        }
    });

});