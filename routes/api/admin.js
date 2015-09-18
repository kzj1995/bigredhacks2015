"use strict";
var express = require('express');
var router = express.Router();
var async = require('async');
var mongoose = require('mongoose');
var mandrill = require('mandrill-api/mandrill');

var Colleges = require('../../models/college.js');
var Bus = require('../../models/bus.js');
var Team = require('../../models/team.js');
var User = require('../../models/user.js');
var Reimbursements = require('../../models/reimbursements.js');
var config = require('../../config.js');
var helper = require('../../util/routes_helper.js');
var middle = require('../middleware');

var mandrill_client = new mandrill.Mandrill(config.setup.mandrill_api_key);

/**
 * @api PATCH /user/:pubid/setStatus Set status of a single user. Will also send an email to the user if their status changes from "Waitlisted" to "Accepted" and releaseDecisions is true
 * @apiname setstatus
 * @apigroup User
 *
 * @apiParam {string="Rejected","Waitlisted","Accepted"} status New status to set
 *
 * @apiSuccess (200)
 * @apiError (500)
 * */
router.patch('/user/:pubid/setStatus', function (req, res, next) {
    User.findOne({pubid: req.params.pubid}, function (err, user) {
        if (err || !user) {
            console.log('Error: ' + err)
            return res.sendStatus(500);
        }
        else {
            var oldStatus = user.internal.status;
            var newStatus = req.body.status;
            user.internal.status = newStatus;
            //send email and redirect to home page

            user.save(function (err) {
                if (err) {
                    console.log(err);
                    return res.sendStatus(500);
                } else {
                    if (oldStatus == "Waitlisted" && newStatus == "Accepted" && middle.helper.isResultsReleased()) {
                        //email sending should not block save
                        console.log('Sending an "off the waitlist" email');
                        var template_name = "bigredhackstemplate";
                        var template_content = [{
                            "name": "emailcontent",
                            "content": "<p>Hey " + user.name.first + ",</p><p>" +
                            "<p>Congratulations, you've survived the wait list and have been accepted to BigRed//Hacks 2015! Take a deep breath, all of your hard work has finally paid off.  We know the suspense was killing you.</p>" +
                            "<p>Please take a few moments to <a href='http://www.bigredhacks.com/user/dashboard'>login to our website</a> and RSVP. If we offer a charter bus to your school, you can sign up for that too.  If you aren't going, we'd appreciate if you login and tell us that too!</p>" +
                            "<p>Don't wait long to RSVP, as our friend Shia Labeouf would say: <a href='https://media.giphy.com/media/Trh2LxGxp0CsM/giphy.gif'>JUST DO IT!</a></p>" +
                            "<p>BigRed//Hacks Team</p>"
                        }];

                        var message = {
                            "subject": "You've been accepted to BigRed//Hacks 2015!",
                            "from_email": "info@bigredhacks.com",
                            "from_name": "BigRed//Hacks",
                            "to": [{
                                "email": user.email,
                                "name": user.name.first + " " + user.name.last,
                                "type": "to"
                            }]
                        };
                        var async = false;
                        mandrill_client.messages.sendTemplate({
                            "template_name": template_name,
                            "template_content": template_content,
                            "message": message, "async": async
                        }, function (result) {
                            console.log(result);
                            return res.sendStatus(200);
                        }, function (e) {
                            console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                            return res.sendStatus(500);
                        });
                    }
                    else {
                        return res.sendStatus(200);
                    }
                }
            });

        }
    });
});

/**
 * @api PATCH /team/:teamid/setStatus Set status of entire team
 * @apiname setstatus
 * @apigroup Team
 *
 * @apiParam {string="Rejected","Waitlisted","Accepted"} status New status to set
 *
 * @apiSuccess (200)
 * @apiError (500)
 * */
router.patch('/team/:teamid/setStatus', function (req, res, next) {
    var id = mongoose.Types.ObjectId(req.params.teamid);
    Team.findById(id, function (err, team) {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }
        if (!team) {
            console.log("No such team found.");
            return res.sendStatus(500);
        }
        else {
            team.populate('members.id', function (err, team) {
                if (err) {
                    console.log(err);
                    return res.sendStatus(500);
                }
                else {
                    async.each(team.members, function (user, callback) {
                        user = user.id;
                        user.internal.status = req.body.status;
                        user.save(function (err) {
                            callback(err);
                        });
                    }, function (err) {
                        if (err) {
                            console.log(err);
                            return res.sendStatus(500);
                        }
                        else return res.sendStatus(200);
                    });

                }
            })
        }
    });
});

/**
 * @api PATCH /user/:email/setRole Set role of a single user
 * @apiname setrole
 * @apigroup User
 *
 * @apiParam {string="user","admin"} role New role to set
 *
 * @apiSuccess (200)
 * @apiError (500)
 * */
