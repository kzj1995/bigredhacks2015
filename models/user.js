"use strict";
var mongoose = require('mongoose');
var _ = require('underscore');

var college = require("./college.js");

//generate enums
var en = {
    year: (function () {
        var other = "HS".split(" "); //specify other years, i.e. hs, grad, etc
        var year = new Date().getFullYear;
        return other.concat(_.range(year, year + 4));
    })(),
    dietary: "none vegan".split(" "),//@todo complete list
    tshirt: "S M L XL".split(" "),//@todo complete list
    status: "incomplete submitted rejected waitlisted accepted declined going".split(" ") //@todo consider separating declined and going
};

//general user info
var userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: {type: String, lowercase: true, trim: true, index: true},
    phone: String,
    college: {type: mongoose.Schema.Types.ObjectId, ref: "College"},
    year: {type: String, enum: en.year},
    major: String,
    jobInterest: String,
    application: {
        github: String,
        linkedin: String,
        resume: String,
        questions: {
            q1: String,//@todo fill out with identifiers for questions
            q2: String
        }
    },
    internal: {
        busid: String, //@todo implement later
        dietary: {type: String, enum: en.dietary},
        tshirt: {type: String, enum: en.tshirt},
        status: {type: String, enum: en.status}
    },
    timestamp: {type: Date, default: Date.now()}
});