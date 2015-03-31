"use strict";
var mongoose = require('mongoose');

var schemaOptions = {
    toObject: {
        virtuals: true
    }
    ,toJSON: {
        virtuals: true
    }
};

var collegeSchema = new mongoose.Schema({
    _id: {type: String, required: true, unique: true}, //unique college id
    name: {type: String, required: true},
    city: {type: String},
    state: {type: String}, //2 letter
    zip: String,
    loc: {
        type: {type: String},
        coordinates: [Number] //offic. convention is lon, lat
    },
    _distance: Number //internal param for use in geonear
}, schemaOptions);
collegeSchema.index({loc: '2dsphere'});

//display name of college
collegeSchema.virtual('display').get(function () {
    return this.name + " - " + this.state;
});

collegeSchema.statics.add = function (unitid, name, city, state, zip, lon, lat, callback) {
    var college = new this({
        _id: unitid,
        name: name,
        city: city,
        state: state,
        zip: zip,
        loc: {
            type: "Point",
            coordinates: [parseFloat(lon), parseFloat(lat)]
        }
    });

    this.findOne({_id: unitid}, function (err, res) {
        if (res === null) {
            //entry does not exist
            college.save(function (err) {
                callback(err, college);
            });
        }
    });
};

collegeSchema.statics.getAll = function (callback) {
    this.find({}, function (err, res) {
        console.log(res);
        if (err) {
            callback(err);
        }
        res = res.map(function (x) {
            return {
                id: x._id,
                name: x.display
            }
        });
        callback(null, res);
    });
};


module.exports = mongoose.model("College", collegeSchema);