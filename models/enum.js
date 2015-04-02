"use strict";
var _ = require('underscore');

//generate enums
var en = {
    user: {
        year: (function () {
            var other = "HS".split(" "); //specify other years, i.e. hs, grad, etc
            var year = new Date().getFullYear();
            return other.concat(_.range(year, year + 4));
        })(),
        dietary: "None Vegetarian Vegan".split(" "),//@todo complete list
        tshirt: "S M L XL".split(" "),//@todo complete list
        status: "Incomplete Submitted Rejected Waitlisted Accepted".split(" ")
    }
};

module.exports = en;