"use strict";
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var uid = require('uid2');

var College = require("./college.js");
var Team = require("./team.js");
var en = require("./enum.js");

var SALT_WORK_FACTOR = 10;

//general user info
var userSchema = new mongoose.Schema({
    pubid: {type: String, index: {unique: true}}, //public facing userid
    name: {
        firstname: {type: String, required: true},
        lastname: {type: String, required: true}
    },
    gender: {type: String, enum: en.user.gender}, //FIXME add validations
    email: {type: String, required: true, lowercase: true, trim: true, index: {unique: true}},
    password: {type: String, required: true},
    phone: {type: String, required: true},
    collegeid: {type: String, ref: "College", required: true},
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
        teamid: {type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null},
        busid: {type: String, default: null}, //@todo implement later
        rating: {type: Number, min: 0, max: 5, default: 0},
        status: {type: String, enum: en.status},
        going: {type: Boolean}
    }
});

userSchema.virtual('name.full').get(function() {
    return this.name.first + " " + this.name.last;
});

//todo validate existence of college
userSchema.pre('save', function(next) {
    var user = this;

    //add a public uid for the user
    //TODO consider moving to create
    if (typeof user.pubid === "undefined") {
        user.pubid = uid(10);
    }

    //verify password is present
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

//todo cleanup with async library
userSchema.addToTeam = function(pubid, callback) {
    var user = this;
    var other = user.findOne({pubid: pubid}, function(err, res) {
        if (err) {
            return callback(err);
        }
        if (res === null) {
            return callback(null, "User does not exist.");
        }
        else if (res.internal.teamid !== null) {
            return callback(null, "User already belongs to a team!");
        }
        //current user doesn't have a team
        if (user.internal.teamid === null) {
            var team = new Team();
            team.addUser(user._id, function(err, newteam){
                if (err) return callback(err);
                if (typeof newteam == 'string') {
                    return callback(null, newteam);
                }
                else user.save(function(err) {
                    if (err) return callback(err);
                    else newteam.addUser(other._id, function(err, res) {
                        if (err) return callback(err);
                        return callback(null, res);
                    });
                });
            });
        }
        else {
            user.populate("internal.teamid", function (err, team) {
                if (err) {
                    return callback(err);
                }
                else team.addUser(other._id, function(err, res){
                    return callback(err, res);
                });
            })
        }
    });
};

//todo cleanup with async library
userSchema.leaveTeam = function(callback) {
    var user = this;
    if (typeof user.internal.teamid === null) {
        return callback(null, "Currently not in a team.");
    }
    else {
        user.populate("internal.teamid", function(err, team) {
            if (err) {
                return callback(err);
            }
            team.removeUser(user._id, function(err, team) {
                if (err){
                    return callback(err);
                }
                user.internal.teamid = null;
                user.save(function(err) {
                    if (err) return callback(err);
                    else return callback(null, true);
                });
            })
        })
    }
};

module.exports = mongoose.model("User", userSchema);