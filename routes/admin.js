"use strict";
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var async = require('async');
var passport = require('passport');
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
                return done(err, res);
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

router.get('/user/:pubid', function (req, res, next) {
    var pubid = req.params.pubid;
    res.render('admin/user', {
        title: 'Review User'
    })
});

router.get('/team/:teamid', function (req, res, next) {
    var teamid = req.params.teamid;
    res.render('admin/team', {
        title: 'Review Team'
    })
});

/* POST Search based on inputted fields */
router.post('/search', function (req, res, next) {
    //Boolean variables indicating whether a field was searched for
    var collegesearched, useridsearched, emailsearched, namesearched;
    //If name was searched, get the first and last name
    var firstname, lastname;
    if (req.body.college != "") {
        collegesearched = true
    }
    if (typeof req.body.userid != "undefined" && req.body.userid != "") {
        useridsearched = true
    }
    if (typeof req.body.email != "undefined" && req.body.email != "") {
        emailsearched = true
    }
    if (typeof req.body.name != "undefined" && req.body.name != "") {
        namesearched = true;
        var name = req.body.name.split(" ");
        firstname = name[0];
        lastname = name[1];
    }
    if (collegesearched && useridsearched) {
        User.find({'school.name': req.body.college, pubid: req.body.userid}).sort
        ('name.last').exec(function (err, applicants) {
            res.render('admin/search', {
                title: 'Admin Dashboard - Search',
                applicants: applicants
            })
        });
    }
    else if (collegesearched && emailsearched) {
        User.find({'school.name': req.body.college, email: req.body.email}).sort
        ('name.last').exec(function (err, applicants) {
            res.render('admin/search', {
                title: 'Admin Dashboard - Search',
                applicants: applicants
            })
        });
    }
    else if (collegesearched && namesearched) {
        User.find({'school.name': req.body.college, 'name.first': firstname, 'name.last': lastname}).sort
        ('name.last').exec(function (err, applicants) {
            res.render('admin/search', {
                title: 'Admin Dashboard - Search',
                applicants: applicants
            })
        });
    }
    else if (collegesearched) {
        User.find({'school.name': req.body.college}).sort('name.last').exec(function (err, applicants) {
            res.render('admin/search', {
                title: 'Admin Dashboard - Search',
                applicants: applicants
            })
        });
    }
    else if (useridsearched) {
        User.find({pubid: req.body.userid}).sort('name.last').exec(function (err, applicants) {
            res.render('admin/search', {
                title: 'Admin Dashboard - Search',
                applicants: applicants
            })
        });
    }
    else if (emailsearched) {
        User.find({email: req.body.email}).sort('name.last').exec(function (err, applicants) {
            res.render('admin/search', {
                title: 'Admin Dashboard - Search',
                applicants: applicants
            })
        });
    }
    else if (namesearched) {
        User.find({'name.first': firstname, 'name.last': lastname}).sort('name.last').exec(function (err, applicants) {
            res.render('admin/search', {
                title: 'Admin Dashboard - Search',
                applicants: applicants
            })
        });
    }
    else {
        res.redirect('/admin/search');
    }
});

router.get('/review', function (req, res, next) {
    res.render('admin/review', {
        title: 'Admin Dashboard - Review'
    })
});

router.post('/updateStatus', function (req, res, next) {
    User.findOne({pubid: req.query.id}, function (err, user) {
        user.internal.status = req.query.decision;
        user.save(function (err, doc) {
        });
    });
});

module.exports = router;