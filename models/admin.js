"use strict";
var mongoose = require("mongoose");
var user = require("./user.js");

//admin stuff (document-attribute)
//@todo cache these in a globally scoped var on each save
var admin = new mongoose.Schema({
    adminUsers: {type: [mongoose.Schema.Types.ObjectId], ref: "User"},
    info: {
        maxppl: {type: Number},
        eventDate: {type: String},
        attritionRate: {type: Number}
    },
    states: {
        acceptApps: {type: Boolean},
        releaseStatus: {type: Boolean}
    }
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