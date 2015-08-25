"use strict";
var mongoose = require('mongoose');

var en = require('./enum');
var College = require('./college');

var reimbursementSchema = new mongoose.Schema({
    college: {
        id: {type: String, ref: "College", index: true, required: true},
        name: {type: String, required: true}
    },
    mode: {type: String, enum: en.admin.travel_mode, required: true},
    amount: {type: Number, required: true}
});


module.exports = mongoose.model("Reimbursement", reimbursementSchema);