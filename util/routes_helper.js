"use strict";
var helper = {};
var AWS = require('aws-sdk');
var uid = require('uid2');
var fs = require('fs');
var qs = require('qs');
var mcapi = require('mailchimp-api');

var config = require('../config.js');

var MAX_RESUME_SIZE = 1024 * 1024 * 5;
var MAX_RECEIPT_SIZE = 1024 * 1024 * 10;

var RESUME_DEST = 'resume/';
var RECEIPT_DEST = 'travel/';

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
 * @param file
 * @param options
 * @param callback
 * @returns {*}
 */
helper.uploadFile = function uploadFile(file, options, callback) {
    if (!options) {
        options = {};
    }
    var dest, max_size;
    if (options.type == "resume") {
        dest = RESUME_DEST;
        max_size = MAX_RESUME_SIZE;
    } else if (options.type == "receipt") {
        dest = RECEIPT_DEST;
        max_size = MAX_RECEIPT_SIZE;
    } else {
        console.error("uploadFile must define options.type");
    }
    var filename = options.filename;

    // /check file validity
    if (file.size > max_size) {
        return callback(null, "File is too big!");
    }

    if (file.headers['content-type'] !== 'application/pdf') {
        return callback(null, 'File must be a pdf!');
    }

    //prepare to upload file
    var body = fs.createReadStream(file.path);
    //generate a filename if not provided
    if (!filename) {
        filename = uid(15) + ".pdf";
    }
    //console.log(filename);
    s3.putObject({
        Bucket: config.setup.AWS_S3_bucket,
        Key: dest + filename,
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

/**
 * add a subscriber to a mailchimp mailing list
 * @param listid mailchimp listid
 * @param email email to send to
 * @param fname first name of recipeint
 * @param lname last name of recipient
 * @param callback
 */
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