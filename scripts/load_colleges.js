"use strict";
var Converter = require("csvtojson").core.Converter; //converter class
var fs = require("fs");
var college = require('../models/college.js');

//load colleges into database
//@todo optimize - don't load if records exist
/**
 * Load a list of colleges in /data into the database
 * This should be done before the app enters production
 * Invalidating and reloading list won't affect associations
 * @param callback
 */
var load  = function (callback) {
    var fileStream = fs.createReadStream("./data/us-colleges-2014.csv");
    //new converter instance
    var csvConverter = new Converter({constructResult: true});

    //read from file
    fileStream.pipe(csvConverter);

    csvConverter.on("record_parsed", function (res, rawRow, rowIndex) {
        college.add(res.unitid, res.name, res.city, res.state, res.zip, res.longitude, res.latitude,
            function(err) {
            if (err){
                callback(err + " " + rowIndex);
            }
        });
        //console.log(resultRow); //here is your result json object
    });

    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed",function(jsonObj){
        callback(null, "College adding finished.");
    });
};

module.exports = load;