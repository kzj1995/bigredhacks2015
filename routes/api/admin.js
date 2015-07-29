"use strict";
var express = require('express');
var router = express.Router();
var Colleges = require('../../models/college.js');
var Team = require('../../models/team.js');
var User = require('../../models/user.js');
var async = require('async');
var mongoose = require('mongoose');

/**
 * @api PATCH /user/:pubid/setStatus Set status of a single user
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
            return res.sendStatus(500);
        }
        else {
            user.internal.status = req.body.status;
            user.save(function (err) {
                if (err) return res.sendStatus(500);
                else return res.sendStatus(200);
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

module.exports = router;
