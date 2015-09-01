"use strict";
var _ = require('underscore');

/*
 Consistent list of enums used throughout the app.
 */
var en = {
    user: { //user params enforce database integrity
        year: "Freshman.Sophomore.Junior.Senior.Graduate Student.N/A".split("."),
        dietary: "None Vegetarian Gluten-free".split(" "),
        gender: "Female/Male/Other/Prefer Not to Disclose".split("/"),
        tshirt: "XS.S.M.L.XL.N/A".split("."),
        status: "Pending Accepted Waitlisted Rejected".split(" "), //take care when changing
        experience: "Yes.No.N/A".split("."), //store boolean state as string for simplicity
        role: "user/admin/bus captain/test/mentor".split("/")
    },
    admin: {
        travel_mode: "Charter Bus/Other".split("/")
    },
    virtual: { //virtual params are used in front end display only - these should always correspond to above
        status: {
            long: "Accepted Waitlisted Rejected".split(" "), //longhand array
            short: "A W R".split(" ") //shorthand array
        },
        role: {
            long: "test/bus captain/admin/mentor".split("/")//remove "user item"
        }
    },
    mentor: {
        companyname: "Capital One/Uber/Priceline.com/Bloomberg/Andreessen Horowitz/Goldman Sachs/MathWorks".split("/"),
        companyimage: "capitalone.png/uber.png/priceline.png/bloomberg.png/a16z.png/goldmansachs.png/mathworks.png".split("/")
    }
};

module.exports = en;