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
        console.log(user);
        if (err) console.err(err);
        else res.send(!user);
    });
});

module.exports = router;
