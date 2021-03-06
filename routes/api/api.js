"use strict";
var express = require('express');
var router = express.Router();
var Colleges = require('../../models/college.js');
var User = require('../../models/user.js');
var middle = require('../middleware');

router.get('/colleges', function (req, res, next) {
    Colleges.getAll(function (err, data) {
        if (err) console.log(err);
        else res.send(data);
    });
});


//todo prevent access when registration is completely closed
router.get('/validEmail', function (req, res, next) {
    User.findOne({email: req.query.email}, function (err, user) {
        if (err) console.err(err);
        else res.send(!user);
    });
});

/* POST toggle interested in attending for waitlisted */
router.post('/rsvp/notinterested', middle.requireResultsReleased, function (req, res, next) {
    var checked = (req.body.checked === "true");
    var user = req.user;
    if (user.internal.status == "Waitlisted") {
        user.internal.not_interested = checked;
        user.save(function (err) {
            if (err) {
                res.sendStatus(500);
            }
            else res.sendStatus(200);
        });
    }
});

/* PATCH toggle rsvp for cornell students */
router.patch('/rsvp/cornellstudent', middle.requireResultsReleased, function (req, res, next) {
    var checked = (req.body.checked === "true");
    var user = req.user;
    if (user.internal.cornell_applicant) {
        user.internal.going = checked;
        user.save(function (err) {
            if (err) {
                res.sendStatus(500);
            }
            else res.sendStatus(200);
        });
    }
    else res.sendStatus(500);
});

module.exports = router;
