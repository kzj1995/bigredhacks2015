"use strict";
var _ = require('underscore');

/*
Consistent list of enums used throughout the app
 */
var en = {
    user: {
        year: "Freshman/Sophomore/Junior/Senior/Graduate Student".split("/"),
        dietary: "None Vegetarian Gluten-free".split(" "),
        gender: "Female/Male/Other/Prefer Not to Disclose".split("/"),
        tshirt: "XS S M L XL".split(" "),
        status: "Incomplete Submitted Rejected Waitlisted Accepted".split(" "),
        experience: "Yes No".split(" "),//store boolean state as string for simplicity
        projecttype: "Not sure/Hardware/Software".split("/")
    }
};

module.exports = en;