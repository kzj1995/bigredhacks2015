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
            message: req.flash('info'),
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
        message: req.flash('info'),
        title: "Dashboard | Edit Application" });
});

/* POST add a user to team */
router.post('/team/add', function(req, res, next) {
    var pubid = req.body.userid;
    var user = req.user;

    user.addToTeam(pubid, function(err, resMsg) {
        if (err) {
            console.log(err);
            req.flash("info", "An error occurred. Please try again later"); //todo standardize error messages
        }
        else {
            if (typeof resMsg === "string") {
                req.flash("info", resMsg);
            }
            else {
                req.flash("success", "Successfully joined team."); //todo substitute user with name
            }
        }
        res.redirect('/user/dashboard');
    })

});

/* POST leave current team */
router.post('/team/leave', function(req, res, next) {
    user.leaveTeam(function(err, res) {
        if (err) {
            console.log(err);
            req.flash("info", "An error occurred. Please try again later.");
        }
        else {
            if (typeof res === "string") {
                req.flash("info", res);
            }
            else {
                req.flash("success", "Successfully left team.")
            }
        }
    })
});

//todo both add and leave share similar callback function

module.exports = router;
