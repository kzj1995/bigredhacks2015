var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var _ = require('underscore');
var multiparty = require('multiparty');

var helper = require('../util/routes_helper.js');
var User = require('../models/user.js');
var enums = require('../models/enum.js');
var validator = require('../library/validations.js');

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

router.get('/register', function (req, res) {
    res.render("register",
        {title: "Register", enums: enums, error: req.flash('error')});
});

router.post('/register', function (req, res) {
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

            helper.uploadResume(resume, null, function (err, file) {
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
                    }
                });
                newUser.save(function (err, doc) {
                    if (err) {
                        // If it failed, return error
                        console.log(err);
                        req.flash("error", "An error occurred.");
                        res.render('register', {
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
                                    "content": "<p>Hello " + newUser.name.first + " " + newUser.name.last + ",</p><p>" +
                                    "Thank you so much for registering for BigRed//Hacks. We will keep you posted " +
                                    "on the status of your application and other relevant information." + "</p><p>" +
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


router.get('/login', function (req, res, next) {
    res.render('login', {title: 'Login', user: req.user, error: req.flash('error'), email: req.flash('email')});
});


router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/user',
        failureRedirect: '/login',
        failureFlash: true
    })
);

router.get('/resetpass?', function (req, res) {
    User.findOne({passwordtoken: req.query.token}, function (err, user) {
        if (user == null) {
            res.redirect('/');
        }
        else {
            res.render('forgotpassword', {
                title: 'Reset Password',
                page: 3,
                error: req.flash('error'),
                email: user.email
            });
        }
    });
});

router.post('/resetpass?', function (req, res) {
    User.findOne({passwordtoken: req.query.token}, function (err, user) {
        if (user == null || req.query.token == "" || req.query.token == undefined) {
            res.redirect('/');
        }
        else {
            req = validator.validate(req, [
                'password'
            ]);
            var errors = req.validationErrors();
            if (errors) {
                req.flash('error', 'Password is not valid. 6 to 25 characters required.');
                res.redirect('/resetpass?token=' + req.query.token);
            }
            else {
                user.password = req.body.password;
                user.passwordtoken = "";
                user.save(function (err, doc) {
                    if (err) {
                        // If it failed, return error
                        console.log(err);
                        req.flash("error", "An error occurred.");
                        res.redirect('/login')
                    }
                    else {
                        res.render('forgotpassword', {
                            title: 'Reset Password',
                            page: 4,
                            error: req.flash('error'),
                            email: user.email
                        });
                    }
                });
            }
        }
    });
});

router.get('/resetpassword', function (req, res) {
    res.render('forgotpassword', {
        title: 'Reset Password',
        page: 1,
        user: req.user,
        error: req.flash('error'),
        email: req.flash('email')
    });
});

router.post('/resetpassword', function (req, res) {
    User.findOne({email: req.body.email}, function (err, user) {
        if (user == null) {
            req.flash('error', 'No account is associated with that email.');
            res.render('forgotpassword', {
                title: 'Reset Password',
                page: 1,
                user: req.user,
                error: req.flash('error'),
                email: req.flash('email')
            });
        }
        else {
            res.render('forgotpassword', {
                title: 'Reset Password',
                page: 2,
                user: req.user,
                error: req.flash('error'),
                email: user.email
            });
            user.passwordtoken = uid(15);
            user.save(function (err, doc) {
                if (err) {
                    // If it failed, return error
                    console.log(err);
                    req.flash("error", "An error occurred.");
                    res.redirect('/')
                }
                else {
                    var passwordreseturl = req.protocol + '://' + req.get('host') + "/resetpass?token=" + user.passwordtoken
                    var htmlcontent = "<p>Hello " + user.name.first + " " + user.name.last + ",</p><p>" +
                        "You can reset your password by visiting the following link: </p><p>" +
                        "<a href=\"" + passwordreseturl + "\">" + passwordreseturl + "</a></p>" +
                        "<p>Cheers,</p>" + "<p>BigRed//Hacks Team </p>";
                    var message = {
                        "html": htmlcontent,
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
                    mandrill_client.messages.send({"message": message, "async": async}, function (result) {
                        console.log(result);
                    }, function (e) {
                        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                    });
                }
            });
        }
    });
});

module.exports = router;