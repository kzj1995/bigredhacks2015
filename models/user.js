"use strict";
var mongoose = require('mongoose');
var _ = require('underscore');
var bcrypt = require('bcrypt-nodejs');

var college = require("./college.js");

//generate enums
var en = {
    year: (function () {
        var other = "HS".split(" "); //specify other years, i.e. hs, grad, etc
        var year = new Date().getFullYear();
        return other.concat(_.range(year, year + 4));
    })(),
    dietary: "none vegetarian vegan".split(" "),//@todo complete list
    tshirt: "S M L XL".split(" "),//@todo complete list
    status: "incomplete submitted rejected waitlisted accepted".split(" "),
    response: "going declined".split(" ")
};

//general user info
var userSchema = new mongoose.Schema({
    name: {
        first: {type: String, required: true},
        last: {type: String, required: true}
    },
    email: {type: String, required: true, lowercase: true, trim: true, index: true},
    password: {type: String, required: true},
    phone: {type: String, required: true},
    college: {type: String, ref: "College", required: true},
    year: {type: String, enum: en.year, required: true},
    major: String,
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
        rating: {type: Number, min: 0, max: 5, default: 0},
        status: {type: String, enum: en.status},
        response: {type: String, enum: en.response}
    }
});

userSchema.virtual('name.full').get(function() {
    return this.name.first + " " + this.name.last;
});

userSchema.pre('save', function(next) {
    var user = this;

    if(!user.isModified('password')) return next();

    bcrypt.genSalt(function(err, salt) {
        if(err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if(err) return next(err);
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function(candidatePassword, callback) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if(err) return callback(err);
        callback(null, isMatch);
    });
};

userSchema.statics.create = function() {

};

module.exports = mongoose.model("User", userSchema);