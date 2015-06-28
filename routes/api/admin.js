"use strict";
var express = require('express');
var router = express.Router();
var colleges = require('../../models/college.js');


router.use(function (req, res, next) {
    //todo add admin authentication middleware
    next();
});

/* PATCH set status of a single team */
router.patch('/user/:pubid/setStatus', function (req, res, next) {
    //see enums.status for acceptable status states
    User.findOne({pubid: req.params.pubid}, function (err, user) {
        user.internal.status = req.body.status;
        user.save(function (err) {
            if (err) {
                res.send(500);
            }
            else res.send(200);
        });
    });

});

/* PATCH set status of entire team */
router.patch('/team/:teamid/setStatus', function (req, res, next) {

});

module.exports = router;
