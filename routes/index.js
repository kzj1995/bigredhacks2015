"use strict";
var express = require('express');
var router = express.Router();
var validator = require('../library/validations.js');
var helper = require('../util/routes_helper');


var config = require('../config.js');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Cornell\'s Ultimate Hackathon'
    });
});


/* POST subscribe a cornell student to the mailing list */
router.post('/cornell/subscribe', function (req, res, next) {
    req = validator.validate(req, ['cornellEmail']);
    var email = req.body.cornellEmail;
    if (req.validationErrors()) {
        console.log(req.validationErrors());
        req.flash("error", "There was an error adding your email to the list.");
        res.redirect("/");
    }
    else {
        helper.addSubscriber(config.mailchimp.l_interested, email, "", "", function (err, result) {
            if (err) {
                if (err.name === "List_AlreadySubscribed") {
                    req.flash("error", err.error);
                }
                else {
                    req.flash("error", "There was an error adding your email to the list.");
                }
                //console.log(err);
            }
            else {
                //console.log(result);
                req.flash("success", "Your email has been added to the mailing list.");
            }
            res.redirect('/');
        })
    }
});

module.exports = router;
