"use strict";
var mongoose = require("mongoose");
var User = require("./user");

var team = new mongoose.Schema({
   members: [mongoose.Schema.Types.ObjectId]
});