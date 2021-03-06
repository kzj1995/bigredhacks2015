"use strict";
var mongoose = require('mongoose');
var College = require('./college');
var User = require('./user');

var busSchema = new mongoose.Schema({
    name: {type: String, required: true, index: true}, //bus route name
    stops: [{
        collegeid: {type: String, ref: "College", index: true},
        collegename: String
    }],
    capacity: {type: Number},
    members: [{
        name: String,
        college: String,
        id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}
    }]
});


module.exports = mongoose.model("Bus", busSchema);