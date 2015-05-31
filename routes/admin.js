"use strict";
var express = require('express');
var router = express.Router();
var validator = require('../library/validations.js');
var helper = require('../util/routes_helper');


var config = require('../config.js');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.redirect('/admin/dashboard');
});

router.get('/dashboard', function (req, res, next) {
    res.render('admin/index', {
        title: 'Admin Dashboard'
    })
});

router.get('/login', function (req, res, next) {
    res.render('admin/login', {
        title: 'Admin Login'
    })
});

router.get('/logout', function (req, res, next) {
    //todo add admin logout
    res.redirect('/');
});

module.exports = router;