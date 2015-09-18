"use strict";
var mongoose = require('mongoose');

var eventSchema = new mongoose.Schema({
    startday: {type: String}, //ex: 9/18
    starttime: {type: String}, //ex: 9:00 PM
    starttimeminutes: {type: Number}, //60 * hour of startime + min of starttime
    endday: {type: String}, //ex: 9/18
    endtime: {type: String}, //ex: 12:00 AM
    description: {type: String}, //description of event
    location: {type: String}, //location of event (ex: PSB 120)
    notificationShown: {type: Boolean, default: false} //whether or not a notification has already been shown for the event
});

module.exports = mongoose.model("Event", eventSchema);