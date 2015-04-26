"use strict";
var express = require('express');
var router = express.Router();
var enums = require('../models/enum.js');
var AWS = require('aws-sdk');
var async = require('async');
var _ = require('underscore');

var config = require('../config.js');

var s3 = new AWS.S3({
    accessKeyId: config.setup.AWS_access_key,
    secretAccessKey: config.setup.AWS_secret_key
});

router.get('/', function (req, res, next) {
    return res.redirect('/user/dashboard'); //todo there should be some relative redirect
});

/* GET user panel of logged in user */
router.get('/dashboard', function (req, res, next) {

    var params = {Bucket: config.setup.AWS_S3_bucket, Key: 'resume/' + req.user.app.resume};
    var resumeLink;

        async.parallel({
            resumeLink: function (done) {
                s3.getSignedUrl('getObject', params, function(err, url) {
                    return done(err, url);
                });
            },
            members: function (done) {
                req.user.populate("internal.teamid", function (err, user) {
                    var members = [];
                    if (err) {
                        return done(err);
                    }

                    //initialize members
                    if (user.internal.teamid !== null) {
                        members = user.internal.teamid.members;
                    }
                    return done(err, members);
                })
            }
        }, function(err, results) {
            if (err) {
                console.log(err);
            }
            res.render('dashboard/index', {
                name: req.user.name,
                resumeLink: results.resumeLink,
                team: results.members,
                userid: req.user.pubid,
                error: req.flash('error'),
                success: req.flash('success'),
                title: "Dashboard"
            });
        })
});

/* GET edit registration page of logged in user */
router.get('/dashboard/edit', function (req, res, next) {
    var user = _.omit(req.user, 'password'.split(' '));
    res.render('dashboard/edit_app', {
        user: user,
        enums: enums,
        error: req.flash('error'),
        title: "Edit Application"
    });
});


router.post('/dashboard/edit', function (req, res, next){

    var user = req.user;
    console.log(req.body);
    req.body.phonenumber = req.body.phonenumber.replace(/-/g, '');
    req.assert('phonenumber', 'Please enter a valid US phone number').isMobilePhone('en-US');

    req.assert('genderDropdown', 'Gender is required').notEmpty();
    req.assert('dietary', 'Please specify dietary restrictions').notEmpty();
    req.assert('tshirt', 'Please specify a t-shirt size').notEmpty();

    req.assert('major', 'Major is required').len(1, 50);
    req.assert('linkedin', 'LinkedIn URL is not valid').optionalOrisURL();
    req.assert('q1', 'Question 1 cannot be blank').notEmpty();
    req.assert('q2', 'Question 2 cannot be blank').notEmpty();
    var errors = req.validationErrors();
    console.log(errors);
    if (errors) {
        //todo persist fields
        var errorParams = errors.map(function (x) {
            return x.param;
        });
        res.render('dashboard/edit_app', {
            user: user,
            enums: enums,
            error: req.flash('error'),
            title: "Edit Application"
        });
    }
    else{
        user.phone = req.body.phonenumber;
        user.gender = req.body.genderDropdown;
        user.school.major = req.body.major;
        user.app.questions.q1 = req.body.q1;
        user.app.questions.q2 = req.body.q2;
        user.app.github = req.body.github;
        user.app.linkedin = req.body.linkedin;
        user.dietary = req.body.dietary;
        user.tshirt = req.body.tshirt;
        user.save(function (err, doc) {
            if (err) {
                // If it failed, return error
                console.log(err);
                req.flash("error", "An error occurred.");
                res.render('dashboard/edit_app', {
                    user: user,
                    enums: enums,
                    error: req.flash('error'),
                    title: "Edit Application"
                });
            }
            else {
                //redirect to home page
                res.redirect('/user/dashboard');
            }
        });
        console.log(user);
    }
});

/* POST add a user to team */
router.post('/team/add', function (req, res, next) {
    var pubid = req.body.userid;
    var user = req.user;

    user.addToTeam(pubid, function (err, resMsg) {
        if (err) {
            console.log(err);
            req.flash("error", "An error occurred. Please try again later"); //todo standardize error messages
        }
        else {
            if (typeof resMsg === "string") {
                req.flash("error", resMsg);
            }
            else {
                req.flash("success", "Successfully joined team."); //todo substitute user with name
            }
        }
        res.redirect('/user/dashboard');
    })

});

/* GET leave current team */
router.get('/team/leave', function (req, res, next) {
    req.user.leaveTeam(function (err, resMsg) {
        if (err) {
            console.log(err);
            req.flash("error", "An error occurred. Please try again later.");
        }
        else {
            if (typeof res === "string") {
                req.flash("error", res);
            }
            else {
                req.flash("success", "Successfully left team.")
            }
        }
        res.redirect('/user/dashboard');
    })
});

//todo both add and leave share similar callback function

module.exports = router;
