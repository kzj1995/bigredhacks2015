"use strict";

var AWS = require('aws-sdk');
var uid = require('uid2');
var fs = require('fs');
var async = require('async');

var mongoose = require('mongoose');
mongoose.connect(process.env.COMPOSE_URI || process.env.MONGOLAB_URI || 'mongodb://localhost/bigredhacks');
//mongoose.connect('mongodb://localhost/bigredhacks');
var config = require('../config.js');
var User = require('../models/user.js');

var RESUME_DEST = 'resume/';
var RECEIPT_DEST = 'travel/';

var LOCAL_DEST = '/home/leon/resumes/';

var s3 = new AWS.S3({
    accessKeyId: config.setup.AWS_access_key,
    secretAccessKey: config.setup.AWS_secret_key
});

var query = { "internal.going": true}
/*
    "$or": [
        {"internal.going": true},
        {
            "$and": [
                {"internal.cornell_applicant": true},
                {"internal.status": "Accepted"}
            ]
        }
    ]
};
*/

User.find(query, function (err, users) {
    if (err) {
        console.error("Error getting users.");
    }
    else {
        console.log("Starting resume dump.");
        async.each(users, function (user, done) {
            var save_name = LOCAL_DEST + user.name.first + "_" + user.name.last + "_" + uid(2) + ".pdf";
            var filename = user.app.resume;
            console.log(filename, save_name);
            var params = {Bucket: "files.bigredhacks.com", Key: RESUME_DEST + filename};
            //console.log(params);
            var file = fs.createWriteStream(save_name);
            var r = s3.getObject(params).createReadStream().pipe(file);
            r.on("error", function(err) {console.log(err)});
            r.on('finish', done);
        }, function (err, res) {
            console.log(err, "Finished!");
            process.exit();
        });

    }
});
