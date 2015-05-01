/**
 * Contains reusable backend validations
 * Some notes:
 * - try to keep naming consistent with field names
 **/


var validator = function () {
    var _req = null;
    var validators = {
        email: function () {
            _req.assert('email', 'Email address is not valid').isEmail()
        },
        password: function () {
            _req.assert('password', "Password is not valid. 6 to 25 characters required.").len(6, 25);
        },
        passwordOptional: function () {
            _req.assert('password', "Password is not valid. 6 to 25 characters required.").optionalOrLen(6, 25);
        },
        firstname: function () {
            _req.assert('firstname', 'First name is required').notEmpty()
        },
        lastname: function () {
            _req.assert('lastname', 'Last name is required').notEmpty()
        },
        phonenumber: function () {
            _req.body.phonenumber = _req.body.phonenumber.replace(/-/g, '');
            _req.assert('phonenumber', 'Please enter a valid US phone number').isMobilePhone('en-US')
        },
        major: function () {
            _req.assert('major', 'Major is required').len(1, 50)
        },
        genderDropdown: function () {
            _req.assert('genderDropdown', 'Gender is required').notEmpty()
        },
        dietary: function () {
            _req.assert('dietary', 'Please specify dietary restrictions').notEmpty()
        },
        tshirt: function () {
            _req.assert('tshirt', 'Please specify a t-shirt size').notEmpty()
        },
        linkedin: function () {
            _req.assert('linkedin', 'LinkedIn URL is not valid').optionalOrisURL()
        },
        collegeid: function () {
            _req.assert('collegeid', 'Please specify a school.').notEmpty()
        },
        q1: function () {
            _req.assert('q1', 'Question 1 cannot be blank').notEmpty()
        },
        q2: function () {
            _req.assert('q2', 'Question 2 cannot be blank').notEmpty()
        }, //fixme refine this
        yearDropdown: function () {
            _req.assert('yearDropdown', 'Please specify a graduation year').notEmpty()
        }
        //todo check that validations are complete
    };


    /**
     * runs an array of validations
     * @param validations
     * @returns {runValidations}
     */
    var runValidations = function runValidations(validations) {
        if (!_req) {
            console.log()
        }
        for (var i = 0; i < validations.length; i++) {
            if (!validators.hasOwnProperty(validations[i])) {
                console.log("Error: validation", validations[i], "does not exist");
                continue;
            }
            validators[validations[i]]();
        }
        return _req;
    };

    //reset the req object
    var validator = function validator(req) {
        _req = req;
        return public();
    };

    function public() {
        return {
            validator: validator,
            runValidations: runValidations
        }
    }

    return public();
};


module.exports = validator();