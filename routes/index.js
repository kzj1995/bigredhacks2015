"use strict";
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home' });
});

/* GET login page. */
router.get('/login', function(req, res, next) {
    res.render('login', {});
});

/* POST login page. */
router.post('/login', function(req, res, next) {



    res.redirect('/');
});
module.exports = router;
