"use strict";
var mongoose = require("mongoose");
var User = require("./user");

var MAX_TEAM_SIZE = 5;

//todo cap size of team
var teamSchema = new mongoose.Schema({
   members: [ {
       id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
       name: {type: String, required: true}
    }]
});

/**
 * find a team by priuvate user_id
 * @param user_id
 * @param callback
 */
teamSchema.statics.findTeam = function(user_id, callback) {
    this.findOne({'members.id': user_id}, function(err, team) {
        if (err) {
            return callback(err);
        }
        else {
            callback(null, team);
        }
    })
};

/**
 * add a user by user id
 * @param user_id
 * @param name of user
 * @param callback
 * @returns {*}
 */
teamSchema.methods.addUser = function(user_id, name, callback) {
    var index = this.members.map(function(e) { return e.id.toString(); }).indexOf(user_id.toString()); //check whether user is in array
    if (this.members.length == MAX_TEAM_SIZE ) {
        return callback(null, "Your team is full. The current team limit is " + MAX_TEAM_SIZE + " members.");
    }
    else if (index != -1) {
        return callback(null, "User is already in your team!");
    }
    else this.members.push({
            id: user_id,
            name: name.first + ' ' + name.last
        });
    this.save(function(err, res) {
        if (err) callback(err);
        callback(null, res);
    });
};

/**
 * remove a user from current team by private id
 * @param user_id
 * @param callback
 * @returns {*}
 */
teamSchema.methods.removeUser = function(user_id, callback) {
    var _this = this;
    var index = _this.members.map(function(e) { return e.id.toString(); }).indexOf(user_id.toString()); //check whether user is in array
    if (index != -1) {
        _this.members.splice(index, 1);
        console.log(_this.members);
        _this.save(function(err, team){
            if (err){
                return callback(err);
            }
            //delete team if empty
            else if (_this.members.length == 0) {
                _this.remove(function(err) {
                    if (err) return callback(err);
                    else return callback(null, team);
                })
            }
            else return callback(null, team);
        })
    }
    else{
        //if this happens often, indicative of larger issue.
        console.log("Noncritical invariant error in team.removeUser for ", user_id);
        return callback(null,_this);
    }

};

module.exports = mongoose.model("Team", teamSchema);