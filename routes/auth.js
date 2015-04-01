var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var user = require('../models/user.js');

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function (email, password, done) {
        User.findOne({email: email}, function (err, user) {
            if (err) {
                return done(err);
            }
            //@todo: change to incorrect email/password
            if (!user) {
                return done(null, false, {message: 'Incorrect email.'});
            }
            if (!user.comparePassword(password)) {
                return done(null, false, {message: 'Incorrect password.'});
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

//todo don't think this gets used
exports.loginCallback = function (req, res) {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res);
};


router.get('/register', function (req, res) {
    res.render("register", {title: "Register"});
});

router.post('/register', function (req, res) {
    console.log(req.body);
    //todo check new user creation
    //todo might make sense to move creation to model in event of schema changes
    //todo cleanup xD
    var newUser = new User({
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


    newUser.save(function (err,doc){
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        }
        else {
            //redirect to home page
            res.redirect(301, "/");
        }
    });
    //var user = new User({ email: req.body.email, password: req.body.password, name: req.body.name });
    throw new Error('Implement me!');
    user.save(function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('user: ' + user.email + " saved.");
            req.login(user, function (err) {
                if (err) {
                    console.log(err);
                }
                //todo redirect
                //return res.redirect('/dashboard');
            });
        }
    });
});

router.get('/login', function (req, res, next) {
    res.render('login', {user: req.user, message: req.session.messages});
});

router.post('/login',
    passport.authenticate('local', {failureRedirect: '/login', failureFlash: true}),
    function (req, res) {
        res.redirect('/');
    });
/*
router.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err)
        }
        if (!user) {
            req.session.messages = [info.message];
            return res.redirect('/login')
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect('/');
        });
    })(req, res, next);
});
*/
router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

exports.logout = function (req, res) {
    req.logout();
    res.redirect('/');
};

module.exports = router;