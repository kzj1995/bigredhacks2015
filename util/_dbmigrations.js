var async = require("async");
var User = require("../models/user");
var migration = {};

/**
 * Back fill missing internal.status for users who applied before the default status was set to pending.
 * @year 2015
 * @deprecated
 */
migration.backFillStatus = function() {
    User.find( {'internal.status': {$exists: false}}).exec(function (err, users) {
        async.each(users, function(user,done) {
            console.log(user.internal.status);
            user.internal.status = "Pending";
            user.save(done);
        }, function(err) {
            if (err) {
                console.error(err);
            }
            else {
                console.log("Migration completed.")
            }
        })
    })
};

module.exports = migration;