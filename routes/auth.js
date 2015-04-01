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
    res.render("register");
});

router.post('/register', function (req, res) {
    console.log(req.body);
    //todo implement new user creation
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
}