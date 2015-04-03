"use strict";
var mongoose = require("mongoose");
var user = require("./user.js");

//admin stuff (document-attribute)
//@todo cache these in a globally scoped var on each save
var admin = new mongoose.Schema({
    adminUsers: {type: [mongoose.Schema.Types.ObjectId], ref: "User"},
    states: {
        acceptApps: {type: Boolean},
        releaseStatus: {type: Boolean}
    }
    //@todo moar stuff
});

//schedule entry for use with api and dashboard
var scheduleSchema = new mongoose.Schema({
    name: String,
    description: String,
    location: String,
    start: Date,
    end: Date,
    timestamp: {type: Date, defualt: Date.now()}
});

//event blast log to keep track of messages that were blasted
//@todo: consider integrating with a general event log
//idea behind this is to see what actions other organizers
//have taken so another organizer doesn't do the same thing again :p
//i.e. minimize communication errors
var blastlog = new mongoose.Schema({
    by: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    text: String,
    date: Date.now()
});