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
    //todo populate user team info
    req.user.populate("internal.teamid", function(err, team) {
        if (err) {
            team = [];
        }
        res.render('dashboard/index', {
            firstname: req.user.name.first,
            lastname: req.user.name.last,
            team: team,
            title: "Dashboard"
        });
    })
});

/* GET edit registration page of logged in user */
router.get('/dashboard/edit', function(req, res, next) {
    //todo populate user team info
    var user = _.omit(req.user, 'password'.split(' '));
    res.render('dashboard/edit_app',{
        user: user,
        enums: enums,
        message: req.flash('info'),
        title: "Dashboard | Edit Application" });
});

/* POST add a user to team */
router.post('/team/add', function(req, res, next) {
    var pubid = req.newuserid; //todo implement
    var user = req.user;
    user.addToTeam(pubid, function(err, res) {
        if (err) {
            console.log(err);
            req.flash("info", "An error occurred. Please try again later"); //todo standardize error messages
        }
        else {
            if (typeof res === "string") {
                req.flash("info", res);
            }
            else {
                req.flash("info", "Successfully added user to group."); //todo substitute user with name
            }
        }
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
                req.flash("info", "Successfully left group.")
            }
        }
    })
});

//todo both add and leave share similar callback function

module.exports = router;
