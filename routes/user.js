"use strict";
var express = require('express');
var router = express.Router();
var enums = require('../models/enum.js');
var _ = require('underscore');

router.get('/', function(req, res, next) {
    res.redirect('/user/dashboard'); //todo there should be some relative redirect
});

/* GET user panel of logged in user */
router.get('/dashboard', function(req, res, next) {

    req.user.populate("internal.teamid", function(err, user) {
        var members = [];
        if (err) {
            console.log(err);
        }

        //initialize members
        if (user.internal.teamid !== null) {
            members = user.internal.teamid.members;
        }

        res.render('dashboard/index', {
            firstname: req.user.name.first,
            lastname: req.user.name.last,
            team: members,
            userid: req.user.pubid,
            error: req.flash('error'),
            success: req.flash('success'), //fixme cleanup
            title: "Dashboard"
        });
    })
});

/* GET edit registration page of logged in user */
router.get('/dashboard/edit', function(req, res, next) {
    var user = _.omit(req.user, 'password'.split(' '));
    res.render('dashboard/edit_app',{
        user: user,
        enums: enums,
        error: req.flash('error'),
        title: "Dashboard | Edit Application" });
});

/* POST add a user to team */
router.post('/team/add', function(req, res, next) {
    var pubid = req.body.userid;
    var user = req.user;

    user.addToTeam(pubid, function(err, resMsg) {
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
router.get('/team/leave', function(req, res, next) {
    req.user.leaveTeam(function(err, resMsg) {
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
