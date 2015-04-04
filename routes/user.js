"use strict";
var express = require('express');
var router = express.Router();

/* GET user panel of logged in user */
router.get('/', function(req, res, next) {
    res.render('userpanel', { firstname: req.user.name.first, lastname: req.user.name.last });
});

module.exports = router;
