"use strict";
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var async = require('async');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
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
/* GET admin dashboard */
router.get('/dashboard', function (req, res, next) {

    async.parallel({
        applicants: function (done) {
            User.aggregate([
                {$group: {_id: "$internal.status", total: {$sum: 1}}}
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
                    //legacy support when internal.status in user model did not have default: 'Pending'
                    result.pending += result["null"];
                    result = _.omit(result, "null");
                    done(null, result);
                }
            })
        },
        schools: function (done) {
            User.aggregate([
                {$group: {_id: "$school.name", total: {$sum: 1}}},
                {$sort: {total: -1, _id: 1}},
                {$project: {_id: 0, name: "$_id", total: "$total"}}
            ], function (err, res) {
                return done(err,res);
            })
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
        }
        console.log(result);
        res.render('admin/index', {
            title: 'Admin Dashboard',
            applicants: result.applicants,
            schools: result.schools
        })
    });

});

router.get('/user/:pubid', function(req, res, next) {
    var pubid = req.params.pubid;
    res.render('admin/user', {
        title: 'Review User'
    })
});

router.get('/team/:teamid', function(req, res, next) {
    var teamid = req.params.teamid;
    res.render('admin/team', {
        title: 'Review Team'
    })
});

router.get('/login', function (req, res, next) {
    res.render('admin/login', {
        title: 'Admin Login',
        user: req.user
    })
});

/* POST login a user */
router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/admin',
        failureRedirect: '/admin/login',
        failureFlash: true
    })
);

router.get('/search',function (req,res,next){
    User.find({}).sort('name.last').exec(function (err, applicants) {
        res.render('admin/search',{
            title: 'Admin Dashboard - Search',
            applicants: applicants
        })
    });
});

router.get('/review',function (req,res,next){
    res.render('admin/review',{
        title: 'Admin Dashboard - Review'
    })
});

router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

module.exports = router;