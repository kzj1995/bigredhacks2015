"use strict";
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var College = require("./college.js");
var en = require("./enum.js");

var SALT_WORK_FACTOR = 10;

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
    year: {type: String, enum: en.user.year, required: true},
    major: {type: String, required: true},
    dietary: {type: String, enum: en.user.dietary},
    tshirt: {type: String, enum: en.user.tshirt},
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
        rating: {type: Number, min: 0, max: 5, default: 0},
        status: {type: String, enum: en.status},
        going: {type: Boolean}
    }
});

userSchema.virtual('name.full').get(function() {
    return this.name.first + " " + this.name.last;
});

userSchema.pre('save', function(next) {
    var user = this;

    if(!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if(err) return next(err);

        bcrypt.hash(user.password, salt, null, function(err, hash) {
            if(err) return next(err);
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.validPassword = function(candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.password);
};

userSchema.statics.create = function() {

};

module.exports = mongoose.model("User", userSchema);