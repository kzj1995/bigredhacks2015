"use strict";
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var async = require('async');
var validator = require('../library/validations.js');
var helper = require('../util/routes_helper');
var User = require('../models/user.js');
var enums = require('../models/enum.js');

var config = require('../config.js');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.redirect('/admin/dashboard');
});


//{ $group: { _id: "$fieldName"}  },{ $group: { _id: 1, count: { $sum: 1 } } }
router.get('/dashboard', function (req, res, next) {

    async.parallel({
        applicants: function (done) {
            User.aggregate([
                {
                    $group: {
                        _id: "$internal.status",
                        total: {$sum: 1}
                    }
                }
            ], function (err, result) {
                if (err) {
                    done(err);
                }
                else {
                    console.log(result);
                    result = _.defaults(_.object(_.map(result, _.values)), {
                        null: 0,
                        accepted: 0,
                        rejected: 0,
                        waitlisted: 0,
                        pending: 0
                    }); //{pending: 5, accepted: 10}
                    result.total = _.reduce(result, function (a, b) {
                        return a + b;
                    });

                    //fold null prop into pending
                    //legacy support when internal.status in user model did not have default: 'pending'
                    result.pending += result["null"];
                    result = _.omit(result, "null");
                    done(null, result);
                }
            })
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
        }
        console.log(result);
        res.render('admin/index', {
            title: 'Admin Dashboard',
            applicants: result.applicants
        })
    });

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