"use strict";
var _ = require('underscore');

//generate enums
var en = {
    year: (function () {
        var other = "HS".split(" "); //specify other years, i.e. hs, grad, etc
        var year = new Date().getFullYear();
        return other.concat(_.range(year, year + 4));
    })(),
    dietary: "none vegetarian vegan".split(" "),//@todo complete list
    tshirt: "S M L XL".split(" "),//@todo complete list
    status: "incomplete submitted rejected waitlisted accepted".split(" "),
};

module.exports = en;