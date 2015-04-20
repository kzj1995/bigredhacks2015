var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var _ = require('underscore');
var User = require('../models/user.js');

var enums = require('../models/enum.js');
var ALWAYS_OMIT = 'password confirmpassword'.split('');

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
                return done(null, false, function() {
                    req.flash('email',email)
                    req.flash('error','Incorrect username or email.');
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
    console.log(req.body);

    //todo reorder validations to be consistent with form
    req.body.phonenumber = req.body.phonenumber.replace(/-/g,'');
    req.assert('phonenumber','Please enter a valid US phone number').isMobilePhone('en-US');

    req.assert('email', 'Email address is not valid').isEmail();
    req.assert('password', 'Password is not valid. 6 to 25 characters required').len(6, 25);
    req.assert('firstname', 'First name is required').notEmpty();
    req.assert('lastname', 'Last name is required').notEmpty();

    req.assert('genderDropdown', 'Gender is required').notEmpty();
    req.assert('dietary', 'Please specify dietary restrictions').notEmpty();
    req.assert('tshirt', 'Please specify a t-shirt size').notEmpty();
    req.assert('yearDropdown', 'Please specify a graduation year').notEmpty();

    req.assert('major', 'Major is required').len(1,50);
    req.assert('linkedin', 'LinkedIn URL is not valid').optionalOrisURL();
    req.assert('collegeid','Please specify a school.').notEmpty();
    req.assert('q1', 'Question 1 cannot be blank').notEmpty();
    req.assert('q2', 'Question 2 cannot be blank').notEmpty(); //fixme refine this
    //todo check that validations are complete



    var errors = req.validationErrors();
    console.log(errors);

    if (errors) {
        //todo persist fields
        var errorParams = errors.map(function(x) {
            return x.param;
        });
        req.body = _.omit(req.body,errorParams.concat(ALWAYS_OMIT));
        res.render('register', {
            title: 'Register', message: 'The following errors occurred', errors: errors, input: req.body, enums: enums
        });
    }
    else {
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
            school :{
                id: req.body.collegeid,
                name: req.body.college,
                year: req.body.yearDropdown,
                major: req.body.major
            },
            app: {
                github: req.body.github,
                linkedin: req.body.linkedin,
                resume: req.body.resume,
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
    }
});


router.get('/login', function (req, res, next) {
    res.render('login', {title: 'Login', user: req.user, error: req.flash('error'), email: req.flash('email')});
});

//todo persist fields
router.post('/login',
    passport.authenticate('local', { successRedirect: '/user',
        failureRedirect: '/login',
        failureFlash: true })
);

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;