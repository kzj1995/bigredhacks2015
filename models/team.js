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

//todo consider making methods non-saving for conformity

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

teamSchema.methods.addUser = function(user_id, name, callback) {
    var pos = this.members.map(function(e) { return e.id.toString(); }).indexOf(user_id.toString()); //check whether user is in array
    if (this.members.length == MAX_TEAM_SIZE ) {
        return callback(null, "Your team is full. The current team limit is " + MAX_TEAM_SIZE + " members.");
    }
    else if (pos != -1) {
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

teamSchema.methods.removeUser = function(user_id, callback) {
    var index = this.members.indexOf(user_id);
    if (index != -1) {
        this.members.splice(this.members.indexOf(), 1);
        this.save(function(err){
            if (err){
                return callback(err);
            }
            //delete team if empty
            else if (this.members.length == 0) {
                this.remove(function(err) {
                    if (err) return callback(err);
                    else return callback(null, true);
                })
            }
            else return callback(null, true);
        })
    }
    else{
        //if this happens often, indicative of larger issue.
        console.log("Noncritical invariant error in team.removeUser for ", user_id);
    }

};

module.exports = mongoose.model("Team", teamSchema);