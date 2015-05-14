"use strict";
var helper = {};
var AWS = require('aws-sdk');
var uid = require('uid2');
var fs = require('fs');
var qs = require('qs');
var mcapi = require('mailchimp-api');

var config = require('../config.js');

var MAX_RESUME_SIZE = 1024 * 1024 * 5;
var RESUME_DEST = 'resume/';
var s3 = new AWS.S3({
    accessKeyId: config.setup.AWS_access_key,
    secretAccessKey: config.setup.AWS_secret_key
});

var mc = new mcapi.Mailchimp(config.setup.mailchimp_api_key);


// Make the nested fields parsed by multiparty look like req.body from body-parser
// e.g. 'metadata[foo]': ['1']            => {metadata: {foo: 1}}
//      'metadata[foo]': ['bar']          => {metadata: {foo: 'bar'}}
//      'metadata[foo][]': ['bar', 'bat'] => {metadata: {foo: ['bar', 'bat']}}
helper.reformatFields = function reformatFields(fields, castNumber) {
    // convert numbers to real numbers instead of strings
    function toNumber(i) {
        return i !== '' && !isNaN(i) ? Number(i) : i;
    }

    // remove the extra array wrapper around the values
    for (var f in fields) {
        if (f === 'null') {
            delete fields[f];  // ignore null fields like submit
        } else {
            if (f.match(/\[\]$/)) {
                // if our key uses array syntax we can make qs.parse produce the intended result
                // by removing the trailing [] on the key
                var key = f.replace(/\[\]$/, '');

                if (castNumber) {
                    fields[key] = fields[f].map(function (i) {
                        return toNumber(i)
                    });

                }
                else fields[key] = fields[f];
                delete fields[f];
            } else {
                // for scalar values, just extract the single value
                if (castNumber)
                    fields[f] = toNumber(fields[f][0]);
                else fields[f] = fields[f][0];
            }
        }
    }

    return qs.parse(fields);
};

/**
 * get the S3 display url based on node environment
 * @returns {string}
 */
helper.s3url = function s3url() {
    if (process.env.NODE_ENV == 'production') {
        return "http://files.bigredhacks.com";
    }
    else {
        return "https://" + config.setup.AWS_S3_bucket + ".s3.amazonaws.com";
    }
};

/**
 * upload a resume to aws
 * resume must be a multiparty file object
 * @param resume
 * @param options
 * @param callback
 * @returns {*}
 */
helper.uploadResume = function uploadResume(resume, options, callback) {
    if (!options) {
        options = {};
    }
    var filename = options.filename;

    // /check file validity
    if (resume.size > MAX_RESUME_SIZE) {
        return callback(null, "File is too big!");
    }

    if (resume.headers['content-type'] !== 'application/pdf') {
        return callback(null, 'File must be a pdf!');
    }

    //prepare to upload file
    var body = fs.createReadStream(resume.path);
    //generate a filename if not provided
    if (!filename) {
        filename = uid(15) + ".pdf";
    }
    console.log(filename);
    s3.putObject({
        Bucket: config.setup.AWS_S3_bucket,
        Key: RESUME_DEST + filename,
        ACL: 'public-read',
        Body: body,
        ContentType: 'application/pdf'
    }, function (err, res) {
        if (err) {
            callback(err);
        }
        else {
            res.filename = filename;
            return callback(err, res);
        }
    });
};

//deprecated
helper.deleteResume = function deleteResume(location, callback) {
    var params = {
        Bucket: 'STRING_VALUE', /* required */
        Key: 'STRING_VALUE' /* required */
    };
    s3.deleteObject(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });
};

helper.addSubscriber = function (listid, email, fname, lname, callback) {
    var mcReq = {
        id: listid,
        email: {email: email},
        double_optin: false,
        merge_vars: {
            EMAIL: email,
            FNAME: fname,
            LNAME: lname
        }
    };

    // submit subscription request to mail chimp
    mc.lists.subscribe(mcReq, function (data) {
        callback(null, data);
    }, function (error) {
        callback(error);
    });

};

module.exports = helper;