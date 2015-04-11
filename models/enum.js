"use strict";
var _ = require('underscore');

//generate enums
var en = {
    user: {
        year: (function () {
            var other = "".split(" "); //specify other years, i.e. hs, grad, etc
            if (other == "") {
                other = [];
            }
            var year = new Date().getFullYear();
            return other.concat(_.range(year, year + 4));
        })(),
        dietary: "None Vegetarian Gluten-free".split(" "),
        gender: "Female Male Other".split(" "),
        tshirt: "XS S M L XL".split(" "),
        status: "Incomplete Submitted Rejected Waitlisted Accepted".split(" ")
    }
};

module.exports = en;