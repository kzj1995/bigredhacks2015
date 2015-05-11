"use strict";
var express = require('express');
var router = express.Router();
var validator = require('../library/validations.js');
var helper = require('../util/routes_helper');


var config = require('../config.js');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Home',
        error: req.flash('error'),
        success: req.flash('success')
    });
});

router.post('/cornell/subscribe', function (req, res, next) {
    req = validator.validate(req, ['cornellEmail']);
    var email = req.body.cornellEmail;
    if (req.validationErrors()) {
        console.log(req.validationErrors());
        req.flash("error", "There was an error adding your email to the list.");
        res.redirect("/");
    }
    else {
        helper.addSubscriber(config.mailchimp.interested, email, "", "", function (err, result) {
            if (err) {
                console.log(err);
                req.flash("error", "There was an error adding your email to the list.");
            }
            else {
                console.log(result);
                req.flash("success", "Your email has been added to the mailing list.");
            }
            res.redirect('/');
        })
    }
});

module.exports = router;
