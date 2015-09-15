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
    router.get('/dashboard/requestsqueue', function (req, res) {
        var user = req.user;
        MentorRequest.find({}).exec(function(err, mentorRequests) {
            var matchingRequests = [];
            async.each(mentorRequests, function(mentorRequest, callback) {
                if(_matchingSkills(user.mentorinfo.skills, mentorRequest.skills)) {
                    matchingRequests.push(mentorRequest);
                }
                callback();
            }, function(err) {
                if (err) console.error(err);
                else {
                    res.render('mentor/requests_queue', {
                        user: user,
                        mentorRequests: matchingRequests,
                        title: "Requests Queue"
                    });
                }
            });
        });
    });

    /* Handles a mentor-triggered event */
    io.on('connection', function (socket) {
        //receive event of a mentor claiming or unclaiming a user request
        socket.on('set request status', function (setRequestStatus) {
            MentorRequest.findOne({pubid: setRequestStatus.mentorRequestPubid}, function (err, mentorRequest) {
                if (err) console.error(err);
                else {
                    User.findOne({pubid: setRequestStatus.mentorPubid}, function (err, mentorOfRequest) {
                        if (setRequestStatus.newStatus == "Claimed") {
                            mentorRequest.mentor.name = mentorOfRequest.name.first + " " + mentorOfRequest.name.last;
                            mentorRequest.mentor.company = mentorOfRequest.mentorinfo.company;
                            mentorRequest.mentor.id = mentorOfRequest.id;
                            mentorRequest.requeststatus = "Claimed";
                        } else if (setRequestStatus.newStatus == "Unclaimed") {
                            mentorRequest.mentor.name = null;
                            mentorRequest.mentor.company = null;
                            mentorRequest.mentor.id = null;
                            mentorRequest.requeststatus = "Unclaimed";
                        }
                        mentorRequest.save(function (err) {
                            if (err) console.error(err);
                            else {
                                var requestStatus = {
                                    mentorRequestPubid: setRequestStatus.mentorRequestPubid,
                                    mentorPubid: setRequestStatus.mentorPubid,
                                    newStatus: setRequestStatus.newStatus,
                                    numpossiblementors: mentorRequest.numpossiblementors,
                                    mentorInfo: {
                                        name: mentorRequest.mentor.name,
                                        company: mentorRequest.mentor.company
                                    }
                                };
                                User.findOne({_id: mentorRequest.user.id}, function (err, user) {
                                    if (err) console.error(err);
                                    else {
                                        User.find({role: 'mentor'}).exec(function (err, mentors) {
                                            if (err) console.error(err);
                                            else {
                                                async.each(mentors, function (mentor, callback) {
                                                    if (_matchingSkills(mentor.mentorinfo.skills, mentorRequest.skills)) {
                                                        io.emit('new request status ' + mentor.pubid, requestStatus);
                                                    }
                                                    callback();
                                                }, function (err) {
                                                    if (err) console.error(err);
                                                    else {
                                                        io.emit('new request status ' + user.pubid, requestStatus);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
            });
        });
    });

    /**
     * Returns true if there is any intersection between a mentor's skills (mentorSkills) and the user's
     * skills (userSkills), false otherwise
     * @param mentorSkills string array representing mentor's skills
     * @param userSkills string array representing user's skills
     * @returns boolean whether or not there is an intersection between a mentor's skills and the user's skills
     */
    function _matchingSkills(mentorSkills, userSkills) {
        for (var i = 0; i < mentorSkills.length; i++) {
            for (var j = 0; j < userSkills.length; j++) {
                //Check equality of first five characters so there is a match between skills like "mobile app dev"
                //and "mobile applications"
                if (mentorSkills[i].toLowerCase().substring(0, 5) == userSkills[j].toLowerCase().substring(0,5)) {
                    return true;
                }
            }
        }
        return false;
    }

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