"use strict";
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home' });
});

router.get('/registration', function(req, res, next) {
    res.render('registration', { title: 'Registration' });
});

module.exports = router;
