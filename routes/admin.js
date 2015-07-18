"use strict";
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var async = require('async');
var validator = require('../library/validations.js');
var helper = require('../util/routes_helper');
var User = require('../models/user.js');
var Team = require('../models/team.js');
var enums = require('../models/enum.js');
var config = require('../config.js');
var queryBuilder = require('../util/search_query_builder.js');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.redirect('/admin/dashboard');
});


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
                    //console.log(result);
                    //make all values lowercase
                    result = _.map(result, function (x) {
                        return _.mapObject(x, function (val, key) {
                            return (typeof val == 'string') ? val.toLowerCase() : val;
                        });
                    });
                    //console.log(result);

                    //remap values to key,value pairs and fill defaults
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
                    //todo consider removing in 2016+ deployments
                    result.pending += result["null"];
                    result = _.omit(result, "null");
                    done(null, result);
                }
            })
        },
        schools: function (done) {
            User.aggregate([
                {$group: {_id: {name: "$school.name", status: "$internal.status"}, total: {$sum: 1}}},
                {
                    $project: {
                        accepted: {$cond: [{$eq: ["$_id.status", "Accepted"]}, "$total", 0]},
                        waitlisted: {$cond: [{$eq: ["$_id.status", "Waitlisted"]}, "$total", 0]},
                        rejected: {$cond: [{$eq: ["$_id.status", "Rejected"]}, "$total", 0]},
                        //$ifnull returns first argument if not null, which is truthy in this case
                        //therefore, need a conditional to check whether the second argument is returned.
                        //todo the $ifnull conditional is for backwards compatibility: consider removing in 2016 deployment
                        pending: {$cond: [{$or: [{$eq: ["$_id.status", "Pending"]}, {$cond: [{$eq: [{$ifNull: ["$_id.status", null]}, null]}, true, false]}]}, "$total", 0]}
                    }
                },
                {
                    $group: {
                        _id: {name: "$_id.name"},
                        accepted: {$sum: "$accepted"},
                        waitlisted: {$sum: "$waitlisted"},
                        rejected: {$sum: "$rejected"},
                        pending: {$sum: "$pending"}
                    }
                },
                {
                    $project: {
                        _id: 0,
                        name: "$_id.name",
                        accepted: "$accepted",
                        waitlisted: "$waitlisted",
                        rejected: "$rejected",
                        pending: "$pending",
                        total: {$add: ["$accepted", "$pending", "$waitlisted", "$rejected"]}
                    }
                },
                {$sort: {total: -1, name: 1}}

            ], function (err, res) {
                return done(err, res);
            })
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
        }
        //console.log(result);
        res.render('admin/index', {
            title: 'Admin Dashboard',
            applicants: result.applicants,
            schools: result.schools
        })
    });

});

/* GET Detail view of an applicant */
router.get('/user/:pubid', function (req, res, next) {
    var pubid = req.params.pubid;
    User.where({pubid: pubid}).findOne(function (err, user) {
        if (err) {
            console.log(err);
            //todo return on error
        }
        else {
            getTeamMembers([user], function(teamMembers){
                res.render('admin/user', {
                    user: user,
                    title: 'Review User',
                    teamMembers: teamMembers
                })
            });
        }
    });
});

router.get('/team/:teamid', function (req, res, next) {
    var teamid = req.params.teamid;
    res.render('admin/team', {
        title: 'Review Team'
    })
});

/* GET Settings page to set user roles */
router.get('/settings', function (req, res, next) {

    //todo change to {role: {$ne: "user"}} in 2016 deployment
    User.find({$and: [{role: {$ne: "user"}}, {role: {$exists: true}}]}).sort('name.last').exec(function (err, applicants) {
        if (err) console.log(err);
        console.log(applicants);
        res.render('admin/settings/settings', {
            title: 'Admin Dashboard - Settings',
            applicants: applicants,
            params: req.query
        })
    });
});

/* GET Search page to find applicants */
router.get('/search', function (req, res, next) {
    var queryKeys = Object.keys(req.query);
    if (queryKeys.length == 0 || (queryKeys.length == 1 && queryKeys[0] == "render")) {
        User.find().limit(50).sort('name.last').exec(function (err, applicants) {
            getTeamMembers(applicants, function(err, applicants){
                res.render('admin/search/search', {
                    title: 'Admin Dashboard - Search',
                    applicants: applicants,
                    params: req.query,
                    render: req.query.render
                })
            });
        });
        return;
    }

    _performQuery(req.query, function (err, applicants) {
        if (err) console.error(err);
        else {
            getTeamMembers(applicants, function(err, applicants){
                res.render('admin/search/search', {
                    title: 'Admin Dashboard - Search',
                    applicants: applicants,
                    params: req.query,
                    render: req.query.render //table, box
                })
            });
        }
    })
});

/**
 * Helper function to get team members of each applicant in the passed in Array to display their
 * names (and a link to them) in box view
 * @param applicants Array of applicants to obtain team members of
 * @param callback function that given teamMembers, renders the page
 */
function getTeamMembers(applicants, callback){
    async.map(applicants, function(applicant, done) {
        getUsersFromTeamId(applicant.internal.teamid, function(err,teamMembers) {
            applicant.teammembers = teamMembers;
            return done(err, applicant);
        });
    }, function(err, results) {
        if (err) console.error(err);
        return callback(null, results);
    });
}

/**
 * Helper function which given a team id, provides as an argument to a callback an array of the team members as
 * User objects with that team id
 * @param teamid id of team to get members of
 * @param callback
 */
function getUsersFromTeamId(teamid, callback){
    var teamMembers = [];
    if(teamid == null) return callback(null, teamMembers);
    Team.findOne({_id: teamid}, function (err, team) {
        team.populate('members.id', function (err, team) {
            if (err) console.error(err);
            team.members.forEach(function (val,ind) {
                teamMembers.push(val.id);
            });
            callback(null, teamMembers);
        });
    });
}

/**
 * Helper function to perform a search query (used by applicant page search("/search") and settings page
 * search("/settings"))
 * @param queryString String representing the query parameters
 * @param callback function that performs rendering
 */
function _performQuery(queryString, callback) {
    /*
     * two types of search approaches:
     * 1. simple query (over single fields)
     * 2. aggregate query (over fields that need implicit joins)
     */

    //for a mapping of searchable fields, look at searchable.ejs
    var query = queryBuilder(queryString, "user");

    if (_.size(query.project) > 0) {
        query.project.document = '$$ROOT'; //return the actual document
        query.project.lastname = '$name.last'; //be able to sort by last name

        User.aggregate()
            .project(query.project)
            .match(query.match)
            .sort('lastname')
            .exec(function (err, applicants) {
                if (err) endOfCall(err);
                else {
                    callback(null, _.map(applicants, function (x) {
                        return x.document
                    }));
                }
            });
    }
    else {
        //run a simple query (because it's faster)
        User.find(query.match)
            .sort('name.last')
            .exec(callback);
    }

}

router.get('/review', function (req, res, next) {
    res.render('admin/review', {
        title: 'Admin Dashboard - Review'
    })
});

module.exports = router;