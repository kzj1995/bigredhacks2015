"use strict";
var mongoose = require('mongoose');
var User = require('./user');
var en = require("./enum.js");

var mentorRequestSchema = new mongoose.Schema({
    pubid: {type: String, index: {unique: true}}, //public facing mentor request id
    user: { //user who makes the mentorship request
        name: {type: String, required: true},
        id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}
    },
    description: {type: String, required: true}, //description of problem/reason for mentorship request
    skills: [String], //list of skills the project involves/desired in mentor
    requeststatus: {type: String, enum: en.mentorrequest.status, default: "Unclaimed"},
    location: {type: String, required: true}, //location of user who made the request (ex: seat number, area number, etc.)
    numpossiblementors: {type: Number, default: 0},
    mentor: { //mentor who claims request
        name: {type: String, default: null},
        company: {type: String, default: null},
        id: {type: mongoose.Schema.Types.ObjectId, ref: "User", default: null}
    }
});

module.exports = mongoose.model("MentorRequest", mentorRequestSchema);