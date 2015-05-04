"use strict";
var _ = require('underscore');

/*
Consistent list of enums used throughout the app
 */
var en = {
    user: {
        year: _generateYears(),
        dietary: "None Vegetarian Gluten-free".split(" "),
        gender: "Female Male Other".split(" "),
        tshirt: "XS S M L XL".split(" "),
        status: "Incomplete Submitted Rejected Waitlisted Accepted".split(" "),
        experience: "Yes No".split(" "),//store boolean state as string for simplicity
        projecttype: "Not sure/Hardware/Software".split("/")
    }
};

/**
 * dynamically generate list of the next four years + any additional params
 * @returns {Array.<T>}
 * @private
 */
function _generateYears() {
    var other = "".split(" "); //specify other years, i.e. hs, grad, etc
    if (other == "") {
        other = [];
    }
    var year = new Date().getFullYear();
    return other.concat(_.range(year, year + 4));
}

module.exports = en;