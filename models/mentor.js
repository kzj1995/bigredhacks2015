"use strict";
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var SALT_WORK_FACTOR = 10;

var mentorSchema = new mongoose.Schema({
    name: {
        first: {type: String, required: true},
        last: {type: String, required: true}
    },
    email: {type: String, required: true, lowercase: true, trim: true, index: {unique: true}},
    password: {type: String, required: true},
    company: {type: String, required: true},
    skills: [String],
    bio: {type: String, required: true}
});

mentorSchema.pre('save', function (next) {
    var _this = this;

    //verify password is present
    if (!_this.isModified('password')) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);

        bcrypt.hash(_this.password, salt, null, function (err, hash) {
            if (err) return next(err);
            _this.password = hash;
            next();
        });
    });
});


module.exports = mongoose.model("Mentor", mentorSchema);