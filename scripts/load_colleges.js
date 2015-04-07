"use strict";
var async = require('async');
var Converter = require("csvtojson").core.Converter; //converter class
var fs = require("fs");
var college = require('../models/college.js');

var files = "./data/us-colleges-2014.csv ./data/us-colleges-other.csv".split(" ");

//load colleges into database
/**
 * Load a list of colleges in /data into the database
 * This should be done before the app enters production
 * Invalidating and reloading list won't affect associations
 * @param callback
 */
var load = function (callback) {
    console.log("Adding colleges...");
    async.each(files, loadFromFile, function (err) {
        if (err) {
            console.log(err);
            callback(err);
        }
        else {
            callback(err);
            console.log("Adding colleges finished.");
        }
    });
};

function loadFromFile(filepath, done) {
    var fileStream = fs.createReadStream(filepath);
    //new converter instance
    var csvConverter = new Converter({constructResult: true});

    //read from file
    fileStream.pipe(csvConverter);

    csvConverter.on("record_parsed", function (res, rawRow, rowIndex) {
        college.add(res.unitid, res.name, res.city, res.state, res.zip, res.longitude, res.latitude,
            function (err) {
                if (err) {
                    done(err + " " + filepath + " " + rowIndex);
                }
            });
        //console.log(resultRow); //here is your result json object
    });

    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed", function (jsonObj) {
        console.log("Finished for ", filepath);
        done();
    });
}

module.exports = load;