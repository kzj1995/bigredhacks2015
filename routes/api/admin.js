"use strict";
var express = require('express');
var router = express.Router();
var colleges  = require('../../models/college.js');


router.use(function(req, res, next) {
        next();
});

router.patch('/setstatus', function(req, res, next) {
    router.post('/team/cornell', function (req, res, next) {
        var status = req.body.status;
        var user = req.user;
        user.internal.status = status;
        user.save(function(err) {
            if (err) {
                res.send(500);
            }
            else res.send(200);
        });
    });
});

module.exports = router;