router.patch('/user/:email/setRole', function (req, res, next) {
    User.findOne({email: req.params.email}, function (err, user) {
        if (err || !user) {
            return res.sendStatus(500);
        }
        else {
            user.role = req.body.role.toLowerCase();
            user.save(function (err) {
                if (err) return res.sendStatus(500);
                else return res.sendStatus(200);
            });
        }
    });
});

/**
 * @api GET /np Checks whether a user is in no-participation mode
 * @apiname checknp
 *
 * @apiSuccess (200) true
 * @apiError (200) false
 */
router.get('/np', function (req, res, next) {
    res.send(req.session.np);
});

/**
 * @api POST /np/set Enable/disable no participation mode
 * @apiname setnp
 *
 * @apiParam {boolean} state New np state to set
 *
 * @apiSuccess (200)
 * @apiError (500)
 */
router.post('/np/set', function (req, res, next) {
    req.session.np = req.body.state;
    res.sendStatus(200);
});

//todo documentation
/* POST remove bus from list of buses */
router.delete('/removeBus', function (req, res, next) {
    Bus.remove({_id: req.body.busid}, function (err) {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }
        else return res.sendStatus(200);
    });
});

//todo documentation
/* POST update bus in list of buses */
router.put('/updateBus', function (req, res, next) {
    Bus.findOne({_id: req.body.busid}, function (err, bus) {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }

        bus.name = req.body.busname; //bus route name
        bus.stops = req.body.stops;
        bus.capacity = parseInt(req.body.buscapacity);
        bus.save(function (err) {
            if (err) {
                console.error(err);
                return res.sendStatus(500);
            }
            else return res.sendStatus(200);
        });
    });
});

//todo documentation
router.post('/reimbursements/school', function (req, res) {
    Reimbursements.findOne({'college.id': req.body.collegeid}, function (err, rem) {
        console.log(req.body);
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }

        if (rem) {
            console.log("Entry already exists.");
            return res.sendStatus(500);
        }
        else {
            //todo couple these
            var newRem = new Reimbursements({
                college: {
                    id: req.body.collegeid,
                    name: req.body.college
                },
                mode: req.body.travel,
                amount: req.body.amount
            });
            newRem.save(function (err) {
                if (err) {
                    console.log(err);
                    return res.sendStatus(500);
                }
                else return res.sendStatus(200);
            })
        }
    })
});

//todo documentation
router.patch('/reimbursements/school', function (req, res) {
    Reimbursements.findOne({"college.id": req.body.collegeid}, function (err, rem) {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }
        if (res == null) {
            return res.sendStatus(404);
        }
        rem.mode = req.body.travel;
        rem.amount = req.body.amount;
        rem.save(function (err, rem) {
            if (err) {
                console.error(err);
                return res.sendStatus(500);
            }
            else {
                return res.sendStatus(200);
            }
        });

    })
});

//todo documentation
router.delete('/reimbursements/school', function (req, res) {
    Reimbursements.remove({'college.id': req.body.collegeid}, function (err, rem) {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }
        return res.sendStatus(200);
    })
});

//todo documentation
router.patch('/user/:pubid/setRSVP', function (req, res) {
    var going = normalize_bool(req.body.going);
    if (going === "") {
        going = null;
    }

    //todo only allow changing if user is accepted
    User.findOne({pubid: req.params.pubid}, function (err, user) {
        if (err || !user) {
            return res.sendStatus(500);
        }
        else {
            user.internal.going = going;
            user.save(function (err) {
                if (err) return res.sendStatus(500);
                else return res.sendStatus(200);
            });
        }
    });
});

//todo documentation
router.patch('/user/:pubid/checkin', function (req, res, next) {
    User.findOne({pubid: req.params.pubid}, function (err, user) {
        if (err || !user) {
            return res.sendStatus(500);
        }
        else {
            user.internal.checkedin = normalize_bool(req.body.checkedin);
            console.log(user.internal.checkedin);
            user.save(function (err) {
                if (err) return res.sendStatus(500);
                else return res.sendStatus(200);
            });
        }
    });
});

//todo documentation
router.get('/users/checkin', function (req, res, next) {
    var project = "name pubid email school internal.checkedin";
    User.find({"internal.going": true}).select(project).exec(function (err, users) {
        if (err) {
            res.status(500).send(null);
        }
        else {
            res.send(users);
        }
    })
});

//todo refactor
function normalize_bool(string) {
    if (typeof string === "boolean") return string;
    if (string.toLowerCase() == "true") {
        return true;
    }
    else if (string.toLowerCase() == "false") {
        return false;
    }
    return string;
}

module.exports = router;
