"use strict";
var mongoose = require("mongoose");
var User = require("./user");

//todo cap size of team
var teamSchema = new mongoose.Schema({
   members: [ {type: mongoose.Schema.Types.ObjectId, ref: "User"} ]
});

//todo consider making methods non-saving for conformity


teamSchema.methods.addUser = function(user_id, callback) {
    if (this.members.length == 5 ) {
        return callback(null, "Too many team members.");
    }
    else if (this.members.indexOf(user_id) != -1) {
        return callback(null, "User is already in team!");
    }
    else this.members.push(user_id);
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