/**
 * Contains reusable backend validations
 * Some notes:
 * - try to keep naming consistent with field names
 **/


var validator = function () {
    var validators = {
        email: function (req) {
            req.assert('email', 'Email address is not valid').isEmail()
        },
        password: function (req) {
            req.assert('password', "Password is not valid. 6 to 25 characters required.").len(6, 25);
        },
        passwordOptional: function (req) {
            req.assert('password', "Password is not valid. 6 to 25 characters required.").optionalOrLen(6, 25);
        },
        firstname: function (req) {
            req.assert('firstname', 'First name is required').notEmpty()
        },
        lastname: function (req) {
            req.assert('lastname', 'Last name is required').notEmpty()
        },
        phonenumber: function (req) {
            req.body.phonenumber = req.body.phonenumber.replace(/-/g, '');
            req.assert('phonenumber', 'Please enter a valid US phone number').isMobilePhone('en-US')
        },
        major: function (req) {
            req.assert('major', 'Major is required').len(1, 50)
        },
        genderDropdown: function (req) {
            req.assert('genderDropdown', 'Gender is required').notEmpty()
        },
        dietary: function (req) {
            req.assert('dietary', 'Please specify dietary restrictions').notEmpty()
        },
        tshirt: function (req) {
            req.assert('tshirt', 'Please specify a t-shirt size').notEmpty()
        },
        linkedin: function (req) {
            req.assert('linkedin', 'LinkedIn URL is not valid').optionalOrisURL()
        },
        collegeid: function (req) {
            req.assert('collegeid', 'Please specify a school.').notEmpty()
        },
        q1: function (req) {
            req.assert('q1', 'Question 1 cannot be blank').notEmpty()
        },
        q2: function (req) {
            req.assert('q2', 'Question 2 cannot be blank').notEmpty()
        }, //fixme refine this
        yearDropdown: function (req) {
            req.assert('yearDropdown', 'Please specify a graduation year').notEmpty()
        }
        //todo check that validations are complete
    };


    /**
     * runs an array of validations
     * @param req
     * @param validations
     * @returns {runValidations}
     */
    var validate = function validate(req, validations) {

        for (var i = 0; i < validations.length; i++) {
            if (!validators.hasOwnProperty(validations[i])) {
                console.log("Error: validation", validations[i], "does not exist");
                continue;
            }
            validators[validations[i]](req);
        }
        return req;
    };


    return {
        validate: validate
    }

};


module.exports = validator();