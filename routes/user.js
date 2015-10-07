"use strict";
var express = require('express');
var AWS = require('aws-sdk');
var async = require('async');
var _ = require('underscore');
var multiparty = require('multiparty');

var enums = require('../models/enum.js');
var helper = require('../util/routes_helper.js');
var config = require('../config.js');
var validator = require('../library/validations.js');
var middle = require('../routes/middleware.js');

var Bus = require('../models/bus.js');
var User = require('../models/user.js');
var College = require('../models/college.js');
var Event = require('../models/event.js');
var uid = require('uid2');
var MentorRequest = require('../models/mentor_request');
var Reimbursement = require('../models/reimbursements.js');

var MAX_FILE_SIZE = 1024 * 1024 * 10;
var MAX_BUS_PROXIMITY = 50; //miles

module.exports = function (io) {

    var router = express.Router();

    /* GET user panel of logged in user */
    router.get('/dashboard', function (req, res, next) {

        var params = {Bucket: config.setup.AWS_S3_bucket, Key: 'resume/' + req.user.app.resume};

        async.parallel({
            resumeLink: function (done) {
                /*s3.getSignedUrl('getObject', params, function(err, url) {
                 return done(err, url);
                 });*/
                return done(null, helper.s3url() + "/resume/" + req.user.app.resume);
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
            },
            reimbursement: function (done) {
                Reimbursement.findOne({"college.id": req.user.school.id}, function (err, rem) {
                    if (err || rem == null) {
                        console.log(err);
                        var default_rem = {};
                        default_rem.amount = 150;
                        return done(err, default_rem);
                    }
                    return done(err, rem);

                })
            },
            bus: function (done) {
                _findAssignedOrNearestBus(req, done)
            }
        }, function (err, results) {
            if (err) {
                console.log(err);
            }

            var render_data = {
                user: req.user,
                resumeLink: results.resumeLink,
                team: results.members,
                bus: results.bus,
                reimbursement: results.reimbursement,
                title: "Dashboard"
            };


            if (req.user.internal.cornell_applicant) {
                return res.render('dashboard/results_released/index_cornell', {
                    user: req.user,
                    resumeLink: results.resumeLink,
                    title: "Dashboard"
                })
            }

            if (middle.helper.isDayof()) {
                return res.render('dashboard/index_dayof', render_data);
            } else if (middle.helper.isResultsReleased()) {
                return res.render('dashboard/results_released/index_general', render_data);
            }
            else {
                return res.render('dashboard/index', render_data);
            }

        })
    });

    /* GET edit registration page of logged in user */
    router.get('/dashboard/edit', function (req, res, next) {
        var user = _.omit(req.user, 'password'.split(' '));
        res.render('dashboard/edit_app', {
            user: user,
            enums: enums,
            title: "Edit Application"
        });
    });


    /* POST submit edited user data */
    router.post('/dashboard/edit', middle.requireRegistrationOpen, function (req, res, next) {

        var user = req.user;

        req = validator.validate(req, [
            'passwordOptional', 'phonenumber', 'dietary', 'tshirt', 'yearDropdown', 'major', 'linkedin', 'q1', 'q2', 'anythingelse', 'experienceDropdown'
        ]);
        //console.log(req.validationErrors());
        var errors = req.validationErrors();
        //console.log(errors);
        if (errors) {
            res.render('dashboard/edit_app', {
                user: user,
                title: 'Edit Application',
                message: 'The following errors occurred',
                errors: errors,
                enums: enums
            });
        }
        else {
            if (req.body.password !== "") {
                user.password = req.body.password;
            }
            //console.log(req.body);
            user.phone = req.body.phonenumber;
            user.school.major = req.body.major;
            user.app.questions.q1 = req.body.q1;
            user.app.questions.q2 = req.body.q2;
            user.app.github = req.body.github;
            user.app.linkedin = req.body.linkedin;
            user.app.experience = req.body.experienceDropdown;
            user.logistics.dietary = req.body.dietary;
            user.logistics.tshirt = req.body.tshirt;
            user.logistics.anythingelse = req.body.anythingelse;
            user.save(function (err, doc) {
                if (err) {
                    // If it failed, return error
                    console.log(err);
                    req.flash("error", "An error occurred.");
                    return res.redirect('/dashboard/edit')
                }
                else {
                    //redirect to dashboard home
                    req.flash("success", "Application successfully updated!");
                    res.redirect('/user/dashboard');
                }
            });
            //console.log(user);
        }
    });

    /* POST add a user to team */
    router.post('/team/add', middle.requireRegistrationOpen, function (req, res, next) {
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
    router.get('/team/leave', middle.requireRegistrationOpen, function (req, res, next) {
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
//fixme both add and leave share similar callback function

    /* POST toggle state of team with cornell students */
    router.post('/team/cornell', function (req, res, next) {
        var checked = (req.body.checked === "true");
        var user = req.user;
        user.internal.teamwithcornell = checked;
        user.save(function (err) {
            if (err) {
                res.send(500);
            }
            else res.send(200);
        });
    });


    /* POST upload a new resume*/
    router.post('/updateresume', function (req, res, next) {

        var form = new multiparty.Form({maxFilesSize: MAX_FILE_SIZE});

        form.parse(req, function (err, fields, files) {
            if (err) {
                console.log(err);
                req.flash('error', "Error parsing form.");
                return res.redirect('/user/dashboard');
            }
            //console.log(files);
            var resume = files.resumeinput[0];
            var options = {};
            // make sure the user has had a resume
            if (req.user.app.resume) {
                options.filename = req.user.app.resume;
            }
            options.type = "resume";

            helper.uploadFile(resume, options, function (err, file) {
                if (err) {
                    console.log(err);
                    req.flash('error', "File upload failed. :(");
                }
                if (typeof file === "string") {
                    req.flash('error', file);
                }
                else {
                    req.flash('success', 'Resume successfully updated');
                }
                return res.redirect('/user/dashboard');
            })
        })
    });

    /* POST user bus decision */
    router.post('/busdecision', middle.requireResultsReleased, function (req, res) {
        var user = req.user;
        if (req.body.decision == "signup") {
            Bus.findOne({_id: req.body.busid}, function (err, bus) {
                if (bus.members.length < bus.capacity && user.internal.busid != req.body.busid) {
                    user.internal.busid = req.body.busid;
                    bus.members.push({
                        name: user.name.last + ", " + user.name.first,
                        college: user.school.name,
                        id: user.id
                    });
                    bus.save(function (err) {
                        if (err) {
                            console.log(err);
                            return res.sendStatus(500);
                        }
                        else {
                            user.save(function (err) {
                                if (err) {
                                    console.log(err);
                                    return res.sendStatus(500);
                                }
                                else {
                                    return res.sendStatus(200);
                                }
                            });
                        }
                    });
                }
                else {
                    return res.sendStatus(500);
                }
            });
        }
        else if (req.body.decision == "optout") {
            Bus.findOne({_id: req.body.busid}, function (err, bus) {
                if (user.internal.busid == req.body.busid) {
                    user.internal.busid = null;
                    var newmembers = [];
                    async.each(bus.members, function (member, callback) {
                        if (member.id != user.id) {
                            newmembers.push(member);
                        }
                        callback()
                    }, function (err) {
                        bus.members = newmembers;
                        bus.save(function (err) {
                            if (err) {
                                console.log(err);
                                return res.sendStatus(500);
                            }
                            else {
                                user.save(function (err) {
                                    if (err) {
                                        console.log(err);
                                        return res.sendStatus(500);
                                    }
                                    else {
                                        return res.sendStatus(200);
                                    }
                                });
                            }
                        })
                    });
                }
                else {
                    user.internal.busid = null;
                    user.save(function (err) {
                        if (err) {
                            return res.sendStatus(500);
                        }
                        else {
                            return res.sendStatus(200);
                        }
                    });
                }
            });
        }
        else {
            return res.sendStatus(500);
        }
    });

    /* POST user rsvp */
    router.post('/rsvp', middle.requireResultsReleased, function (req, res) {
        var form = new multiparty.Form({maxFilesSize: MAX_FILE_SIZE});

        form.parse(req, function (err, fields, files) {
            if (err) {
                console.log(err);
                req.flash('error', "Error parsing form.");
                return res.redirect('/user/dashboard');
            }

            //console.log(files);
            if (files.receipt) {
                var receipt = files.receipt[0];
            }

            req.body = helper.reformatFields(fields);

            if (req.body.rsvpDropdown == "yes") {
                req.user.internal.going = true;
            }
            else if (req.body.rsvpDropdown == "no") {
                req.user.internal.going = false;
            }

            //travel receipt
            _findAssignedOrNearestBus(req, function (err, bus) {
                if (err) {
                    console.log(err);
                }
                //travel receipt required if no bus
                if (bus == null) {
                    //fail if no receipt uploaded
                    if (!receipt) {
                        req.flash('error', "Please upload a travel receipt.");
                        return res.redirect('/user/dashboard');
                    }

                    helper.uploadFile(receipt, {type: "receipt"}, function (err, file) {
                        if (err) {
                            console.log(err);
                            req.flash('error', "File upload failed. :(");
                        }
                        if (typeof file === "string") {
                            req.flash('error', file);
                        }
                        else {
                            //console.log(file);
                            req.flash('success', 'We have received your response!');
                            req.user.internal.travel_receipt = file.filename;
                            req.user.save(function (err) {
                                if (err) {
                                    console.log(err);
                                }
                                return res.redirect('/user/dashboard');
                            });
                        }
                        return res.redirect('/user/dashboard');
                    })
                }
                else {
                    /*
                     //remove user from bus
                     //bus.members = _.without(bus.members, _.findWhere(bus.members, {id: req.user.id}));
                     _.omit(bus, 'message');
                     /*bus.save(function (err, res) {
                     if (err) {
                     console.log(err);
                     }
                     req.flash('success', 'We have received your response!');
                     req.user.save(function (err) {
                     if (err) {
                     console.log(err);
                     }
                     return res.redirect('/user/dashboard');
                     });
                     }) */

                    req.flash('success', 'We have received your response!');
                    req.user.save(function (err) {
                        if (err) {
                            console.log(err);
                        }
                        return res.redirect('/user/dashboard');
                    });
                }
            });
        })
    });

    router.get('/travel', middle.requireResultsReleased, function (req, res, next) {
        res.render('dashboard/travel', {
            title: "Travel Information"
        });
    });

    /* GET mentor request page */
    router.get('/dashboard/requestmentor', function (req, res) {
        MentorRequest.find({'user.id': req.user.id}).exec(function (err, mentorRequests) {
            res.render('dashboard/request_mentor', {
                title: "Ask For Help",
                mentorRequests: mentorRequests,
                user: req.user
            });
        });
    });

    /* Handles a user-triggered event */
    io.on('connection', function (socket) {

        //receive event of a user sending a new mentor request
        socket.on('new mentor request', function (mentorRequest) {
            User.findOne({pubid: mentorRequest.userpubid}, function (err, theUser) {
                var splitSkills = mentorRequest.requestSkills.split(",");
                var skillList = [];
                for (var i = 0; i < splitSkills.length; i++) {
                    if (splitSkills[i].trim() != "") {
                        skillList.push(splitSkills[i].trim());
                    }
                }
                var newMentorRequest = new MentorRequest({
                    pubid: uid(15),
                    user: { //user who makes the mentorship request
                        name: theUser.name.first + " " + theUser.name.last,
                        id: theUser.id
                    },
                    description: mentorRequest.requestDescription,
                    skills: skillList,
                    requeststatus: "Unclaimed",
                    location: mentorRequest.requestLocation
                });
                User.find({role: 'mentor'}).exec(function (err, mentors) {
                    var numMatchingMentors = 0;
                    async.each(mentors, function (mentor, callback) {
                        var currentRequest = newMentorRequest.toObject();
                        currentRequest.match = "no";
                        if (_matchingSkills(mentor.mentorinfo.skills, currentRequest.skills)) {
                            numMatchingMentors = numMatchingMentors + 1;
                            currentRequest.match = "yes";
                        }
                        io.emit('mentor ' + mentor.pubid, currentRequest);
                        callback();
                    }, function (err) {
                        if (err) console.log(err);
                        else {
                            newMentorRequest.nummatchingmentors = numMatchingMentors;
                            newMentorRequest.save(function (err) {
                                if (err) console.error(err);
                                else {
                                    io.emit('user ' + mentorRequest.userpubid, newMentorRequest);
                                }
                            });
                        }
                    });
                });
            });
        });

        //receive event of a user canceling a mentor request
        socket.on('cancel mentor request', function (cancelRequest) {
            MentorRequest.findOne({pubid: cancelRequest.mentorRequestPubid}, function (err, mentorRequest) {
                if (err) console.error(err);
                else {
                    User.find({role: 'mentor'}).exec(function (err, mentors) {
                        async.each(mentors, function (mentor, callback) {
                            if (_matchingSkills(mentor.mentorinfo.skills, mentorRequest.skills)) {
                                io.emit('cancel request ' + mentor.pubid, cancelRequest);
                            }
                            callback();
                        }, function (err) {
                            if (err) console.log(err);
                            else {
                                MentorRequest.remove({pubid: cancelRequest.mentorRequestPubid}, function (err) {
                                    if (err) console.log(err);
                                });
                            }
                        });
                    });
                }
            });
        });

        //receive event of a user sending a mentor request to completion
        socket.on('complete mentor request', function (completeRequest) {
            MentorRequest.findOne({pubid: completeRequest.mentorRequestPubid}, function (err, mentorRequest) {
                if (err) console.error(err);
                else {
                    mentorRequest.requeststatus = "Completed";
                    mentorRequest.save(function (err) {
                        if (err) console.error(err);
                        else {
                            User.find({role: 'mentor'}).exec(function (err, mentors) {
                                async.each(mentors, function (mentor, callback) {
                                    if (_matchingSkills(mentor.mentorinfo.skills, mentorRequest.skills)) {
                                        io.emit('complete request ' + mentor.pubid, completeRequest);
                                    }
                                    callback();
                                }, function (err) {
                                    if (err) console.log(err);
                                });
                            });
                        }
                    })
                }
            });
        });

    });

    /* GET static travel page information */
    router.get('/travel', middle.requireResultsReleased, function (req, res, next) {
        res.render('dashboard/travel', {
            user: req.user,
            title: "Travel Information"
        });
    });

    /* GET mentor list page */
    router.get('/dashboard/mentorlist', function (req, res) {
        User.find({role: "mentor"}).sort("mentorinfo.company").exec(function (err, mentors) {
            _getSortedCompanyImages(req, function (sortedCompanyList, sortedCompanyImageList) {
                var companyCount = []; //will contain the number of mentors for each company
                async.eachSeries(sortedCompanyList, function (company, callback) {
                    User.aggregate([
                        {$match: {'mentorinfo.company': company}},
                        {$group: {_id: null, count: {$sum: 1}}}
                    ], function (err, result) {
                        if (err) {
                            console.error(err);
                        }
                        if (result.length == 0) {
                            companyCount.push(0);
                        } else {
                            companyCount.push(result[0].count);
                        }
                        callback(null);
                    });
                }, function (err) {
                    if (err) {
                        console.error(err);
                    }
                    res.render('dashboard/mentor_list', {
                        title: "Mentor List",
                        mentors: mentors,
                        companyCount: companyCount,
                        companyList: sortedCompanyList,
                        companyImages: sortedCompanyImageList,
                        user: req.user
                    });
                });
            });
        });
    });

    /* GET schedule page */
    router.get('/dashboard/schedule', middle.requireDayof, function (req, res) {
        res.render('dashboard/schedule', {
            title: "Schedule",
            user: req.user
        });
    });

    /* GET all events on the schedule */
    router.get('/allevents', middle.requireDayof, function (req, res) {
        Event.find({}).sort({startday: 1, starttimeminutes: 1}).exec(function (err, events) {
            var dayCount = []; //will contain the number of events for each day
            async.eachSeries(enums.schedule.days, function (currentDay, callback) {
                Event.aggregate([
                    {$match: {startday: currentDay}},
                    {$group: {_id: null, count: {$sum: 1}}}
                ], function (err, result) {
                    if (err) {
                        console.error(err);
                    }
                    if (result.length == 0) {
                        dayCount.push(0);
                    } else {
                        dayCount.push(result[0].count);
                    }
                    callback(null);
                });
            }, function (err) {
                if (err) {
                    console.error(err);
                }
                var schedule = {
                    events: events,
                    dayCount: dayCount,
                    days: enums.schedule.days
                }
                res.json(schedule);
            });
        });
    });

    /* POST that an event's notification has been shown */
    router.post('/notificationshown', function (req, res) {
        Event.findOne({_id: req.body.eventId}, function (err, event) {
            event.notificationShown = true;
            event.save(function (err) {
                if (err) {
                    return res.sendStatus(500);
                }
                else {
                    return res.sendStatus(200);
                }
            })
        })
    })

    /* GET logout the current user */
    router.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    /**
     * Sorts the company list alphabetically, and then sorts the image list based on that order
     * @param callback passed in to function which takes in as parameters the sorted company list and sorted image list
     */
    function _getSortedCompanyImages(req, callback) {
        var companyImages = enums.mentor.companyimage.slice(0);
        var companyList = enums.mentor.companyname.slice(0);
        var companyToImage = {}; //dictionary with mappings from each company's name to their image
        for (var i = 0; i < companyList.length; i++) {
            companyToImage[companyList[i]] = req.protocol + '://' + req.get('host') + "/img/logos/" + companyImages[i];
        }
        var sortedCompanyList = companyList.sort();
        var sortedCompanyImages = [];
        //Create sorted company images list using dictionary of mappings from a company's name to their image
        for (var j = 0; j < sortedCompanyList.length; j++) {
            sortedCompanyImages.push(companyToImage[sortedCompanyList[j]]);

        }
        callback(sortedCompanyList, sortedCompanyImages);
    }

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
                if (mentorSkills[i].toLowerCase().substring(0, 5) == userSkills[j].toLowerCase().substring(0, 5)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Return distance in miles between two coordinates/points
     * @param coordinate1 [lon,lat] coordinate pair of first point
     * @param coordinate2 [lon,lat] coordinate pair of second point
     * @returns {number} represents distance in miles between the two colleges
     */
    function _distanceBetweenPointsInMiles(coordinate1, coordinate2) {
        var radius = 3958.754641; // Radius of the earth in miles
        var dLat = (Math.PI / 180) * (coordinate2[1] - coordinate1[1]);
        var dLon = (Math.PI / 180) * (coordinate2[0] - coordinate1[0]);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((Math.PI / 180) * (coordinate1[1])) *
            Math.cos((Math.PI / 180) * (coordinate2[1])) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var distance = radius * c; // Distance in miles
        return distance;
    }

    /**
     * Find the bus assigned to the user or the nearest bus within a certain threshold. Returns the bus object, or null if no bus exists
     * @param done callback (err, res)
     * @private
     */
    function _findAssignedOrNearestBus(req, done) {
        var userbus = null;
        var closestdistance = null;
        Bus.find({}).exec(function (err, buses) {
            if (err) {
                console.log(err);
            }
            //todo optimize this (see if it's possible to perform this operation in a single aggregation
            async.each(buses, function (bus, callback) {
                async.each(bus.stops, function (stop, inner_callback) {
                    College.find({$or: [{'_id': stop.collegeid}, {'_id': req.user.school.id}]},
                        function (err, colleges) {
                            //The case when the query returns only one college because the college of the bus's stop
                            //is the same as the user's college
                            if (colleges.length == 1) {
                                userbus = bus;
                                userbus.message = "a bus stops at your school:";
                                closestdistance = 0;
                            }
                            //The other case when the query returns two colleges because the college of the bus's
                            //stop is not the same as the user's college.
                            else if (colleges.length == 2) {
                                //find the distance between two colleges
                                var distanceBetweenColleges = _distanceBetweenPointsInMiles(
                                    colleges[0].loc.coordinates, colleges[1].loc.coordinates);
                                if (distanceBetweenColleges <= MAX_BUS_PROXIMITY) {
                                    if (closestdistance == null || distanceBetweenColleges < closestdistance) {
                                        userbus = bus;
                                        //properly round to two decimal points
                                        var roundedDistance = Math.round((distanceBetweenColleges + 0.00001) *
                                            100) / 100;
                                        userbus.message = "a bus stops near your school at " + stop.collegename +
                                        " (roughly " + roundedDistance + " miles away):";
                                        closestdistance = distanceBetweenColleges;
                                    }
                                }
                            }
                            inner_callback(err);
                        });
                }, function (err) {
                    callback(err);
                });
            }, function (err) {
                if (err) {
                    console.log(err);
                }
                done(null, userbus);
                //temporarily disable
                //assumptions to check: no bus exists, bus has a bus captain, bus does not have more than one bus captaion
                //todo consider storing bus captain info in bus
                //todo optimize, query  { role: "Bus Captain", internal.busid: xxx } instead
                /*
                 async.each(userbus.members, function (member, finalcallback) {
                 User.findOne({_id: member.id}, function (err, user) {
                 if (err) {
                 console.log(err);
                 }
                 else if (user.role == "bus captain") {
                 userbus.buscaptain = user;
                 }
                 finalcallback();
                 });
                 }, function (err) {
                 return done(null, userbus);
                 });
                 */
            });
        });
    }

    return router;
}