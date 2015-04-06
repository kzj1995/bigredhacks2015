var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user.js');

var enums = require('../models/enum.js');

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
                return done(null, false, req.flash('info', 'Incorrect email/password.'));
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
        {title: "Register", enums: enums, message: req.flash('info')});
});

router.post('/register', function (req, res) {
    console.log(req.body);
    req.assert('firstname', 'First name is required').notEmpty();
    req.assert('lastname', 'Last name is required').notEmpty();
    req.assert('email', 'Email address is not valid').isEmail();
    req.assert('password', '6 to 20 characters required').len(6,20);
    req.assert('phone', 'Phone number is not valid').isMobilePhone();
    req.assert('major', 'Major is required').notEmpty();
    req.assert('github', 'GitHub URL is not valid').isURL();
    req.assert('linkedin'),'LinkedIn URL is not valid'.isURL();

    //todo check the minlength of the essays

    var errors = req.validationErrors();
    if (errors) {
        res.render('register', {
            title: 'Register', message: 'The following errors occurred', errors: errors
        });
    }
    else {
        res.render('dashboard'), {
            title: 'Dashboard', message: '', errors: {}
        };
    };


    //todo might make sense to move creation to model in event of schema changes
    var newUser = new User({
        name: {
            first: req.body.firstname,
            last: req.body.lastname
        },
        email: req.body.email,
        password: req.body.password,
        gender: req.body.genderDropdown,
        phone: req.body.phonenumber,
        collegeid: req.body.collegeid,
        year: req.body.yearDropdown,
        major: req.body.major,
        dietary: req.body.dietary,
        tshirt: req.body.tshirt,
        application: {
            github: req.body.github,
            linkedin: req.body.linkedin,
            resume: req.body.resume,
            question: {
                q1: req.body.q1,
                q2: req.body.q2
            }
        }
    });


    newUser.save(function (err, doc) {
        if (err) {
            // If it failed, return error
            console.log(err);
            req.flash("info", "An error occurred."); //todo persist fields
            res.redirect("/register");
        }
        else {
            //redirect to home page
            req.login(newUser, function (err) {
                if (err) {
                    console.log(err);
                }
                res.redirect(301, "/");
            })
        }
    });
});

router.get('/login', function (req, res, next) {
    res.render('login', {user: req.user, message: req.flash('info')});
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