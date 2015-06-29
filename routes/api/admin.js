"use strict";
var express = require('express');
var router = express.Router();
var Colleges = require('../../models/college.js');
var Team = require('../../models/team.js');
var User = require('../../models/user.js');
var async = require('async');


router.use(function (req, res, next) {
    //todo add admin authentication middleware
    next();
});

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
        console.log(err, user);
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
    console.log(req.body);
    Team.findOne({_id: req.params.teamid}, function (err, team) {
        if (err) {
            res.sendStatus(500);
        }
        if (!team) {
            res.sendStatus(500);
        }
        else {
            team.populate('members.id', function (err, team) {
                if (err) res.sendStatus(500);
                else {
                    async.each(team.members, function (user, callback) {
                        user = user.id;
                        user.internal.status = req.body.status;
                        user.save(function (err) {
                            callback(err);
                        });
                    }, function (err) {
                        if (err) return res.sendStatus(500);
                        else return res.sendStatus(200);
                    });

                }
            })
        }
    });
});

module.exports = router;
