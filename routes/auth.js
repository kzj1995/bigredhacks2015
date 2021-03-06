var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var _ = require('underscore');
var multiparty = require('multiparty');

var helper = require('../util/routes_helper.js');
var User = require('../models/user.js');
var MentorRequest = require('../models/mentor_request.js');
var College = require('../models/college.js');
var async = require('async');
var enums = require('../models/enum.js');
var validator = require('../library/validations.js');
var middle = require('./middleware');
var ALWAYS_OMIT = 'password confirmpassword'.split('');
var MAX_FILE_SIZE = 1024 * 1024 * 5;

var config = require('../config.js');
var mandrill = require('mandrill-api/mandrill');
var uid = require("uid2");


var mandrill_client = new mandrill.Mandrill(config.setup.mandrill_api_key);


passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function (req, email, password, done) {
        User.findOne({email: email}, function (err, user) {
            if (err) {
                return done(err);
            }
            if (user == null || !user.validPassword(password)) {
                return done(null, false, function () {
                    req.flash('email', email);
                    req.flash('error', 'Incorrect username or email.');
                }());
            }
            return done(null, user);
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

module.exports = function (io) {
    var router = express.Router();

    /* GET registration page */
    router.get('/register', middle.requireRegistrationOpen, function (req, res) {
        res.render("register_general",
            {title: "Register", enums: enums, error: req.flash('error')});
    });

    /* GET registration page for Cornell (University and Tech) Students */
    router.get('/register/:name', middle.requireCornellRegistrationOpen, function (req, res) {
        //get full college object
        _findCollegeFromFilteredParam(req.params.name, function (err, college) {

            if (college == null) {
                //college does not exist, or not allowed
                return res.redirect('/');
            }
            else {
                res.render("register_cornell", {
                    urlparam: req.params.name,
                    title: college.name + " Registration",
                    enums: enums,
                    error: req.flash('error'),
                    limit: config.admin.cornell_auto_accept,
                    college: college
                });
            }
        });
    });


    /**
     * Find a college entry from a (url) param. This ensures consistent results as only certain params are allowed
     * @param name
     * @param callback
     * @returns {*} College object if it exists, otherwise null. Also null if the param does not meet the filter
     * @private
     */
    function _findCollegeFromFilteredParam(name, callback) {
        var collegeName = "";

        //todo refactor
        var schools = {
            cornelltech: "Cornell Tech",
            cornelluniversity: "Cornell University",
            temple: "Temple University"
        };

        if (schools.hasOwnProperty(name)) {
            collegeName = schools[name];
        } else {
            return callback(null, null);
        }

        College.findOne({name: collegeName}, callback);
    }


    /* POST register a new user */
    router.post('/register', middle.requireRegistrationOpen, function (req, res) {
        var form = new multiparty.Form({maxFilesSize: MAX_FILE_SIZE});
        form.parse(req, function (err, fields, files) {
            if (err) {
                console.log(err);
                req.flash('error', "Error parsing form.");
                return res.redirect('/register');
            }

            req.body = helper.reformatFields(fields);

            req.files = files;
            var resume = files.resume[0];
            //console.log(resume);
            //console.log(resume.headers);

            //todo reorder validations to be consistent with form
            req = validator.validate(req, [
                'email', 'password', 'firstname', 'lastname', 'phonenumber', 'major', 'genderDropdown', 'dietary', 'tshirt', 'linkedin', 'collegeid', 'q1', 'q2', 'anythingelse', 'experienceDropdown', 'yearDropdown'
            ]);


            var errors = req.validationErrors();
            //console.log(errors);
            if (errors) {
                var errorParams = errors.map(function (x) {
                    return x.param;
                });
                req.body = _.omit(req.body, errorParams.concat(ALWAYS_OMIT));
                res.render('register', {
                    title: 'Register',
                    message: 'The following errors occurred',
                    errors: errors,
                    input: req.body,
                    enums: enums
                });
            }
            else {

                helper.uploadFile(resume, {type: "resume"}, function (err, file) {
                    if (err) {
                        console.log(err);
                        req.flash('error', "File upload failed. :(");
                        return res.redirect('/register');
                    }
                    if (typeof file === "string") {
                        req.flash('error', file);
                        return res.redirect('/register');
                    }

                    //console.log("https://s3.amazonaws.com/" + config.setup.AWS_S3_bucket + '/' + RESUME_DEST + fileName);

                    var newUser = new User({
                        name: {
                            first: req.body.firstname,
                            last: req.body.lastname
                        },
                        email: req.body.email,
                        password: req.body.password,
                        gender: req.body.genderDropdown,
                        phone: req.body.phonenumber,
                        logistics: {
                            dietary: req.body.dietary,
                            tshirt: req.body.tshirt,
                            anythingelse: req.body.anythingelse
                        },
                        school: {
                            id: req.body.collegeid,
                            name: req.body.college,
                            year: req.body.yearDropdown,
                            major: req.body.major
                        },
                        app: {
                            github: req.body.github,
                            linkedin: req.body.linkedin,
                            resume: file.filename,
                            questions: {
                                q1: req.body.q1,
                                q2: req.body.q2
                            },
                            experience: req.body.experienceDropdown
                        },
                        role: "user"
                    });

                    //set user as admin if designated in config for easy setup
                    if (newUser.email === config.admin.email) {
                        newUser.role = "admin";
                    }


                    newUser.save(function (err, doc) {
                        if (err) {
                            // If it failed, return error
                            console.log(err);
                            req.flash("error", "An error occurred.");
                            res.render('register_general', {
                                title: 'Register', error: req.flash('error'), input: req.body, enums: enums
                            });
                        }
                        else {
                            helper.addSubscriber(config.mailchimp.l_applicants, req.body.email, req.body.firstname, req.body.lastname, function (err, result) {
                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    console.log(result);
                                }

                                //send email and redirect to home page
                                req.login(newUser, function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    var template_name = "bigredhackstemplate";
                                    var template_content = [{
                                        "name": "emailcontent",
                                        "content": "<p>Hi " + newUser.name.first + " " + newUser.name.last + ",</p><p>" +
                                        "Thank you for your interest in BigRed//Hacks!  This email is a confirmation " +
                                        "that we have received your application." + "</p><p>" +
                                        "You can log in to our website any time until the application deadline " +
                                        "to update your information or add team members." + "</p><p>" +
                                        "If you haven't already, make sure to like us on Facebook and " +
                                        "follow us on Twitter!" + "</p><p>" +
                                        "<p>Cheers,</p>" + "<p>BigRed//Hacks Team </p>"
                                    }];

                                    var message = {
                                        "subject": "BigRed//Hacks Registration Confirmation",
                                        "from_email": "info@bigredhacks.com",
                                        "from_name": "BigRed//Hacks",
                                        "to": [{
                                            "email": newUser.email,
                                            "name": newUser.name.first + " " + newUser.name.last,
                                            "type": "to"
                                        }],
                                        "important": false,
                                        "track_opens": null,
                                        "track_clicks": null,
                                        "auto_text": null,
                                        "auto_html": null,
                                        "inline_css": null,
                                        "url_strip_qs": null,
                                        "preserve_recipients": null,
                                        "view_content_link": null,
                                        "tracking_domain": null,
                                        "signing_domain": null,
                                        "return_path_domain": null,
                                        "merge": true,
                                        "merge_language": "mailchimp"
                                    };
                                    var async = false;
                                    mandrill_client.messages.sendTemplate({
                                        "template_name": template_name,
                                        "template_content": template_content,
                                        "message": message, "async": async
                                    }, function (result) {
                                        console.log(result);
                                    }, function (e) {
                                        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                    });
                                    res.redirect('/user/dashboard');
                                })
                            })
                        }
                    });
                });
            }
        });
    });

    /* GET registration page for Cornell (University and Tech) Students */
    router.get('/register/:name', middle.requireCornellRegistrationOpen, function (req, res) {
        //get full college object
        _findCollegeFromFilteredParam(req.params.name, function (err, college) {

            if (college == null) {
                //college does not exist, or not allowed
                return res.redirect('/');
            }
            else {
                res.render("register_cornell", {
                    urlparam: req.params.name,
                    title: college.name + " Registration",
                    enums: enums,
                    error: req.flash('error'),
                    limit: config.admin.cornell_auto_accept,
                    college: college
                });
            }
        });
    });


    /**
     * Find a college entry from a (url) param. This ensures consistent results as only certain params are allowed
     * @param name
     * @param callback
     * @returns {*} College object if it exists, otherwise null. Also null if the param does not meet the filter
     * @private
     */
    function _findCollegeFromFilteredParam(name, callback) {
        var collegeName = "";

        //todo cleanup with underscore
        if (name == "cornelltech") {
            collegeName = "Cornell Tech";
        }
        else if (name == "cornelluniversity") {
            collegeName = "Cornell University";
        }
        else {
            return callback(null, null);
        }
        College.findOne({name: collegeName}, callback);
    }

    /* POST register a new user from a specific school*/
//todo cleanup with async waterfall
    router.post('/register/:name', middle.requireCornellRegistrationOpen, function (req, res) {
        //get full college object
        _findCollegeFromFilteredParam(req.params.name, function (err, college) {

            if (err || college == null) {
                //college does not exist, or not allowed
                console.error(err);
                req.flash('error', "An error occurred.");
                return res.redirect('/');
            }

            var form = new multiparty.Form({maxFilesSize: MAX_FILE_SIZE});
            form.parse(req, function (err, fields, files) {
                if (err) {
                    console.log(err);
                    req.flash('error', "Error parsing form.");
                    return res.redirect('/register/' + req.params.name);
                }

                req.body = helper.reformatFields(fields);

                req.files = files;
                var resume = files.resume[0];
                //console.log(resume);
                //console.log(resume.headers);

                //todo reorder validations to be consistent with form
                //application questions are removed
                req = validator.validate(req, [
                    'email', 'password', 'firstname', 'lastname', 'phonenumber', 'major', 'genderDropdown', 'dietary', 'tshirt', 'linkedin', 'anythingelse', 'experienceDropdown', 'yearDropdown'
                ]);


                var errors = req.validationErrors();
                //console.log(errors);
                if (errors) {
                    var errorParams = errors.map(function (x) {
                        return x.param;
                    });
                    req.body = _.omit(req.body, errorParams.concat(ALWAYS_OMIT));
                    res.render('register_cornell', {
                        urlparam: req.params.name,
                        limit: config.admin.cornell_auto_accept,
                        title: 'Register',
                        message: 'The following errors occurred',
                        errors: errors,
                        input: req.body,
                        enums: enums,
                        college: college
                    });
                }
                else {
                    helper.uploadFile(resume, {type: "resume"}, function (err, file) {
                        if (err) {
                            console.log(err);
                            req.flash('error', "File upload failed. :(");
                            return res.redirect('/register/' + req.params.name);
                        }
                        if (typeof file === "string") {
                            req.flash('error', file);
                            return res.redirect('/register/' + req.params.name);
                        }

                        //console.log("https://s3.amazonaws.com/" + config.setup.AWS_S3_bucket + '/' + RESUME_DEST + fileName);

                        var newUser = new User({
                            name: {
                                first: req.body.firstname,
                                last: req.body.lastname
                            },
                            email: req.body.email,
                            password: req.body.password,
                            gender: req.body.genderDropdown,
                            phone: req.body.phonenumber,
                            logistics: {
                                dietary: req.body.dietary,
                                tshirt: req.body.tshirt,
                                anythingelse: req.body.anythingelse
                            },
                            school: {
                                id: college._id,
                                name: college.display,
                                year: req.body.yearDropdown,
                                major: req.body.major
                            },
                            internal: {
                                cornell_applicant: true
                            },
                            app: {
                                github: req.body.github,
                                linkedin: req.body.linkedin,
                                resume: file.filename,
                                experience: req.body.experienceDropdown
                            },
                            role: "user"
                        });


                        //determine auto-acceptance or waitlist
                        User.count({'internal.cornell_applicant': true}, function (err, count) {
                            if (err) {
                                console.error(err);
                                req.flash('Unexpected error.', file);
                                return res.redirect('/register/' + req.params.name);
                            }

                            //auto accept applicants below a certain threshold
                            if (count < config.admin.cornell_auto_accept) {
                                newUser.internal.status = "Accepted";
                            } else {
                                newUser.internal.status = "Waitlisted";
                            }


                            newUser.save(function (err, doc) {
                                if (err) {
                                    // If it failed, return error
                                    console.log(err);
                                    req.flash("error", "An error occurred.");
                                    res.render('register_cornell', {
                                        urlparam: req.params.name,
                                        title: 'Register',
                                        error: req.flash('error'),
                                        input: req.body,
                                        enums: enums,
                                        limit: config.admin.cornell_auto_accept,
                                        college: college
                                    });
                                }
                                else {

                                    if (newUser.internal.status == "Accepted") {
                                        var mailing_list = config.mailchimp.l_cornell_accepted;
                                    } else {
                                        var mailing_list = config.mailchimp.l_cornell_waitlisted;
                                    }

                                    helper.addSubscriber(mailing_list, req.body.email, req.body.firstname, req.body.lastname, function (err, result) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else {
                                            console.log(result);
                                        }

                                        //send email and redirect to home page
                                        req.login(newUser, function (err) {
                                            if (err) {
                                                console.log(err);
                                            }
                                            var template_name = "bigredhackstemplate";

                                            if (newUser.internal.status == "Accepted") {
                                                var email_subject = "BigRed//Hacks Registration Confirmation";
                                                var template_content = [{
                                                    "name": "emailcontent",
                                                    "content": "<p>Hi " + newUser.name.first + " " + newUser.name.last + ",</p><p>" +
                                                    "Thank you for your interest in BigRed//Hacks!  This email is a confirmation " +
                                                    "that you're registered for BigRed//Hacks 2015! " +
                                                    "We'll be sending a lot more logistical information soon." + "</p><p>" +
                                                    "You can log in to our website any time to update your resume " +
                                                    "and view logistic information as we post it." + "</p><p>" +
                                                    "If you haven't already, make sure to like us on Facebook and " +
                                                    "follow us on Twitter!" + "</p><p>" +
                                                    "<p>Cheers,</p>" + "<p>BigRed//Hacks Team </p>"
                                                }];
                                            } else {
                                                var email_subject = "BigRed//Hacks Wait List Confirmation";
                                                var template_content = [{
                                                    "name": "emailcontent",
                                                    "content": "<p>Hi " + newUser.name.first + " " + newUser.name.last + ",</p><p>" +
                                                    "Thank you for your interest in BigRed//Hacks!  This email is a confirmation " +
                                                    "that we have received your application and that you have been added to our wait list." + "</p><p>" +
                                                    "You can log in to our website any time to view your status or update " +
                                                    "your resume.  We'll be sending out wait list status updates soon." + "</p><p>" +
                                                    "If you haven't already, make sure to like us on Facebook and " +
                                                    "follow us on Twitter!" + "</p><p>" +
                                                    "<p>Cheers,</p>" + "<p>BigRed//Hacks Team </p>"
                                                }]
                                            }

                                            var message = {
                                                "subject": email_subject,
                                                "from_email": "info@bigredhacks.com",
                                                "from_name": "BigRed//Hacks",
                                                "to": [{
                                                    "email": newUser.email,
                                                    "name": newUser.name.first + " " + newUser.name.last,
                                                    "type": "to"
                                                }]
                                            };
                                            var async = false;
                                            mandrill_client.messages.sendTemplate({
                                                "template_name": template_name,
                                                "template_content": template_content,
                                                "message": message, "async": async
                                            }, function (result) {
                                                console.log(result);
                                            }, function (e) {
                                                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                            });
                                            res.redirect('/user/dashboard');
                                        })
                                    })
                                }
                            });
                        })
                    });
                }
            });
        });
    });

    /* GET render the login page */
    router.get('/login', function (req, res, next) {
        res.render('login', {
            title: 'Login',
            user: req.user
        });
    });

    /* POST login a user */
    router.post('/login',
        passport.authenticate('local', {
            failureRedirect: '/login',
            failureFlash: true
        }), function (req, res) {
            // successful auth, user is set at req.user.  redirect as necessary.
            if (req.user.role === "admin" || req.user.email === config.admin.email) {
                req.session.np = true; //enable no participation mode
                return res.redirect('/admin');
            }
            else if (req.user.role === "mentor") {
                return res.redirect('/mentor/dashboard');
            }
            else {
                return res.redirect('/user');
            }
        }
    );

    /* GET mentor regsitration */
    router.get('/mentorregistration', function (req, res) {
        res.render("register_mentor",
            {title: "Mentor Registration", enums: enums, error: req.flash('error')});
    });

    /* POST mentor registration */
    router.post('/mentorregistration', function (req, res) {
        var skillList = req.body.skills.split(",");
        for (var i = 0; i < skillList.length; i++) {
            skillList[i] = skillList[i].trim();
        }
        var newMentor = new User({
            name: {
                first: req.body.firstname,
                last: req.body.lastname
            },
            email: req.body.email,
            password: req.body.password,
            role: "mentor",
            mentorinfo: {
                company: req.body.companyDropdown,
                skills: skillList,
                bio: req.body.bio
            }
        });
        newMentor.save(function (err) {
            if (err) {
                // If it failed, return error
                console.log(err);
                req.flash("error", "An error occurred.");
                res.render('register_mentor', {
                    title: 'Mentor Registration',
                    error: req.flash('error'),
                    input: req.body,
                    enums: enums,
                });
            }
            else {
                MentorRequest.find({}).exec(function (err, mentorRequests) {
                    User.find({role: "mentor"}).exec(function (err, mentors) {
                        async.each(mentorRequests, function (mentorRequest, callback) {
                            var numMatchingMentors = 0;
                            async.each(mentors, function (mentor, callback2) {
                                if (_matchingSkills(mentor.mentorinfo.skills, mentorRequest.skills)) {
                                    numMatchingMentors = numMatchingMentors + 1;
                                }
                                callback2();
                            }, function (err) {
                                if (err) console.error(err);
                                else {
                                    mentorRequest.nummatchingmentors = numMatchingMentors;
                                    mentorRequest.save(function (err) {
                                        if (err) console.error(err);
                                        else {
                                            User.findOne({_id: mentorRequest.user.id}, function (err, user) {
                                                if (err) console.error(err);
                                                else {
                                                    var currentMentorRequest = {
                                                        mentorRequestPubid: mentorRequest.pubid,
                                                        nummatchingmentors: numMatchingMentors
                                                    };
                                                    io.sockets.emit("new number of mentors " + user.pubid,
                                                        currentMentorRequest);
                                                    callback();
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }, function (err) {
                            if (err) console.error(err);
                            else {
                                req.login(newMentor, function (err) {
                                    res.redirect('/mentor/dashboard');
                                });
                            }
                        });
                    });
                });
            }
        });
    });

    /**
     * Returns true if there is any intersection between a mentor's skills (mentorSkills) and the user's
     * skills (userSkills), false otherwise
     * @param mentorSkills string array representing mentor's skills
     * @param userSkills string array representing user's skills
     * @returns boolean whether or not there is an intersection between a mentor's skills and the user's skills
     */
    function _matchingSkills(mentorSkills, userSkills) {
        for (var i = 0; i < mentorSkills.length; i++) {
            for (var j = 0; j < userSkills.length; j++) {
                //Check equality of first five characters so there is a match between skills like "mobile app dev"
                //and "mobile applications"
                if (mentorSkills[i].toLowerCase().substring(0, 5) == userSkills[j].toLowerCase().substring(0, 5)) {
                    return true;
                }
            }
        }
        return false;
    }

    /* GET reset password */
    router.get('/resetpassword', function (req, res) {
        if (req.query.token == undefined || req.query.token == "") {
            return res.redirect('/forgotpassword');
        }
        User.findOne({passwordtoken: req.query.token}, function (err, user) {
            if (user == null) {
                return res.redirect('/');
            }
            else {
                return res.render('forgotpassword/resetpass_prompt', {
                    title: 'Reset Password',
                    email: user.email
                });
            }
        });
    });

    /* POST reset password */
    router.post('/resetpassword', function (req, res) {
        User.findOne({passwordtoken: req.query.token}, function (err, user) {
            if (user == null || req.query.token == "" || req.query.token == undefined) {
                return res.redirect('/');
            }
            else {
                req = validator.validate(req, [
                    'password'
                ]);
                var errors = req.validationErrors();
                if (errors) {
                    req.flash('error', 'Password is not valid. 6 to 25 characters required.');
                    res.redirect('/resetpassword?token=' + req.query.token);
                }
                else {
                    user.password = req.body.password;
                    user.passwordtoken = "";
                    user.save(function (err, doc) {
                        if (err) {
                            // If it failed, return error
                            console.log(err);
                            req.flash("error", "An error occurred. Your password has not been reset.");
                            return res.redirect('/forgotpassword');
                        }
                        else {
                            return res.render('forgotpassword/resetpass_done', {
                                title: 'Reset Password',
                                email: user.email
                            });
                        }
                    });
                }
            }
        });
    });


    router.get('/forgotpassword', function (req, res) {
        res.render('forgotpassword/forgotpass_prompt', {
            title: 'Reset Password',
            user: req.user,
            email: req.flash('email')
        });
    });


    router.post('/forgotpassword', function (req, res) {
        User.findOne({email: req.body.email}, function (err, user) {
            if (user == null) {
                req.flash('error', 'No account is associated with that email.');
                res.redirect('/forgotpassword');
            }
            else {
                //fixme possible header error (promises?)
                res.render('forgotpassword/forgotpass_done', {
                    title: 'Reset Password',
                    user: req.user,
                    email: user.email
                });
                user.passwordtoken = uid(15);
                user.save(function (err, doc) {
                    if (err) {
                        // If it failed, return error
                        console.err(err);
                        req.flash("error", "An error occurred.");
                        res.redirect('/forgotpassword')
                    }
                    else {
                        var template_name = "bigredhackstemplate";
                        var passwordreseturl = req.protocol + '://' + req.get('host') + "/resetpassword?token=" + user.passwordtoken;
                        var template_content = [{
                            "name": "emailcontent",
                            "content": "<p>Hello " + user.name.first + " " + user.name.last + ",</p><p>" +
                            "You can reset your password by visiting the following link: </p><p>" +
                            "<a style='color: #B31B1B' href=\"" + passwordreseturl + "\">" + passwordreseturl + "</a></p>" +
                            "<p>If you did not request to change your password, please ignore and delete this email.</p>" +
                            "<p>Cheers,</p>" + "<p>BigRed//Hacks Team </p>"
                        }];
                        var message = {
                            "subject": "BigRed//Hacks Password Reset",
                            "from_email": "info@bigredhacks.com",
                            "from_name": "BigRed//Hacks",
                            "to": [{
                                "email": user.email,
                                "name": user.name.first + " " + user.name.last,
                                "type": "to"
                            }],
                            "important": false,
                            "track_opens": null,
                            "track_clicks": null,
                            "auto_text": null,
                            "auto_html": null,
                            "inline_css": null,
                            "url_strip_qs": null,
                            "preserve_recipients": null,
                            "view_content_link": null,
                            "tracking_domain": null,
                            "signing_domain": null,
                            "return_path_domain": null,
                            "merge": true,
                            "merge_language": "mailchimp"
                        };
                        var async = false;
                        mandrill_client.messages.sendTemplate({
                            "template_name": template_name,
                            "template_content": template_content,
                            "message": message, "async": async
                        }, function (result) {
                            console.log(result);
                        }, function (e) {
                            console.err('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                        });
                    }
                });
            }
        });
    });

    return router;

}
