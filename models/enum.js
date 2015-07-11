"use strict";
var _ = require('underscore');

/*
Consistent list of enums used throughout the app.
 */
var en = {
    user: { //user params enforce database integrity
        year: "Freshman/Sophomore/Junior/Senior/Graduate Student".split("/"),
        dietary: "None Vegetarian Gluten-free".split(" "),
        gender: "Female/Male/Other/Prefer Not to Disclose".split("/"),
        tshirt: "XS S M L XL".split(" "),
        status: "Pending Accepted Waitlisted Rejected".split(" "), //take care when changing
        experience: "Yes No".split(" "), //store boolean state as string for simplicity
        role: "user admin".split(" ")
    },
    virtual: { //virtual params are used in front end display only - these should always correspond to above
        status: {
            long: "Accepted Waitlisted Rejected".split(" "), //longhand array
            short: "A W R".split(" ") //shorthand array
        },
        role: {
            long: "admin".split()//remove "user item"
        }
    }
};

module.exports = en;