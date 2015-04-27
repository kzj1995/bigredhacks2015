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
                /*s3.getSignedUrl('getObject', params, function(err, url) {
                    return done(err, url);
                });*/
                return done(null, "https://" + config.setup.AWS_S3_bucket + ".s3.amazonaws.com/resume/" + req.user.app.resume);
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
