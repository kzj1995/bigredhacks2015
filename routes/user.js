"use strict";
var express = require('express');
var router = express.Router();
var enums = require('../models/enum.js');
var AWS = require('aws-sdk');
var async = require('async');
var _ = require('underscore');
var multiparty = require('multiparty');
var helper = require('../util/routes_helper.js');
var config = require('../config.js');
var validator = require('../library/validations.js');
var Bus = require('../models/bus.js');
var College = require('../models/college.js');

var MAX_FILE_SIZE = 1024 * 1024 * 5;
var MAX_BUS_PROXIMITY = 20; //miles

/* GET dashboard index page */
router.get('/', function (req, res, next) {
    return res.redirect('/user/dashboard'); //todo there should be some relative redirect
});

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
        bus: function (done) {
            var userbus = null;
            var closestdistance = null;
            Bus.find({}).exec(function (err, buses) {
                if (err) {
                    console.log(err);
                }
                async.each(buses, function (bus, callback) {
                    async.each(bus.stops, function (stop, callback2) {
                        College.find({$or: [{'_id': stop.collegeid}, {'_id': req.user.school.id}]},
                            function (err, colleges) {
                                if (colleges.length == 1) {
                                    userbus = bus;
                                    userbus.message = "a bus stops at your school:";
                                    closestdistance = 0;
                                }
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
                                callback2();
                            });
                    }, function (err) {
                        callback();
                    });
                }, function (err) {
                    return done(null, userbus);
                });
            });
        }
    }, function (err, results) {
        if (err) {
            console.log(err);
        }
        res.render('dashboard/index', {
            name: req.user.name,
            resumeLink: results.resumeLink,
            team: results.members,
            userid: req.user.pubid,
            teamwithcornell: req.user.internal.teamwithcornell,
            bus: results.bus,
            userbusid: req.user.internal.busid,
            title: "Dashboard"
        });
    })
});

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
router.post('/dashboard/edit', function (req, res, next) {

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

        helper.uploadResume(resume, options, function (err, file) {
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
router.post('/busdecision', function (req, res) {
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
                        return res.sendStatus(500);
                    }
                    else {
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
                            return res.sendStatus(500);
                        }
                        else {
                            user.save(function (err) {
                                if (err) {
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

/* GET logout the current user */
router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
