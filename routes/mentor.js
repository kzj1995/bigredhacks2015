"use strict";
var express = require('express');
var async = require('async');
var User = require('../models/user.js');
var enums = require('../models/enum.js');
var MentorRequest = require('../models/mentor_request');

module.exports = function (io) {
    var router = express.Router();

    /* GET dashboard index page */
    router.get('/', function (req, res, next) {
        return res.redirect('/mentor/dashboard');
    });

    /* GET dashboard home of logged in mentor */
    router.get('/dashboard', function (req, res, next) {
        res.render('mentor/index', {
            user: req.user,
            enums: enums,
            error: req.flash('error'),
            title: "Dashboard Home"
        });
    });

    /* POST update mentor information */
    router.post('/updateinformation', function (req, res) {
        var user = req.user;

        var skillList = req.body.skills.split(",");
        for (var i = 0; i < skillList.length; i++) {
            skillList[i] = skillList[i].trim();
        }
        user.mentorinfo.skills = skillList;
        user.mentorinfo.bio = req.body.bio;
        user.save(function(err) {
            if (err) {
                console.error(err);
                req.flash("error", "An error occurred. Try updating again in a bit.");
            }
            else {
                //redirect to dashboard home
                req.flash("success", "Information updated successfully.");
            }
            res.redirect('/mentor/dashboard');
        })
    });

    /* GET see requests queue of mentor */
    router.get('/requestsqueue', function (req, res) {

    });

    /* Handles a mentor-triggered event */
    io.on('connection', function (socket) {
        //receive event of a mentor claiming a user request
        socket.on('claim request', function (mentorRequest) {

        });
    });

    /* POST set mentor request as completed */
    router.post('/completerequest', function (req, res) {
        MentorRequest.findOne({pubid: req.body.mentorRequestPubId}, function (err, mentorRequest) {
            if (err) {
                console.log(err);
                return res.sendStatus(500);
            }
            else {
                mentorRequest.requeststatus = "Completed";
                mentorRequest.save(function (err) {
                    if (err) {
                        console.log(err);
                        return res.sendStatus(500);
                    }
                    else return res.sendStatus(200);
                })
            }
        });
    });

    /* GET logout the current mentor */
    router.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    return router;
}