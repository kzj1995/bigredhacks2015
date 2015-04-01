"use strict";
var express = require('express');
var router = express.Router();
var colleges  = require('../models/college.js');


router.get('/colleges', function(req, res, next) {
    colleges.getAll(function(err, data) {
        if (err) {
            console.log(err);
        }
        res.send(data);
    });
});

module.exports = router;
