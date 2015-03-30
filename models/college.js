"use strict";
var mongoose = require('mongoose');

var collegeSchema = new mongoose.Schema({
    unitID: Number, //unique college id
    name: String,
    city: String,
    state: String, //2 letter
    zip: String,
    loc: {
        type: {type: String},
        coordinates: [Number] //offic. convention is lon, lat
    },
    _distance: Number //internal param for use in geonear
});
collegeSchema.index({loc: '2dsphere'});