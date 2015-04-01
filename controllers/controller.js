var User = require('../models/user.js');

exports.create = function(req, res){
    var entry = new User({
        name: {
            first: req.body.firstname,
            last: req.body.lastname
        },
        email: req.body.email,
        password: req.body.password,
        gender: req.body.genderDropdown,
        phone: req.body.phonenumber,
        college: req.body.college,
        year: req.body.yearDropdown,
        major: req.body.major,
        application: {
            github: req.body.github,
            linkedin: req.body.linkedin,
            resume: req.body.resume,
            question: {
                q1: req.body.q1,
                q2: req.body.q2
            }
        },
        internal: {
            dietary: req.body.dietary,
            tshirt: req.body.tshirt
        }
    });


    entry.save(function (err,doc){
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        }
        else {
            //redirect to home page
            res.redirect(301, "/");
        }
    });

};