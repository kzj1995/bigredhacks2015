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
var searchable = require('../models/searchable.js');

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
                    //make all values lowercase
                    result = _.map(result, function (x) {
                        return _.mapObject(x, function (val, key) {
                            return (typeof val == 'string') ? val.toLowerCase() : val;
                        });
                    });
                    console.log(result);

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
//todo refactor query execution logic
router.get('/search', function (req, res, next) {

    if (!req.query) {
        User.find({}).sort('name.last').limit(100).exec(function (err, applicants) {
            res.render('admin/search', {
                title: 'Admin Dashboard - Search',
                applicants: applicants
            })
        });
    }

    //for a mapping of searchable fields, look at searchable.ejs
    var query = _queryBuilder(req.query, searchable.user);

    /*
     * two types of search approaches:
     * 1. simple query (over single fields)
     * 2. aggregate query (over fields that need implicit joins)
     */
    if (_.size(query.project) > 0) {
        query.project.document = '$$ROOT'; //return the actual document
        query.project.lastname = '$name.last'; //be able to sort by last name
        console.log(query);
        User.aggregate()
            .project(query.project)
            .match(query.match)
            .sort('lastname')
            .exec(function (err, applicants) {
                if (err) endOfCall(err);
                else {
                    endOfCall(err, _.map(applicants, function (x) {
                        return x.document
                    }));
                }
            });
    }
    else {
        //run a simple query (because it's faster)
        User.find(query.match)
            .sort('name.last')
            .exec(endOfCall);
    }

    function endOfCall(err, applicants) {
        console.log(applicants);
        if (err) console.error(err);
        else {
            res.render('admin/search', {
                title: 'Admin Dashboard - Search Results',
                applicants: applicants
            })
        }
    }

})
;

//todo refactor this
/**
 * Builds an aggregate or simple query
 * @param query Object Raw req.query input
 * @param searchSchema Searchable fields as defined in searchable.js
 * @return Object out
 * out.match: object to match
 * out.project: object to project if aggregation query
 */
var _queryBuilder = function queryBuilder(query, searchSchema) {
    var project = {};
    var match = {};
    _.each(_.omit(query, function (v, k) {
            return (_.findWhere(searchSchema, {alias: k}) == undefined) || v == '';
        }), function (v, k) {
            //get path as array
            var searchItem = _.findWhere(searchSchema, {alias: k});

            //implicit path definition
            var path;
            if (typeof searchItem.path == "undefined") {
                path = searchItem.alias;
            }
            else path = searchItem.path;
            path = path.split(" "); //path must be array

            //fuzzy search
            var valToMatch;
            if (searchItem.fuzzytext) {
                //todo spaces at end of string break this
                valToMatch = _toTextMatch(v.split(" "));
            }
            else valToMatch = v;

            //generate projection
            if (path.length > 1) {

                // ex: {fullName: {$concat: ['$firstName', ' ', '$lastName']}}
                //convert to projection notation and add space between elements
                path = _.flatten(_.map(path, function (e) {
                    return ["$" + e, " "];
                }));
                path.pop();//pop() last " " element resulting from map

                project[k] = {'$concat': path};
                match[k] = valToMatch;
            }
            else {
                match[path] = valToMatch;
            }
        }
    );

    return {
        project: project,
        match: match
    };
};

/**
 * convert an array of items to a text match regex
 * @param terms tokenized terms to alternate
 * @return regex with alternations between terms
 */

var _toTextMatch = function _toTextMatch(terms) {
    var regexString = "";

    for (var i = 0; i < terms.length; i++) {
        regexString += terms[i];
        if (i < terms.length - 1) regexString += '|';
    }

    return new RegExp(regexString, 'ig');
};

router.get('/review', function (req, res, next) {
    res.render('admin/review', {
        title: 'Admin Dashboard - Review'
    })
});

module.exports = router;