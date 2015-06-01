"use strict";
var express = require('express');
var router = express.Router();
var colleges = require('../../models/college.js');


router.use(function (req, res, next) {
    next();
});

/* PATCH set status of a single team */
router.patch('/setStatus', function (req, res, next) {
    var status = req.body.status;
    var user = req.user;
    user.internal.status = status;
    user.save(function (err) {
        if (err) {
            res.send(500);
        }
        else res.send(200);
    });
});

/* PATCH set status of entire team */
router.patch('/setTeamStatus', function (req, res, next) {

});

module.exports = router;
