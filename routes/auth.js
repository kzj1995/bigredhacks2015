var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var _ = require('underscore');
var multiparty = require('multiparty');
var AWS = require('aws-sdk');
var uid = require('uid2');
var fs = require('fs');
var helper = require('../util/routes_helper.js');
var User = require('../models/user.js');
var enums = require('../models/enum.js');
var config = require('../config.js');

var ALWAYS_OMIT = 'password confirmpassword'.split('');
var MAX_FILE_SIZE = 1024 * 1024 * 5;

var RESUME_DEST = 'resume/';
var s3 = new AWS.S3({
    accessKeyId: config.setup.AWS_access_key,
    secretAccessKey: config.setup.AWS_secret_key
});

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
            req.flash('error', err);
            return res.redirect('/register');
        }

        req.body = helper.reformatFields(fields);
        console.log(fields);
        console.log(req.body);
        req.files = files;
        var resume = files.resume[0];
        console.log(resume);
        console.log(resume.headers);

        //todo reorder validations to be consistent with form
        req.body.phonenumber = req.body.phonenumber.toString().replace(/-/g, '');
        req.assert('phonenumber', 'Please enter a valid US phone number').isMobilePhone('en-US');

        req.assert('email', 'Email address is not valid').isEmail();
        req.assert('password', 'Password is not valid. 6 to 25 characters required').len(6, 25);
        req.assert('firstname', 'First name is required').notEmpty();
        req.assert('lastname', 'Last name is required').notEmpty();

        req.assert('genderDropdown', 'Gender is required').notEmpty();
        req.assert('dietary', 'Please specify dietary restrictions').notEmpty();
        req.assert('tshirt', 'Please specify a t-shirt size').notEmpty();
        req.assert('yearDropdown', 'Please specify a graduation year').notEmpty();

        req.assert('major', 'Major is required').len(1, 50);
        req.assert('linkedin', 'LinkedIn URL is not valid').optionalOrisURL();
        req.assert('collegeid', 'Please specify a school.').notEmpty();
        req.assert('q1', 'Question 1 cannot be blank').notEmpty();
        req.assert('q2', 'Question 2 cannot be blank').notEmpty(); //fixme refine this
        //todo check that validations are complete


        var errors = req.validationErrors();
        //console.log(errors);
        if (errors) {
            //todo persist fields
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

            //check file validity
            if (resume.size > MAX_FILE_SIZE) {
                req.flash('error', "File is too big!");
                return res.redirect('/register');

            }
            if (resume.headers['content-type'] !== 'application/pdf') {
                req.flash('error', 'File must be a pdf!');
                return res.redirect('/register');
            }

            //prepare to upload file
            var body = fs.createReadStream(resume.path);
            var fileName = uid(15) + ".pdf";

            s3.putObject({
                Bucket: config.setup.AWS_S3_bucket,
                Key: RESUME_DEST + fileName,
                ACL: 'public-read',
                Body: body,
                ContentType: 'application/pdf'
            }, function (err, data) {
                if (err) {
                    req.flash('error', "File upload failed. :(");
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
                    dietary: req.body.dietary,
                    tshirt: req.body.tshirt,
                    school: {
                        id: req.body.collegeid,
                        name: req.body.college,
                        year: req.body.yearDropdown,
                        major: req.body.major
                    },
                    app: {
                        github: req.body.github,
                        linkedin: req.body.linkedin,
                        resume: fileName,
                        questions: {
                            q1: req.body.q1,
                            q2: req.body.q2
                        }
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
                        //redirect to home page
                        req.login(newUser, function (err) {
                            if (err) {
                                console.log(err);
                            }
                            res.redirect('/user/dashboard');
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

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});


module.exports = router;